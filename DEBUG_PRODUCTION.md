# 🔍 DEBUG - Erreur Création Article en Production

## Symptômes
- ✅ Fonctionne en local
- ❌ Ne fonctionne pas en production Vercel

## Tests à faire (dans l'ordre)

### Test 1 : Article minimal (SANS image)
Essayez de créer un article avec :
- Titre : "Test Production"
- Contenu : Juste du texte simple, pas de formatage
- Statut : Brouillon
- PAS d'image cover
- PAS de catégories

**Résultat** : ❌ ou ✅ ?

### Test 2 : Vérifier les logs Vercel
1. Vercel Dashboard → Logs → Runtime Logs
2. Créer l'article
3. Copier le message d'erreur

**Message d'erreur** :
```
[À REMPLIR]
```

### Test 3 : Vérifier l'URL de redirection
Après création d'article, il y a un `redirect("/admin/articles")`.

Si `NEXT_PUBLIC_APP_URL` est mal configuré, le redirect peut échouer.

**Dans Vercel → Settings → Environment Variables** :
- NEXT_PUBLIC_APP_URL = `[QUELLE VALEUR ?]`

### Test 4 : Vérifier le profil admin en production
Dans Supabase SQL Editor :
```sql
SELECT id, email, role, invitation_status
FROM profiles
WHERE role = 'admin';
```

**Résultat** :
- email : [?]
- role : admin ✅
- invitation_status : active ✅

### Test 5 : Vérifier les permissions RLS
Dans Supabase SQL Editor :
```sql
-- Test INSERT sur articles
SELECT policy_name, command
FROM information_schema.role_table_grants
WHERE table_name = 'articles';
```

---

## Causes possibles

### 1. DOMPurify (le plus probable)
**Symptôme** : Erreur au moment du sanitize du contenu HTML

**Solution** : Vérifier que `isomorphic-dompurify` fonctionne en production

### 2. Variables d'environnement
**Symptôme** : NEXT_PUBLIC_APP_URL incorrecte → redirect échoue

**Solution** : Corriger l'URL dans Vercel Settings

### 3. Permissions RLS
**Symptôme** : L'admin n'a pas les droits d'insertion

**Solution** : Vérifier les policies RLS dans Supabase

### 4. Taille du body
**Symptôme** : Le contenu est trop gros (> 5MB)

**Solution** : Déjà configuré dans next.config.ts à 5MB

### 5. Timeout Vercel
**Symptôme** : La requête prend trop de temps

**Solution** : Vérifier les logs, optimiser la requête

---

## Actions immédiates

1. **Copier le message d'erreur exact** des logs Vercel
2. **Vérifier NEXT_PUBLIC_APP_URL** dans Vercel Settings
3. **Essayer de créer un article minimal** (sans image, sans catégories)
4. **Me donner ces 3 informations**

---

## Si c'est lié à DOMPurify

Le problème peut venir de `isomorphic-dompurify` qui ne fonctionne pas correctement en environnement serverless Vercel.

**Solution** : Déplacer le sanitize côté client ou utiliser une alternative.

Je peux vous aider à implémenter la solution une fois qu'on a identifié le problème exact.
