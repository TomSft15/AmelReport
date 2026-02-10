# 📝 Blog d'Amel

Blog privé avec système d'invitation, interface admin complète et commentaires imbriqués.

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- Système d'invitation par email uniquement (pas d'inscription publique)
- Connexion par email/mot de passe
- Row Level Security (RLS) sur toutes les tables Supabase
- Protection des routes avec middleware Next.js
- Gestion des rôles (admin/user)

### 👨‍💼 Interface Admin
- **Dashboard** : Statistiques, articles récents, derniers commentaires
- **Gestion Articles** : Éditeur Tiptap WYSIWYG avec auto-save toutes les 2s
- **Upload Images** : Supabase Storage (max 5MB)
- **Gestion Catégories** : CRUD complet avec slug auto-généré
- **Gestion Utilisateurs** : Invitations, activation/désactivation
- **Modération Commentaires** : Suppression, filtrage par article

### 📰 Interface Publique
- **Homepage** : Grid d'articles, recherche, filtres par catégorie
- **Page Article** : Cover image, contenu riche, métadonnées, temps de lecture
- **Commentaires** : Système imbriqué (3 niveaux), réponses, suppression
- **Profil** : Modification nom, avatar, mot de passe, statistiques

### 🎨 UX/UI
- Design moderne avec shadcn/ui + Tailwind CSS
- Responsive mobile
- Loading states avec skeletons
- Pages d'erreur personnalisées (404, 500)
- Toasts de notification
- Dark mode ready

## 🛠️ Stack Technique

- **Framework** : Next.js 15 (App Router)
- **Language** : TypeScript (strict mode)
- **Styling** : Tailwind CSS v3
- **UI Components** : shadcn/ui + Radix UI
- **Database** : PostgreSQL (Supabase)
- **Auth** : Supabase Auth
- **Storage** : Supabase Storage
- **Forms** : react-hook-form + Zod
- **Editor** : Tiptap
- **Icons** : Lucide React
- **Deployment** : Vercel (gratuit)

## 🚀 Installation

### Prérequis
- Node.js 18+
- npm ou pnpm
- Compte Supabase (gratuit)

### 1. Cloner le projet
```bash
git clone <repo-url>
cd AmelReport
npm install
```

### 2. Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter les migrations SQL dans l'ordre :
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_storage_buckets.sql`
   - `supabase/migrations/004_fix_rls_recursion.sql`
   - `supabase/migrations/005_categories_with_counts.sql`
   - `supabase/migrations/006_invitations_table.sql`
   - `supabase/migrations/007_fix_invitations_rls.sql`
   - `supabase/migrations/012_recreate_trigger.sql`
   - `supabase/migrations/013_allow_profile_insert.sql`

3. Configurer les buckets Storage :
   - Créer `article-images` (public)
   - Créer `avatars` (public)

4. Créer le premier utilisateur admin manuellement dans Supabase :
```sql
-- Dans SQL Editor
UPDATE profiles
SET role = 'admin', invitation_status = 'active'
WHERE email = 'votre-email@example.com';
```

### 3. Variables d'environnement

Créer `.env.local` :
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Lancer le projet

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 📂 Structure du Projet

```
app/
├── (auth)/              # Routes authentification
│   ├── login/
│   └── invitation/
├── (public)/            # Routes utilisateurs
│   ├── home/           # Homepage articles
│   ├── articles/       # Pages articles
│   └── profile/        # Profil utilisateur
├── admin/              # Interface admin
│   ├── articles/
│   ├── categories/
│   ├── users/
│   └── comments/
└── api/                # API routes

components/
├── ui/                 # shadcn/ui components
├── admin/              # Composants admin
└── blog/               # Composants publics

lib/
├── actions/            # Server Actions
├── supabase/           # Clients Supabase
├── utils.ts            # Utilitaires
└── validations.ts      # Schemas Zod

supabase/
└── migrations/         # Migrations SQL
```

## 🔑 Commandes

```bash
npm run dev          # Développement
npm run build        # Build production
npm run start        # Démarrer build
npm run lint         # Linter
```

## 📝 Fonctionnement

### Système d'Invitation

1. **Admin invite un utilisateur** :
   - Email + génération token unique (7 jours de validité)
   - Email automatique envoyé par Supabase

2. **Utilisateur accepte** :
   - Clique sur lien `/invitation/[token]`
   - Crée son mot de passe et nom d'affichage
   - Compte activé automatiquement

3. **Connexion** :
   - Email/password uniquement

### Workflow Articles

1. **Admin crée article** :
   - Upload cover image (optionnel)
   - Rédaction avec éditeur Tiptap
   - Sélection catégories
   - Brouillon ou Publication directe
   - Auto-save toutes les 2s

2. **Utilisateurs lisent** :
   - Liste filtrée par catégories
   - Recherche par titre
   - Page article avec commentaires

3. **Commentaires** :
   - Création, réponses imbriquées
   - Suppression (propre commentaire ou admin)
   - Limite 2000 caractères

## 🔒 Sécurité

- **RLS Policies** : Chaque table protégée par Row Level Security
- **Middleware** : Vérification auth sur toutes routes protégées
- **Validation** : Zod schemas côté serveur
- **Sanitization** : DOMPurify pour contenu HTML
- **Rate Limiting** : À implémenter si besoin

## 📊 Base de Données

### Tables Principales
- `profiles` : Extension auth.users avec rôles
- `articles` : Contenu blog
- `categories` : Catégories articles
- `article_categories` : Many-to-many
- `comments` : Commentaires imbriqués

Voir `CLAUDE.md` pour le schéma complet.

## 🚀 Déploiement Vercel

1. Connecter repo GitHub à Vercel
2. Ajouter variables d'environnement
3. Configurer Supabase :
   - Site URL : `https://your-app.vercel.app`
   - Redirect URLs : Ajouter URL Vercel

## 📖 Documentation

- `CLAUDE.md` : Contexte technique complet
- `PROJECT.md` : Spécifications projet

## 🤝 Contribution

Blog privé - Pas de contributions externes.

## 📄 Licence

Privé - Tous droits réservés.

## 🐛 Troubleshooting

### Build échoue
```bash
rm -rf .next
npm run build
```

### Erreur RLS
Vérifier que toutes les migrations sont exécutées, notamment `004_fix_rls_recursion.sql`

### Images ne s'affichent pas
Vérifier :
- Policies Storage Supabase
- `next.config.ts` remotePatterns
- URL publiques des buckets

## 📞 Support

Pour toute question : voir issues GitHub ou documentation Supabase.

---

**Made with ❤️ using Next.js & Supabase**
