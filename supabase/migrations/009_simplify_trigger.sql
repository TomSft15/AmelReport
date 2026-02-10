-- First, let's drop conflicting policies and recreate them properly
DROP POLICY IF EXISTS "Admins peuvent modifier des invitations" ON invitations;
DROP POLICY IF EXISTS "Système peut mettre à jour les invitations" ON invitations;

-- Allow invitations to be updated (needed for the trigger to mark as accepted)
CREATE POLICY "Allow invitation updates"
  ON invitations FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Simplified trigger that focuses on profile creation
-- The invitation will be marked as accepted by the application code
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
      'active',
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
