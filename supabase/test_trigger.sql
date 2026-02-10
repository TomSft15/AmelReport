-- ============================================
-- SCRIPT DE TEST : Tester le trigger manuellement
-- ============================================

-- 1. Créer une invitation de test
INSERT INTO invitations (email, token, expires_at, status, invited_by)
VALUES (
  'test-trigger@example.com',
  gen_random_uuid()::text,
  NOW() + INTERVAL '7 days',
  'pending',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT (email) DO UPDATE
SET status = 'pending',
    expires_at = NOW() + INTERVAL '7 days';

-- 2. Vérifier que l'invitation existe
SELECT * FROM invitations WHERE email = 'test-trigger@example.com';

-- 3. Instructions pour tester :
-- Maintenant, essayez de créer un compte avec l'email 'test-trigger@example.com'
-- via l'interface d'inscription

-- 4. Après la création, vérifiez :
SELECT
  'auth.users' as table_name,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
WHERE u.email = 'test-trigger@example.com'

UNION ALL

SELECT
  'profiles' as table_name,
  p.id,
  p.email,
  p.created_at
FROM profiles p
WHERE p.email = 'test-trigger@example.com';

-- 5. Vérifier le statut du profil
SELECT
  email,
  invitation_status,
  display_name,
  invited_by,
  invited_at,
  created_at
FROM profiles
WHERE email = 'test-trigger@example.com';

-- 6. Vérifier l'invitation
SELECT
  email,
  status,
  accepted_at
FROM invitations
WHERE email = 'test-trigger@example.com';

-- ============================================
-- NETTOYAGE (après test)
-- ============================================
-- Décommentez ces lignes pour nettoyer après le test

-- DELETE FROM auth.users WHERE email = 'test-trigger@example.com';
-- DELETE FROM profiles WHERE email = 'test-trigger@example.com';
-- DELETE FROM invitations WHERE email = 'test-trigger@example.com';
