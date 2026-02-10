-- ============================================
-- MIGRATION: Recréer complètement le trigger
-- ============================================

-- 1. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Supprimer l'ancienne fonction s'il existe
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 3. Créer la nouvelle fonction avec logs détaillés
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_invitation_id UUID;
  v_invited_by UUID;
  v_invited_at TIMESTAMPTZ;
  v_display_name TEXT;
BEGIN
  -- Log pour debug (visible dans Postgres logs)
  RAISE NOTICE 'handle_new_user triggered for email: %', NEW.email;

  -- Get display_name from user metadata
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', '');
  RAISE NOTICE 'Display name: %', v_display_name;

  -- Look for pending invitation
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

    IF v_invitation_id IS NOT NULL THEN
      RAISE NOTICE 'Found invitation: %', v_invitation_id;
    ELSE
      RAISE NOTICE 'No invitation found for email: %', NEW.email;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error looking up invitation: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
      v_invitation_id := NULL;
  END;

  -- Create profile based on invitation
  BEGIN
    IF v_invitation_id IS NOT NULL THEN
      -- With valid invitation - create ACTIVE profile
      RAISE NOTICE 'Creating ACTIVE profile for user: %', NEW.id;

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
        v_invited_by,
        v_invited_at,
        NOW()
      );

      RAISE NOTICE 'Profile created successfully';

      -- Mark invitation as accepted
      BEGIN
        UPDATE public.invitations
        SET
          status = 'accepted',
          accepted_at = NOW()
        WHERE id = v_invitation_id;

        RAISE NOTICE 'Invitation marked as accepted';
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Could not update invitation: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
      END;
    ELSE
      -- Without invitation - create PENDING profile
      RAISE NOTICE 'Creating PENDING profile for user: %', NEW.id;

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

      RAISE NOTICE 'Profile created successfully';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Error creating profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

-- 4. Créer le trigger sur auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Vérifier que le trigger est bien créé
DO $$
DECLARE
  v_trigger_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_trigger_count
  FROM pg_trigger
  WHERE tgname = 'on_auth_user_created';

  IF v_trigger_count > 0 THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created créé avec succès';
  ELSE
    RAISE EXCEPTION '❌ Échec de création du trigger';
  END IF;
END $$;

-- ============================================
-- Migration terminée ✅
-- ============================================
