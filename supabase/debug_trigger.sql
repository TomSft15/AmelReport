-- ============================================
-- SCRIPT DE DEBUG : Vérifier l'état du trigger
-- ============================================

-- 1. Vérifier si le trigger existe et est actif
SELECT
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    c.relname as table_name,
    n.nspname as schema_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';

-- 2. Vérifier la définition de la fonction handle_new_user
SELECT pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';

-- 3. Vérifier s'il y a des users dans auth.users sans profil
SELECT
    u.id,
    u.email,
    u.created_at,
    p.id as profile_exists
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 4. Vérifier les invitations en attente
SELECT
    email,
    status,
    expires_at,
    created_at
FROM invitations
WHERE status = 'pending'
ORDER BY created_at DESC;
