# Jampiero BarberoShop — Guide d'onboarding

## Ajouter un nouveau coiffeur

Suivez ces 4 étapes dans l'ordre à chaque fois qu'un nouveau coiffeur rejoint le salon.

---

### Étape 1 — Le coiffeur crée son compte

Le coiffeur télécharge l'app et s'inscrit normalement avec :
- Son prénom et nom
- Son email professionnel
- Un mot de passe (minimum 6 caractères)

À ce stade, il arrive sur l'interface **client** — c'est normal.

---

### Étape 2 — Changer son rôle en "barber"

1. Connectez-vous sur [supabase.com](https://supabase.com) avec le compte admin
2. Allez dans **Table Editor → profiles**
3. Trouvez la ligne correspondant à l'email du coiffeur
4. Cliquez sur la cellule `role` et changez `client` → `barber`
5. Sauvegardez

---

### Étape 3 — Créer son profil coiffeur

1. Copiez l'`id` (UUID) du coiffeur depuis la table `profiles`
2. Allez dans **Table Editor → barbers**
3. Cliquez sur **Insert**
4. Remplissez les champs :

| Champ | Valeur |
|-------|--------|
| `name` | Prénom du coiffeur (ex: "Jampiero") |
| `profile_id` | UUID copié depuis `profiles` |
| `active` | `true` |

5. Sauvegardez

---

### Étape 4 — Le coiffeur se reconnecte

Le coiffeur doit :
1. Se déconnecter de l'app
2. Se reconnecter avec ses identifiants

L'app bascule automatiquement sur l'**interface coiffeur** avec accès au Dashboard et à l'Agenda.

---

## Désactiver un coiffeur

Si un coiffeur quitte le salon :

1. Allez dans **Table Editor → barbers**
2. Trouvez sa ligne et passez `active` à `false`
3. Allez dans **Table Editor → profiles**
4. Changez son `role` de `barber` à `client`

Il n'aura plus accès à l'interface coiffeur.

---

## Coiffeurs actuels

| Nom | Statut | Email |
|-----|--------|-------|
| Jampiero | Actif | admin@test.com |
| Coiffeur 2 | Inactif | — |

---

## Accès Supabase

- Dashboard : [supabase.com](https://supabase.com)
- Projet : `evnrutwhvfkpzumjnaxd`
- ⚠️ Ne jamais partager la clé `service_role` — utiliser uniquement la clé `anon` dans l'app

---

## Support

En cas de problème, vérifiez dans cet ordre :
1. Le `role` dans la table `profiles` est bien `barber`
2. La table `barbers` contient une ligne avec le bon `profile_id`
3. Le champ `active` est bien `true`
4. Le coiffeur s'est bien **déconnecté et reconnecté** après les modifications