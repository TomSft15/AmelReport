-- ============================================
-- FIX: Invitation status workflow
-- ============================================
-- Problème: Le trigger marque l'invitation comme 'accepted' trop tôt
-- Solution: Créer un statut intermédiaire 'user_created' pour indiquer
-- que l'utilisateur a été créé mais n'a pas encore complété son profil

-- 1. Ajouter un nouveau statut 'user_created'
-- Supprimer l'ancienne contrainte
ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_status_check;

-- Ajouter la nouvelle contrainte avec le nouveau statut
ALTER TABLE invitations
  ADD CONSTRAINT invitations_status_check
  CHECK (status IN ('pending', 'user_created', 'accepted', 'expired'));

-- 2. Mettre à jour le trigger pour utiliser 'user_created' au lieu de 'accepted'
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_invitation RECORD;
  v_display_name TEXT;
BEGIN
  -- Get display_name from user metadata
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', '');

  -- Look for pending invitation
  SELECT
    id,
    invited_by,
    created_at
  INTO v_invitation
  FROM public.invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Create profile
  IF v_invitation.id IS NOT NULL THEN
    -- With invitation - create profile with status 'pending'
    -- (will be updated to 'active' when user completes profile)
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
      'pending',  -- ⚠️ PENDING, sera 'active' après completion du profil
      v_invitation.invited_by,
      v_invitation.created_at,
      NOW()
    );

    -- Mark invitation as 'user_created' (pas encore 'accepted')
    -- L'invitation sera marquée 'accepted' quand l'utilisateur soumettra le formulaire
    UPDATE public.invitations
    SET status = 'user_created'
    WHERE id = v_invitation.id;
  ELSE
    -- Without invitation - create pending profile
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Migration terminée ✅
-- ============================================
