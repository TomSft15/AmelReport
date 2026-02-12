-- ============================================
-- Script pour Réinitialiser une Invitation Bloquée
-- ============================================
-- Utilisez ce script pour réinitialiser l'invitation de thomasfifi92@gmail.com
-- qui est bloquée avec le statut 'accepted'

-- 1. Vérifier l'état actuel
SELECT
  i.email,
  i.status as invitation_status,
  i.created_at,
  i.accepted_at,
  p.invitation_status as profile_status,
  p.display_name,
  au.email_confirmed_at
FROM invitations i
LEFT JOIN profiles p ON p.email = i.email
LEFT JOIN auth.users au ON au.email = i.email
WHERE i.email = 'thomasfifi92@gmail.com';

-- 2. Option A: Supprimer complètement et réinviter (RECOMMANDÉ)
-- Décommentez les lignes ci-dessous pour exécuter

-- DELETE FROM auth.users WHERE email = 'thomasfifi92@gmail.com';
-- DELETE FROM invitations WHERE email = 'thomasfifi92@gmail.com';
-- -- Ensuite, réinvitez l'utilisateur via l'interface admin /admin/users

-- 3. Option B: Réinitialiser le statut à 'user_created'
-- Utilisez ceci si vous voulez garder l'utilisateur existant

-- UPDATE invitations
-- SET status = 'user_created',
--     accepted_at = NULL
-- WHERE email = 'thomasfifi92@gmail.com';

-- UPDATE profiles
-- SET invitation_status = 'pending',
--     display_name = ''
-- WHERE email = 'thomasfifi92@gmail.com';

-- 4. Vérifier après la correction
-- SELECT
--   i.email,
--   i.status as invitation_status,
--   p.invitation_status as profile_status,
--   p.display_name
-- FROM invitations i
-- LEFT JOIN profiles p ON p.email = i.email
-- WHERE i.email = 'thomasfifi92@gmail.com';
