# 📝 Blog Privé d'Amel - Documentation Projet

## 🎯 Vision & Objectif

Un blog personnel moderne et élégant permettant à Amel de partager ses articles avec ses amis dans un espace privé et sécurisé. Le site offre une expérience de lecture agréable et permet aux amis invités de réagir et commenter les articles.

---

## ✨ Fonctionnalités Principales

### 🔐 Accès Privé & Sécurisé
- **Système d'invitation uniquement** : Seule Amel peut créer des accès
- **Invitation par email** : Lien unique avec token (validité 7 jours)
- **Authentification multiple** :
  - Email + mot de passe
  - Connexion Google OAuth (emails whitelistés)
- **Gestion des accès** : Désactiver/réactiver un utilisateur
- Pas d'inscription publique

### ✍️ Interface d'Administration Complète

#### Gestion des Articles
- **Éditeur riche moderne (Tiptap)** :
  - Formatage texte (gras, italique, titres, listes)
  - Insertion d'images (drag & drop)
  - Code blocks, citations, liens
- **Gestion des brouillons** : Auto-save toutes les 30 secondes
- **Cover images** : Image principale pour chaque article
- **Catégories** : Organisation par tags/catégories
- **SEO** : Génération automatique des slugs et excerpts
- **Statuts** : Brouillon / Publié

#### Gestion des Utilisateurs
- **Liste complète** : Voir tous les utilisateurs invités
- **Statuts** : En attente / Actif / Désactivé
- **Invitation** : Formulaire simple (email) → envoi automatique
- **Réinvitation** : Renvoyer un lien si expiré
- **Statistiques** : Dernière connexion, nombre de commentaires
- **Actions rapides** : Désactiver/réactiver un accès

#### Gestion des Catégories
- Créer, modifier, supprimer des catégories
- Génération automatique des slugs
- Compteur d'articles par catégorie

#### Modération des Commentaires
- Vue globale de tous les commentaires
- Filtrage par article
- Suppression de commentaires inappropriés
- Badge "Nouveau" pour les récents (< 24h)

### 🌐 Interface Publique (Amis Connectés)

#### Page d'Accueil
- **Grille d'articles moderne** : Cards avec cover image, titre, excerpt
- **Filtrage par catégorie** : Navigation facile
- **Barre de recherche** : Recherche dans les titres et contenu
- **Design responsive** : Optimisé mobile/tablette/desktop

#### Page Article
- **Affichage élégant** : Cover full-width, typographie soignée
- **Métadonnées** : Auteur, date de publication, temps de lecture estimé
- **Catégories** : Tags cliquables
- **Système de commentaires avancé** :
  - Formulaire commentaire (textarea + bouton)
  - Affichage avec avatar, nom, date relative
  - **Réponses imbriquées** : Possibilité de répondre aux commentaires
  - Suppression de ses propres commentaires
  - Optimistic updates (réactivité instantanée)

#### Profil Utilisateur
- Modifier son nom d'affichage
- Upload d'avatar personnalisé
- Changer son mot de passe
- Voir l'historique de ses commentaires
- Statistiques : membre depuis, nombre de commentaires

---

## 🏗️ Architecture Technique

### Stack Technologique

#### Frontend & Backend
- **Framework** : Next.js 15 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **UI Components** : shadcn/ui (basé sur Radix UI)
- **Icons** : Lucide React
- **Rich Text Editor** : Tiptap

#### Base de Données & Backend
- **Database** : PostgreSQL (Supabase)
- **Auth** : Supabase Auth (email/password + OAuth)
- **Storage** : Supabase Storage (images)
- **API** : Next.js Server Actions

#### Hébergement (100% Gratuit)
- **Application** : Vercel (déploiement automatique via Git)
- **Database** : Supabase (plan gratuit - 500MB)
- **Storage** : Supabase Storage (plan gratuit - 1GB)
- **Emails** : Supabase (emails d'invitation intégrés)

### Schéma de Base de Données

```sql
-- Profils utilisateurs (extension de auth.users)
profiles
  - id (uuid, PK)
  - email (text)
  - display_name (text)
  - avatar_url (text)
  - role (enum: 'admin', 'user')
  - invitation_status (enum: 'pending', 'active', 'disabled')
  - invitation_token (text, nullable)
  - invitation_expires_at (timestamp)
  - invited_by (uuid, FK)
  - invited_at (timestamp)
  - last_login_at (timestamp)

-- Articles
articles
  - id (uuid, PK)
  - title (text)
  - slug (text, unique)
  - content (text)
  - excerpt (text)
  - cover_image_url (text)
  - author_id (uuid, FK -> profiles)
  - status (enum: 'draft', 'published')
  - published_at (timestamp)
  - created_at, updated_at

-- Catégories
categories
  - id (uuid, PK)
  - name (text)
  - slug (text, unique)

-- Association articles-catégories
article_categories
  - article_id (uuid, FK)
  - category_id (uuid, FK)

-- Commentaires
comments
  - id (uuid, PK)
  - article_id (uuid, FK -> articles)
  - user_id (uuid, FK -> profiles)
  - content (text)
  - parent_id (uuid, nullable, FK -> comments)
  - created_at, updated_at
```

### Sécurité (Row Level Security)

Toutes les tables sont protégées par des policies PostgreSQL :

- **Articles** : Lecture publique (si publiés), écriture admin uniquement
- **Commentaires** : Lecture publique, écriture users actifs uniquement
- **Profiles** : Lecture publique, modification par soi-même uniquement
- **Categories** : Lecture publique, écriture admin uniquement

---

## 📂 Structure du Projet

```
/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Groupe routes authentification
│   │   ├── login/
│   │   └── invitation/[token]/
│   ├── (public)/                 # Groupe routes publiques (connectés)
│   │   ├── page.tsx              # Page d'accueil
│   │   ├── articles/[slug]/
│   │   └── profile/
│   ├── admin/                    # Interface administration
│   │   ├── layout.tsx            # Layout admin avec sidebar
│   │   ├── page.tsx              # Dashboard
│   │   ├── articles/
│   │   ├── categories/
│   │   ├── users/
│   │   └── comments/
│   ├── api/
│   │   └── auth/callback/
│   ├── layout.tsx                # Layout racine
│   └── globals.css
│
├── components/                   # Composants réutilisables
│   ├── ui/                       # shadcn/ui components
│   ├── auth/                     # Composants auth
│   ├── admin/                    # Composants admin
│   └── blog/                     # Composants blog public
│
├── lib/                          # Utilitaires
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── actions/                  # Server Actions
│   └── utils.ts
│
├── types/                        # Types TypeScript
│   └── database.types.ts
│
├── public/                       # Assets statiques
│
└── supabase/                     # Migrations & config
    └── migrations/
```

---

## 🚀 Fonctionnalités Avancées

### Performance
- **SSR/SSG** : Pages articles pré-rendues (ISR)
- **Images optimisées** : next/image avec lazy loading
- **Caching intelligent** : Revalidation automatique
- **Code splitting** : Chargement composants à la demande

### UX/UI
- **Design moderne** : Interface épurée et élégante
- **Responsive** : Mobile-first design
- **Animations subtiles** : Transitions fluides (framer-motion)
- **Loading states** : Skeletons et spinners
- **Toast notifications** : Feedback utilisateur
- **Dark mode** : (optionnel - à définir)

### SEO
- **Metadata dynamique** : Title, description par page
- **Open Graph** : Partage réseaux sociaux optimisé
- **Sitemap automatique**
- **Slugs SEO-friendly**

---

## 👥 Rôles & Permissions

### Admin (Amel)
✅ Écrire, modifier, supprimer des articles
✅ Gérer les catégories
✅ Inviter/gérer les utilisateurs
✅ Modérer tous les commentaires
✅ Accès interface admin complète

### User (Amis)
✅ Lire tous les articles publiés
✅ Commenter les articles
✅ Répondre aux commentaires
✅ Modifier son profil
✅ Supprimer ses propres commentaires
❌ Pas d'accès à l'interface admin

---

## 🔄 Workflow d'Utilisation

### Pour Amel (Admin)

1. **Écrire un article** :
   - Aller sur `/admin/articles/new`
   - Rédiger avec l'éditeur riche
   - Ajouter cover image, catégories
   - Enregistrer en brouillon ou publier directement

2. **Inviter un ami** :
   - Aller sur `/admin/users`
   - Cliquer "Inviter un ami"
   - Entrer l'email → envoi automatique
   - L'ami reçoit un email avec lien unique

3. **Modérer** :
   - Voir tous les commentaires dans `/admin/comments`
   - Supprimer si besoin
   - Désactiver un utilisateur si problème

### Pour les Amis (Users)

1. **Accepter l'invitation** :
   - Recevoir email d'invitation
   - Cliquer sur le lien
   - Créer son mot de passe
   - Se connecter

2. **Lire et commenter** :
   - Voir tous les articles sur la page d'accueil
   - Filtrer par catégorie ou rechercher
   - Lire un article
   - Commenter ou répondre

3. **Gérer son profil** :
   - Modifier nom et avatar dans `/profile`
   - Voir ses commentaires
   - Changer mot de passe

---

## 💰 Coûts (0€ confirmé)

| Service | Plan | Limite | Coût |
|---------|------|--------|------|
| **Vercel** | Hobby | Illimité | **0€** |
| **Supabase** | Free | 500MB DB + 1GB Storage | **0€** |
| **Domaine** | Vercel subdomain | yourapp.vercel.app | **0€** |

**Total mensuel : 0€** ✅

> Note : Si le projet grandit, il sera toujours temps d'upgrade plus tard.

---

## 📈 Évolutions Futures Possibles

### Phase 2 (Optionnel)
- 📧 Notifications email (nouveau commentaire)
- 🔔 Notifications in-app
- 📊 Analytics (vues par article)
- ❤️ Système de likes/réactions
- 🏷️ Tags en plus des catégories
- 🌙 Dark mode
- 📱 PWA (app mobile)
- 📥 Export articles en PDF

### Phase 3 (Si besoin)
- 🎨 Thèmes personnalisables
- 📸 Galerie photos dédiée
- 🎵 Embed audio/vidéo
- 💬 Messages privés entre utilisateurs
- 🔍 Recherche avancée (full-text)

---

## 📞 Support & Maintenance

- **Hébergement** : Automatique (Vercel auto-deploy via Git)
- **Backups** : Supabase backups automatiques (7 jours)
- **Updates** : Dépendances à mettre à jour régulièrement
- **Monitoring** : Vercel Analytics (gratuit)

---

## 📝 Notes Importantes

1. **Premier utilisateur admin** : À créer manuellement dans Supabase après déploiement
2. **Variables d'environnement** : À configurer sur Vercel (clés Supabase)
3. **OAuth Google** : Nécessite configuration domaine dans Google Console
4. **Emails** : Supabase envoie les emails d'invitation (configurer templates)

---

**Projet créé avec ❤️ pour Amel**
*Développé avec Next.js 15, Supabase, et shadcn/ui*
