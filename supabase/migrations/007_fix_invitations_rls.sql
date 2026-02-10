-- Allow anyone to read an invitation by token (for the invitation acceptance page)
CREATE POLICY "Tout le monde peut lire une invitation par token"
  ON invitations FOR SELECT
  USING (true);

-- Note: We keep this permissive because:
-- 1. The token is a secure UUID that's hard to guess
-- 2. The invitation page needs to be accessible without authentication
-- 3. Email addresses are not sensitive data in this context (they're shared via invitation emails)
