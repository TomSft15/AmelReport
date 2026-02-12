-- ============================================
-- FIX: Permettre aux utilisateurs de mettre à jour leur propre profil
-- ============================================
-- La policy "Users can update own profile" a été supprimée par erreur
-- dans la migration 004 et jamais recréée

-- Recréer la policy pour permettre aux users de modifier leur profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- Migration terminée ✅
-- ============================================
