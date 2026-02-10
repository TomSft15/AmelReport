-- ============================================
-- FIX CRITIQUE: Permettre l'INSERT dans profiles
-- ============================================
-- Le trigger handle_new_user() ne peut pas insérer dans profiles
-- car il n'y a pas de policy INSERT qui le permet

-- 1. Ajouter une policy qui permet l'INSERT de profils par le système
-- Cette policy permet l'insertion uniquement si l'ID correspond à un user auth.users
CREATE POLICY "Allow profile creation for new auth users"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = profiles.id
    )
  );

-- Note: Cette policy est sécurisée car elle vérifie que l'ID existe bien
-- dans auth.users, ce qui empêche la création de profils orphelins

-- ============================================
-- Migration terminée ✅
-- ============================================
