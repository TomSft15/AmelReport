-- Update the handle_new_user function to set invitation_status to 'active' if invitation exists
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_invitation RECORD;
  v_display_name TEXT;
BEGIN
  -- Get display_name from user metadata if provided
  v_display_name := NEW.raw_user_meta_data->>'display_name';

  -- Check if there's a pending invitation for this email
  SELECT * INTO v_invitation
  FROM invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW()
  LIMIT 1;

  -- If invitation exists, create profile with active status
  IF v_invitation.id IS NOT NULL THEN
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
    UPDATE invitations
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE id = v_invitation.id;
  ELSE
    -- No invitation found, create profile with pending status (default)
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, v_display_name);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
