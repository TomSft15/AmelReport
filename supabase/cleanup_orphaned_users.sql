-- ============================================
-- NETTOYAGE : Utilisateurs orphelins
-- ============================================
-- Trouve et supprime les users dans auth.users sans profil

-- 1. LISTER les utilisateurs orphelins (sans profil)
SELECT
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  'ORPHELIN - Pas de profil' as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 2. SUPPRIMER tous les utilisateurs orphelins
-- ⚠️ Attention : Cette requête va supprimer tous les users sans profil
-- Décommentez la ligne suivante pour exécuter le nettoyage :

-- DELETE FROM auth.users
-- WHERE id IN (
--   SELECT u.id
--   FROM auth.users u
--   LEFT JOIN profiles p ON u.id = p.id
--   WHERE p.id IS NULL
-- );

-- 3. Vérification après nettoyage
-- Décommentez pour vérifier qu'il n'y a plus d'orphelins :

-- SELECT COUNT(*) as orphaned_users_count
-- FROM auth.users u
-- LEFT JOIN profiles p ON u.id = p.id
-- WHERE p.id IS NULL;
