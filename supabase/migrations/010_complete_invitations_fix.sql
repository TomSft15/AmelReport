-- ============================================
-- MIGRATION COMPLÈTE : Système d'Invitations
-- ============================================
-- Cette migration crée la table invitations et met à jour le trigger
-- pour gérer correctement la création de profils avec statut 'active'

-- 1. Créer la table invitations si elle n'existe pas
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- 2. Créer les indexes
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- 3. Activer RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Admins peuvent voir toutes les invitations" ON invitations;
DROP POLICY IF EXISTS "Admins peuvent créer des invitations" ON invitations;
DROP POLICY IF EXISTS "Admins peuvent modifier des invitations" ON invitations;
DROP POLICY IF EXISTS "Admins peuvent supprimer des invitations" ON invitations;
DROP POLICY IF EXISTS "Tout le monde peut lire une invitation par token" ON invitations;
DROP POLICY IF EXISTS "Allow invitation updates" ON invitations;

-- 5. Créer les policies RLS pour invitations
CREATE POLICY "Admins peuvent tout faire avec invitations"
  ON invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Tout le monde peut lire une invitation"
  ON invitations FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Système peut mettre à jour invitations"
  ON invitations FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 6. Mettre à jour le trigger handle_new_user
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
    -- With invitation - create active profile
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
      'active',  -- ✅ ACTIVE directement
      v_invitation.invited_by,
      v_invitation.created_at,
      NOW()
    );

    -- Mark invitation as accepted
    UPDATE public.invitations
    SET
      status = 'accepted',
      accepted_at = NOW()
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

-- 7. Marquer les anciennes colonnes comme deprecated
COMMENT ON COLUMN profiles.invitation_token IS 'DEPRECATED - Use invitations table instead';
COMMENT ON COLUMN profiles.invitation_expires_at IS 'DEPRECATED - Use invitations table instead';

-- ============================================
-- Migration terminée ✅
-- ============================================
