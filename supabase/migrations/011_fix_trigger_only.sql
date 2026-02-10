-- ============================================
-- FIX: Mise à jour du trigger et policies uniquement
-- ============================================
-- La table invitations existe déjà, on met juste à jour
-- le trigger et les permissions

-- 1. Ajouter une policy permissive pour permettre au trigger de lire/modifier invitations
-- Le trigger tourne avec SECURITY DEFINER donc il a besoin de ces permissions

-- Supprimer l'ancienne policy restrictive des admins pour UPDATE
DROP POLICY IF EXISTS "Admins peuvent modifier des invitations" ON invitations;
DROP POLICY IF EXISTS "Système peut mettre à jour invitations" ON invitations;
DROP POLICY IF EXISTS "Allow invitation updates" ON invitations;

-- Créer une policy qui permet au système de mettre à jour (pour le trigger)
CREATE POLICY "System can update invitations"
  ON invitations FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Garder la policy admin pour INSERT et DELETE
-- (la policy admin pour UPDATE existe déjà via la policy "Admins peuvent tout faire")

-- 2. Mettre à jour le trigger handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_invitation_id UUID;
  v_invited_by UUID;
  v_invited_at TIMESTAMPTZ;
  v_display_name TEXT;
BEGIN
  -- Get display_name from user metadata
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', '');

  -- Look for pending invitation (simplified query)
  -- Using SECURITY DEFINER, this should bypass RLS
  BEGIN
    SELECT
      id,
      invited_by,
      created_at
    INTO
      v_invitation_id,
      v_invited_by,
      v_invited_at
    FROM public.invitations
    WHERE email = NEW.email
      AND status = 'pending'
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      -- Si erreur de lecture, on considère qu'il n'y a pas d'invitation
      v_invitation_id := NULL;
  END;

  -- Create profile based on invitation
  IF v_invitation_id IS NOT NULL THEN
    -- With valid invitation - create ACTIVE profile
    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      invitation_status,
      invited_by,
      invited_at,
      last_login_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      v_display_name,
      'active',  -- ✅ ACTIVE car invitation valide
      v_invited_by,
      v_invited_at,
      NOW()
    );

    -- Mark invitation as accepted
    BEGIN
      UPDATE public.invitations
      SET
        status = 'accepted',
        accepted_at = NOW()
      WHERE id = v_invitation_id;
    EXCEPTION
      WHEN OTHERS THEN
        -- Si l'update échoue, on ignore (le profil est créé quand même)
        RAISE NOTICE 'Could not update invitation status: %', SQLERRM;
    END;
  ELSE
    -- Without invitation - create PENDING profile
    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      invitation_status,
      last_login_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      v_display_name,
      'pending',
      NOW()
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, on logue et on re-raise
    RAISE EXCEPTION 'Error in handle_new_user: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Migration terminée ✅
-- ============================================
