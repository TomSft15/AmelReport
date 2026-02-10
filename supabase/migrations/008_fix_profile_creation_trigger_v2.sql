-- Add policy to allow updating invitations when accepting (via trigger)
-- The trigger runs as SECURITY DEFINER so it needs permission to update
CREATE POLICY "Système peut mettre à jour les invitations"
  ON invitations FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Update the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_invitation RECORD;
  v_display_name TEXT;
BEGIN
  -- Get display_name from user metadata if provided
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', '');

  -- Try to find a pending invitation for this email
  BEGIN
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
  EXCEPTION
    WHEN OTHERS THEN
      -- If we can't access invitations table, just create a basic profile
      v_invitation := NULL;
  END;

  -- Create profile based on whether invitation exists
  IF v_invitation.id IS NOT NULL THEN
    -- Invitation found - create active profile
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

    -- Try to mark invitation as accepted (don't fail if this doesn't work)
    BEGIN
      UPDATE public.invitations
      SET
        status = 'accepted',
        accepted_at = NOW()
      WHERE id = v_invitation.id;
    EXCEPTION
      WHEN OTHERS THEN
        -- Ignore update errors - profile is already created
        NULL;
    END;
  ELSE
    -- No valid invitation - create pending profile
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
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Error in handle_new_user trigger: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
