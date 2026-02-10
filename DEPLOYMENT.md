# 🚀 Guide de Déploiement Vercel

Guide étape par étape pour déployer le Blog d'Amel sur Vercel.

---

## ✅ Pré-requis

Avant de déployer, assurez-vous que :

- [ ] Le projet build correctement en local (`npm run build`)
- [ ] Toutes les migrations Supabase sont appliquées
- [ ] Les buckets Storage Supabase sont créés (article-images, avatars)
- [ ] Un utilisateur admin existe dans Supabase
- [ ] Les variables d'environnement sont prêtes

---

## 📋 Étape 1 : Préparer Supabase

### 1.1 Vérifier les migrations

Assurez-vous que toutes les migrations sont appliquées dans votre projet Supabase :

```sql
-- Dans Supabase SQL Editor, vérifier les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Devrait inclure:
-- - profiles
-- - articles
-- - categories
-- - article_categories
-- - comments
-- - invitations
```

### 1.2 Configurer les URLs

Dans **Supabase Dashboard → Authentication → URL Configuration** :

1. **Site URL** : `https://votre-app.vercel.app` (après déploiement)
2. **Redirect URLs** : Ajouter :
   - `https://votre-app.vercel.app/api/auth/callback`
   - `https://votre-app.vercel.app/**` (wildcard pour invitations)

### 1.3 Créer les Storage Buckets

Dans **Supabase Dashboard → Storage** :

1. Créer le bucket `article-images`
   - Public : ✅ Oui
   - Allowed MIME types : `image/*`
   - Max file size : `5MB`

2. Créer le bucket `avatars`
   - Public : ✅ Oui
   - Allowed MIME types : `image/*`
   - Max file size : `2MB`

3. Configurer les policies RLS :

```sql
-- Policy pour article-images
CREATE POLICY "Public can view article images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');

CREATE POLICY "Admins can upload article images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'article-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy pour avatars
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL
  );
```

### 1.4 Créer le premier admin

Si pas déjà fait, créer manuellement le premier utilisateur admin :

```sql
-- Méthode 1 : Depuis un profil existant
UPDATE profiles
SET role = 'admin', invitation_status = 'active'
WHERE email = 'votre-email@example.com';

-- Méthode 2 : Créer depuis zéro (avec auth.users)
-- 1. Créer d'abord le user dans Auth → Users dans Dashboard
-- 2. Puis:
UPDATE profiles
SET role = 'admin', invitation_status = 'active'
WHERE id = 'user-uuid-from-dashboard';
```

---

## 🔧 Étape 2 : Préparer le Projet

### 2.1 Vérifier le build local

```bash
# Test de build
npm run build

# Vérifier qu'il n'y a pas d'erreurs TypeScript
# Le build doit réussir ✓
```

### 2.2 Nettoyer le dépôt Git

```bash
# Vérifier le status
git status

# Commiter les changements en cours
git add .
git commit -m "chore: Préparation déploiement"
git push origin main
```

### 2.3 Variables d'environnement

Préparez ces valeurs (vous en aurez besoin sur Vercel) :

```bash
# Depuis Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# URL de votre app (sera modifié après déploiement)
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

---

## 🌐 Étape 3 : Déployer sur Vercel

### 3.1 Créer le projet Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New..." → Project**
3. **Import Git Repository** : Sélectionnez votre repo GitHub
4. **Configure Project** :
   - Framework Preset : **Next.js**
   - Root Directory : `./` (racine)
   - Build Command : `npm run build`
   - Output Directory : `.next`

### 3.2 Ajouter les variables d'environnement

Dans **Configure Project → Environment Variables**, ajoutez :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

**Important** : Pour `NEXT_PUBLIC_APP_URL`, utilisez d'abord l'URL Vercel temporaire (ex: `amelreport.vercel.app`), vous pourrez la changer après si vous ajoutez un domaine custom.

### 3.3 Déployer

1. Cliquez sur **"Deploy"**
2. Attendez que le build se termine (2-3 minutes)
3. Notez l'URL de production : `https://votre-app.vercel.app`

---

## 🔄 Étape 4 : Configuration post-déploiement

### 4.1 Mettre à jour Supabase

Retournez dans **Supabase Dashboard → Authentication → URL Configuration** :

1. **Site URL** : `https://votre-app.vercel.app` (votre vraie URL)
2. **Redirect URLs** : Mettez à jour avec la vraie URL

### 4.2 Mettre à jour la variable d'environnement

Dans **Vercel Dashboard → Settings → Environment Variables** :

- Modifiez `NEXT_PUBLIC_APP_URL` avec la vraie URL
- **Redéployez** : Vercel → Deployments → Three dots → Redeploy

### 4.3 Tester le site en production

1. **Connexion admin** : `https://votre-app.vercel.app/auth/login`
2. **Dashboard admin** : Vérifier toutes les fonctionnalités
3. **Créer une invitation** : Tester le flux complet
4. **Créer un article** : Vérifier l'upload d'images
5. **Homepage** : Vérifier l'affichage des articles

---

## 🔒 Étape 5 : Sécurité & Optimisations

### 5.1 Vérifications de sécurité

- [ ] Les variables d'environnement ne sont pas dans le code
- [ ] `.env.local` est dans `.gitignore`
- [ ] Les RLS policies sont activées sur toutes les tables
- [ ] Le `robots.txt` bloque l'indexation (blog privé)
- [ ] Les buckets Storage ont les bonnes policies

### 5.2 Performance

- [ ] Les images utilisent `next/image`
- [ ] Les pages ont des loading states (skeletons)
- [ ] Les erreurs sont gérées (error.tsx, not-found.tsx)
- [ ] Le middleware protège correctement les routes

### 5.3 Monitoring

Dans **Vercel Dashboard** :
- **Analytics** : Activer pour suivre les performances
- **Logs** : Runtime Logs pour déboguer les erreurs

---

## 🐛 Troubleshooting

### Build échoue sur Vercel

```bash
# Localement, nettoyer et rebuilder
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

Si le build local fonctionne mais pas sur Vercel :
- Vérifier les variables d'environnement dans Vercel
- Vérifier les logs de build dans Vercel

### Erreur "Database error" à l'inscription

- Vérifier que toutes les migrations sont appliquées
- Vérifier que le trigger `handle_new_user()` existe
- Vérifier les policies RLS sur `profiles` et `invitations`

### Images ne s'affichent pas

- Vérifier que les buckets Storage existent
- Vérifier les policies RLS sur les buckets
- Vérifier `next.config.ts` remotePatterns pour Supabase

### Redirection infinie

- Vérifier `middleware.ts` - peut-être un conflit de redirections
- Vérifier que l'utilisateur admin a bien `invitation_status = 'active'`

---

## ✅ Checklist finale

Avant de considérer le déploiement terminé :

- [ ] Le site est accessible à l'URL de production
- [ ] L'admin peut se connecter
- [ ] Les invitations fonctionnent (email + lien)
- [ ] Les articles peuvent être créés avec images
- [ ] Les catégories fonctionnent
- [ ] Les commentaires fonctionnent
- [ ] Le profil utilisateur fonctionne
- [ ] Les pages d'erreur s'affichent correctement
- [ ] Le site est responsive (mobile/desktop)
- [ ] Les performances sont bonnes (Analytics Vercel)

---

## 🔄 Déploiements futurs

Pour les prochains déploiements :

1. **Push sur GitHub** :
   ```bash
   git add .
   git commit -m "feat: Nouvelle fonctionnalité"
   git push origin main
   ```

2. **Auto-déploiement** : Vercel déploie automatiquement à chaque push sur `main`

3. **Preview Deployments** : Chaque branche/PR a une URL de preview automatique

---

## 📞 Support

En cas de problème :

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)

---

**Bon déploiement ! 🚀**
