-- ============================================
-- Système Simple d'Invitation par Code
-- ============================================

-- Ajouter une colonne pour le code d'invitation (6 caractères)
ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- Créer un index sur le code pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);

-- Note: Les anciennes invitations avec token/email peuvent coexister
-- Le système utilisera le code pour les nouvelles invitations

-- ============================================
-- Migration terminée ✅
-- ============================================
