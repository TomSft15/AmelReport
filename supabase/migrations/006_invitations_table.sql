-- Create invitations table to store pending invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Index for faster token lookups
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);

-- RLS Policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins can see all invitations
CREATE POLICY "Admins peuvent voir toutes les invitations"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can create invitations
CREATE POLICY "Admins peuvent créer des invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update invitations
CREATE POLICY "Admins peuvent modifier des invitations"
  ON invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete invitations
CREATE POLICY "Admins peuvent supprimer des invitations"
  ON invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Remove invitation-related columns from profiles (we'll keep them for backward compatibility but mark them as deprecated)
COMMENT ON COLUMN profiles.invitation_token IS 'DEPRECATED - Use invitations table instead';
COMMENT ON COLUMN profiles.invitation_expires_at IS 'DEPRECATED - Use invitations table instead';
COMMENT ON COLUMN profiles.invited_by IS 'DEPRECATED - Use invitations table instead';
COMMENT ON COLUMN profiles.invited_at IS 'DEPRECATED - Use invitations table instead';
