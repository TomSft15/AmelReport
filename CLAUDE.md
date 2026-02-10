# 🤖 CLAUDE.md - Contexte Technique du Projet

> Document de référence pour les sessions Claude Code futures

---

## 📋 Résumé Projet

**Nom** : Blog Privé d'Amel
**Type** : Blog personnel avec interface admin et système d'invitation
**Stack** : Next.js 15 + Supabase + shadcn/ui
**Hébergement** : Vercel (gratuit) + Supabase (gratuit)
**Statut** : En développement

---

## 🎯 Contraintes & Décisions Techniques

### Décisions Clés Prises

1. **Authentification** : Système d'invitation uniquement (pas d'inscription publique)
   - L'admin (Amel) crée les accès via interface admin
   - Email + token avec expiration 7 jours
   - Support OAuth Google avec whitelist emails

2. **UI Library** : shadcn/ui
   - Choisi pour sa modernité et flexibilité
   - Composants Radix UI + Tailwind
   - Pas de dépendance lourde (code copié)

3. **Éditeur** : Tiptap
   - Éditeur WYSIWYG moderne
   - Support images, formatage riche, code blocks
   - Auto-save toutes les 30 secondes

4. **Base de données** : PostgreSQL (Supabase)
   - Row Level Security (RLS) activé sur toutes les tables
   - Supabase Storage pour images (cover articles, avatars)
   - Supabase Auth pour gestion utilisateurs

5. **Coût** : 0€
   - Contrainte absolue du projet
   - Vercel Free tier (suffisant pour blog privé)
   - Supabase Free tier (500MB DB + 1GB Storage)

---

## 🏗️ Architecture Technique

### Stack Complète

```yaml
Framework: Next.js 15 (App Router)
Language: TypeScript (strict mode)
Styling: Tailwind CSS
UI Components: shadcn/ui + Radix UI
Icons: Lucide React
Forms: react-hook-form + zod
Editor: @tiptap/react
Database: PostgreSQL (Supabase)
Auth: Supabase Auth
Storage: Supabase Storage
Hosting: Vercel
```

### Conventions de Code

#### Nomenclature
- **Composants** : PascalCase (ex: `ArticleCard.tsx`)
- **Fichiers utils** : camelCase (ex: `formatDate.ts`)
- **Server Actions** : camelCase, préfixe verbe (ex: `createArticle`, `inviteUser`)
- **Types** : PascalCase (ex: `Article`, `UserProfile`)
- **Database** : snake_case (PostgreSQL convention)

#### Structure des Composants
```typescript
// Imports externes
import { useState } from "react"
// Imports internes UI
import { Button } from "@/components/ui/button"
// Imports utils/types
import type { Article } from "@/types/database.types"
// Imports server actions
import { createArticle } from "@/lib/actions/articles"

export function ComponentName() {
  // Component logic
}
```

#### Server Actions Pattern
```typescript
"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function actionName(formData: FormData) {
  const supabase = await createServerClient()

  // Vérifier auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Action logic

  // Revalidate si nécessaire
  revalidatePath("/path")

  return { success: true }
}
```

---

## 🗃️ Schéma Base de Données

### Tables Principales

```sql
-- 1. profiles (extension auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  invitation_status TEXT CHECK (invitation_status IN ('pending', 'active', 'disabled')) DEFAULT 'pending',
  invitation_token TEXT,
  invitation_expires_at TIMESTAMPTZ,
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. articles
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. article_categories (many-to-many)
CREATE TABLE article_categories (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

-- 5. comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes Importants

```sql
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_comments_article ON comments(article_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_profiles_invitation_token ON profiles(invitation_token);
```

### RLS Policies (Exemples)

```sql
-- Articles: lecture si publié, écriture admin uniquement
CREATE POLICY "Articles publics lisibles par tous"
  ON articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins peuvent tout faire"
  ON articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comments: lecture tous, écriture users actifs
CREATE POLICY "Commentaires lisibles par tous"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users actifs peuvent commenter"
  ON comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.invitation_status = 'active'
    )
  );
```

---

## 🔐 Système d'Authentification

### Flow Invitation

1. **Admin invite** :
   ```typescript
   inviteUser(email) →
     - Vérifie email unique
     - Génère token crypto.randomUUID()
     - Crée profil avec status='pending'
     - Supabase envoie email avec lien
   ```

2. **User accepte** :
   ```typescript
   /invitation/[token] →
     - Vérifie token validité + expiration
     - Formulaire création password
     - Supabase crée auth.users
     - Update profil status='active'
   ```

3. **Google OAuth** :
   ```typescript
   signInWithGoogle() →
     - Check email dans profiles
     - Si non trouvé → erreur "Accès non autorisé"
     - Si trouvé → login OK
   ```

### Protection Routes

```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const supabase = createMiddlewareClient(req)
  const { data: { user } } = await supabase.auth.getUser()

  // Routes admin → vérifier role='admin'
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!user) return redirect('/login')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return redirect('/')
    }
  }

  // Routes publiques → vérifier authentifié + actif
  if (!req.nextUrl.pathname.startsWith('/login')) {
    if (!user) return redirect('/login')

    const { data: profile } = await supabase
      .from('profiles')
      .select('invitation_status')
      .eq('id', user.id)
      .single()

    if (profile?.invitation_status !== 'active') {
      return redirect('/login')
    }
  }

  return NextResponse.next()
}
```

---

## 📁 Structure Dossiers Détaillée

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                 # Page connexion email/password + Google
│   │   ├── invitation/
│   │   │   └── [token]/
│   │   │       └── page.tsx             # Acceptation invitation
│   │   └── layout.tsx                   # Layout minimaliste auth
│   │
│   ├── (public)/                        # Routes pour users connectés
│   │   ├── page.tsx                     # Page d'accueil (liste articles)
│   │   ├── articles/
│   │   │   └── [slug]/
│   │   │       └── page.tsx             # Page article + commentaires
│   │   ├── profile/
│   │   │   └── page.tsx                 # Profil user
│   │   └── layout.tsx                   # Layout avec header/nav
│   │
│   ├── admin/
│   │   ├── layout.tsx                   # Layout admin (sidebar)
│   │   ├── page.tsx                     # Dashboard admin
│   │   ├── articles/
│   │   │   ├── page.tsx                 # Liste articles
│   │   │   ├── new/
│   │   │   │   └── page.tsx             # Nouvel article
│   │   │   └── edit/[id]/
│   │   │       └── page.tsx             # Éditer article
│   │   ├── categories/
│   │   │   └── page.tsx                 # CRUD catégories
│   │   ├── users/
│   │   │   └── page.tsx                 # Gestion users + invitations
│   │   └── comments/
│   │       └── page.tsx                 # Modération commentaires
│   │
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts             # Callback OAuth
│   │
│   ├── layout.tsx                       # Root layout
│   └── globals.css                      # Styles globaux + variables CSS
│
├── components/
│   ├── ui/                              # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   └── ...
│   │
│   ├── auth/
│   │   ├── login-form.tsx               # Formulaire login
│   │   ├── invitation-form.tsx          # Formulaire acceptation invitation
│   │   └── auth-provider.tsx            # Context auth (optionnel)
│   │
│   ├── admin/
│   │   ├── sidebar.tsx                  # Sidebar admin
│   │   ├── article-editor.tsx           # Éditeur Tiptap
│   │   ├── image-upload.tsx             # Upload image
│   │   ├── category-selector.tsx        # Multi-select catégories
│   │   └── user-invite-modal.tsx        # Modal invitation
│   │
│   └── blog/
│       ├── article-card.tsx             # Card article (homepage)
│       ├── article-content.tsx          # Contenu article stylé
│       ├── comment-form.tsx             # Formulaire commentaire
│       ├── comment-list.tsx             # Liste commentaires
│       ├── comment-item.tsx             # Item commentaire (recursive)
│       └── category-filter.tsx          # Filtres catégories
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # Client-side Supabase
│   │   ├── server.ts                    # Server-side Supabase
│   │   └── middleware.ts                # Middleware Supabase
│   │
│   ├── actions/
│   │   ├── auth.ts                      # Server Actions auth
│   │   ├── articles.ts                  # Server Actions articles
│   │   ├── users.ts                     # Server Actions users
│   │   ├── comments.ts                  # Server Actions comments
│   │   └── categories.ts                # Server Actions categories
│   │
│   ├── utils.ts                         # Utils génériques (cn, formatDate, etc.)
│   └── validations.ts                   # Zod schemas validation
│
├── types/
│   ├── database.types.ts                # Types générés depuis Supabase
│   └── index.ts                         # Types custom
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       └── 003_storage_buckets.sql
│
├── public/
│   ├── images/
│   └── favicon.ico
│
├── .env.local                           # Variables environnement (git-ignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json                      # Config shadcn/ui
├── PROJECT.md                           # Documentation projet (ce fichier)
└── CLAUDE.md                            # Contexte technique (pour Claude)
```

---

## 🔧 Variables d'Environnement

### Fichier `.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Optionnel, pour admin tasks

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change en prod
```

### Configuration Vercel

Ajouter les mêmes variables dans Vercel Dashboard après déploiement.

---

## 🚀 Commandes Importantes

```bash
# Développement
npm run dev                  # Lancer dev server (localhost:3000)

# Build
npm run build               # Build production
npm run start               # Start production server

# Supabase (local dev)
npx supabase init           # Init Supabase local
npx supabase start          # Start Supabase local
npx supabase db reset       # Reset DB locale
npx supabase gen types typescript --local > types/database.types.ts  # Générer types

# shadcn/ui
npx shadcn@latest add button    # Ajouter composant
npx shadcn@latest add dialog
# etc.

# Git
git add .
git commit -m "message"
git push

# Vercel (auto-deploy on push)
```

---

## ⚠️ Points d'Attention Importants

### Sécurité

1. **JAMAIS commit .env.local** → Déjà dans .gitignore
2. **Toujours valider inputs** → Utiliser Zod schemas
3. **Sanitize HTML** → Utiliser DOMPurify pour contenu éditeur
4. **Rate limiting invitations** → Max 10/jour par admin
5. **Vérifier rôle admin** → Sur toutes actions admin
6. **RLS activé** → Sur toutes les tables Supabase

### Performance

1. **Utiliser next/image** → Pour toutes les images
2. **Lazy load éditeur Tiptap** → dynamic import
3. **ISR pour articles** → revalidate: 3600
4. **Optimistic updates** → Commentaires
5. **Pagination** → Liste articles, commentaires

### UX

1. **Loading states** → Toujours afficher feedback
2. **Error handling** → Toast notifications
3. **Responsive** → Tester mobile systématiquement
4. **Accessibility** → Utiliser Radix UI (accessible by default)

---

## 📝 Checklist Déploiement

### Avant Premier Deploy

- [ ] Créer projet Supabase
- [ ] Exécuter migrations SQL
- [ ] Configurer RLS policies
- [ ] Créer buckets Storage (article-images, avatars)
- [ ] Activer email provider Supabase
- [ ] Configurer email templates invitation
- [ ] Activer Google OAuth (si utilisé)
- [ ] Créer premier utilisateur admin manuellement dans Supabase

### Configuration Vercel

- [ ] Connecter repo GitHub à Vercel
- [ ] Ajouter variables environnement
- [ ] Configurer domaine (optionnel)
- [ ] Premier deploy

### Après Premier Deploy

- [ ] Ajouter URL Vercel dans Supabase (Site URL, Redirect URLs)
- [ ] Tester login/signup flow
- [ ] Tester Google OAuth
- [ ] Tester invitation email
- [ ] Créer quelques articles de test
- [ ] Tester commentaires

---

## 🐛 Debug & Troubleshooting

### Problèmes Courants

**1. Auth callback ne marche pas**
```
Solution: Vérifier que l'URL de callback est bien dans Supabase > Authentication > URL Configuration
```

**2. Images ne s'affichent pas**
```
Solution:
- Vérifier policies Storage Supabase
- Vérifier next.config.ts remotePatterns
```

**3. RLS bloque requêtes**
```
Solution:
- Tester policies dans Supabase SQL Editor
- Vérifier que auth.uid() retourne bien l'user
```

**4. Build Vercel échoue**
```
Solution:
- Vérifier variables environnement sont bien définies
- Vérifier pas d'erreurs TypeScript (npm run build local)
```

---

## 📚 Ressources & Documentation

### Documentation Officielle

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tiptap](https://tiptap.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Exemples Utiles

- [Next.js + Supabase Auth](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)
- [shadcn Admin Dashboard](https://github.com/shadcn-ui/ui/tree/main/apps/www)

---

## ✅ TODO Liste Développement

### Phase 1 : Setup ✅ (en cours)
- [x] Créer documentation projet
- [ ] Setup Next.js + Tailwind
- [ ] Installer shadcn/ui
- [ ] Structure dossiers

### Phase 2 : Supabase & Auth
- [ ] Migrations SQL
- [ ] RLS Policies
- [ ] Supabase clients (server/client)
- [ ] Middleware auth
- [ ] Pages login/invitation
- [ ] OAuth Google

### Phase 3 : Admin - Users
- [ ] Page admin/users
- [ ] Modal invitation
- [ ] Server actions users
- [ ] Email templates

### Phase 4 : Admin - Articles
- [ ] Dashboard admin
- [ ] Liste articles
- [ ] Éditeur Tiptap
- [ ] Upload images
- [ ] CRUD articles

### Phase 5 : Admin - Catégories & Comments
- [ ] CRUD catégories
- [ ] Modération commentaires

### Phase 6 : Interface Publique
- [ ] Homepage (liste articles)
- [ ] Page article
- [ ] Système commentaires
- [ ] Filtres et recherche

### Phase 7 : Profil & Polish
- [ ] Page profil
- [ ] UI/UX final
- [ ] Responsive
- [ ] Animations

### Phase 8 : Deploy
- [ ] Tests complets
- [ ] Optimisations
- [ ] Deploy Vercel
- [ ] Configuration finale

---

## 💡 Notes pour Claude Futures Sessions

### Contexte Important

1. **Projet blog privé** : Pas un blog public, donc pas besoin de SEO agressif
2. **Utilisateurs limités** : Optimisations pour petite audience (< 50 users)
3. **Budget 0€** : Toujours vérifier que solutions proposées restent gratuites
4. **Système invitation** : C'est la feature clé de sécurité, ne pas contourner
5. **Admin = 1 personne** : Interface admin simple, pas besoin de gestion multi-admin

### Préférences Techniques

- **TypeScript strict** : Toujours typer correctement
- **Server Actions** : Préférer aux API routes
- **shadcn/ui** : Utiliser au maximum les composants, ne pas réinventer
- **Tailwind** : Pas de CSS modules, tout en Tailwind
- **Comments**: Prettier defaults acceptables

### Si Modifications Futures

- Toujours documenter changements importants dans PROJECT.md
- Mettre à jour schéma DB si modifs tables
- Tester auth flow après toute modif auth
- Rebuild types Supabase après modif DB

---

**Document maintenu à jour** : 2026-02-10
**Dernière modification** : Configuration initiale projet
