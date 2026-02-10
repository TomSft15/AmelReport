-- ============================================
-- SCRIPT DE VÉRIFICATION DÉPLOIEMENT
-- ============================================
-- Exécuter dans Supabase SQL Editor avant de configurer les URLs

-- 1. Vérifier que toutes les tables existent
SELECT 'Tables existantes:' as check_name;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Devrait afficher au moins:
-- - article_categories
-- - articles
-- - categories
-- - comments
-- - invitations
-- - profiles

-- 2. Vérifier que le trigger existe
SELECT 'Trigger handle_new_user:' as check_name;
SELECT
    t.tgname as trigger_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'enabled'
        WHEN 'D' THEN 'disabled'
        ELSE 'unknown'
    END as status,
    c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname = 'on_auth_user_created';

-- Devrait afficher:
-- trigger_name: on_auth_user_created
-- status: enabled
-- table_name: users

-- 3. Vérifier qu'un admin existe
SELECT 'Utilisateurs admin:' as check_name;
SELECT
    email,
    role,
    invitation_status,
    created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at;

-- Devrait afficher au moins 1 admin avec invitation_status = 'active'

-- 4. Vérifier les buckets Storage
SELECT 'Buckets Storage:' as check_name;
SELECT
    name,
    public,
    created_at
FROM storage.buckets
ORDER BY name;

-- Devrait afficher:
-- - article-images (public: true)
-- - avatars (public: true)

-- 5. Vérifier les policies RLS
SELECT 'RLS Policies sur profiles:' as check_name;
SELECT
    policyname,
    cmd as command
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

SELECT 'RLS Policies sur invitations:' as check_name;
SELECT
    policyname,
    cmd as command
FROM pg_policies
WHERE tablename = 'invitations'
ORDER BY policyname;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- ✅ 6 tables minimum
-- ✅ Trigger actif
-- ✅ Au moins 1 admin actif
-- ✅ 2 buckets Storage publics
-- ✅ Policies RLS sur toutes les tables
-- ============================================
