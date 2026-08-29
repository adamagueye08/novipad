# NoviPad — Documentation pédagogique

> **Ce document a un objectif d'apprentissage**, pas seulement de référence.
> Chaque section explique un concept (cybersécurité, DevOps, cloud) à travers
> du code réel du projet, avec le fichier et la fonction exacts à consulter.
>
> **📌 Ce fichier doit être tenu à jour.** Chaque fois qu'on ajoute une
> fonctionnalité qui introduit un nouveau concept (ou change une décision
> déjà documentée ici), la section correspondante doit être mise à jour dans
> le même commit que le code. Un doc obsolète est pire qu'une absence de doc.

---

## Sommaire

1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Cybersécurité](#2-cybersécurité)
3. [DevOps](#3-devops)
4. [Cloud](#4-cloud)
5. [Parcours métier expliqués](#5-parcours-métier-expliqués)
6. [Glossaire rapide](#6-glossaire-rapide)

---

## 1. Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Worker                     │
│  (un seul déploiement, frontend + backend ensemble)      │
│                                                            │
│   src/server.ts  ← point d'entrée réseau brut            │
│        │                                                  │
│        ├── /api/paytech/ipn  → webhook PayTech            │
│        │                                                  │
│        └── tout le reste     → TanStack Start             │
│                                  ├── React (pages)         │
│                                  └── createServerFn        │
│                                      (fonctions serveur)   │
└─────────────────────────────────────────────────────────┘
              │                              │
              ▼                              ▼
      ┌───────────────┐            ┌──────────────────┐
      │    Supabase    │            │      PayTech       │
      │ (PostgreSQL +  │            │ (Wave/Orange Money  │
      │ authentification)│            │  /carte bancaire)  │
      └───────────────┘            └──────────────────┘
```

**Différence clé avec un projet "classique" (ex: ARSN)** : ARSN sépare
frontend (Vercel) et backend (Render) en deux déploiements distincts qui se
parlent en HTTP. NoviPad utilise **TanStack Start**, un framework qui compile
le frontend React ET les fonctions serveur (`checkout.server.ts`,
`admin.server.ts`...) en **un seul artefact**, déployé sur **Cloudflare
Workers**. Une seule URL, pas de CORS à gérer, un seul endroit où tout
casse (ou tout marche).

**Fichiers clés à connaître :**
| Fichier | Rôle |
|---|---|
| `src/server.ts` | Point d'entrée réseau brut (avant même React) |
| `src/lib/checkout.server.ts` | Logique métier achat (Cash/Flex/Tontine) |
| `src/lib/paytech.server.ts` | Client PayTech (créer un paiement, vérifier une notification) |
| `src/lib/admin.server.ts` | Logique métier back-office |
| `src/routes/` | Pages (convention : un fichier = une route) |
| `supabase/migrations/` | Historique des changements de schéma de base de données |

---

## 2. Cybersécurité

### 2.1 CSRF et pourquoi le webhook PayTech est à part

**Le problème que CSRF résout** : sans protection, un site malveillant
pourrait faire exécuter des actions sur NoviPad à l'insu d'un client connecté
(ex: un bouton caché qui déclenche "annuler mon compte Flex" pendant qu'il
visite un autre site). TanStack Start protège `createServerFn` avec un jeton
CSRF que seul le navigateur du client légitime possède (voir
`src/start.ts`).

**Pourquoi PayTech ne peut pas utiliser ce mécanisme** : PayTech appelle
notre serveur depuis SES machines, pas depuis un navigateur — il n'a pas (et
ne peut pas avoir) ce jeton. D'où la route séparée `/api/paytech/ipn`,
gérée directement dans `src/server.ts`, **avec une autre protection à la
place** : la vérification de signature (section suivante).

📍 **À lire** : `src/server.ts`, fonction `handlePaytechIpn`

### 2.2 Signature HMAC — authentifier un webhook

**Le principe** : PayTech et nous partageons un secret
(`PAYTECH_API_SECRET`). Chaque notification est accompagnée d'une empreinte
(hash) calculée à partir de son contenu **et** de ce secret. On recalcule la
même empreinte de notre côté ; si elle correspond, on est certain que :
1. La notification vient bien de PayTech (seul autre détenteur du secret)
2. Rien n'a été modifié en chemin (changer un chiffre du montant changerait
   complètement l'empreinte)

C'est l'équivalent numérique d'une signature manuscrite infalsifiable.

📍 **À lire** : `src/lib/paytech.server.ts`, fonction `verifyPaytechIpn`

### 2.3 Ne jamais faire confiance à une redirection navigateur

Après paiement, PayTech redirige le **navigateur** vers `success_url`. Rien
n'empêche quelqu'un de taper cette URL directement sans avoir payé — une
redirection n'est qu'un affichage, jamais une preuve. C'est pour ça que
`/paiement/succes` (`src/routes/paiement.succes.tsx`) ne fait **que
l'affichage** : la confirmation réelle vient uniquement du webhook IPN
(preuve serveur-à-serveur signée), jamais de cette page.

### 2.4 Idempotence — se protéger des notifications en double

Le réseau n'est jamais fiable à 100% : PayTech peut renvoyer la même
notification plusieurs fois. Sans protection, un même dépôt Flex pourrait
être compté deux fois. La parade : dès qu'un paiement passe à `SUCCESS`, on
ignore toute notification ultérieure pour la même référence.

📍 **À lire** : `src/lib/checkout.server.ts`, fonction
`confirmPaytechPayment`, le test `if (payment.status !== "PENDING")`

### 2.5 RLS (Row Level Security) — la sécurité au niveau de la base

Supabase (PostgreSQL) permet de définir des règles directement sur les
tables : "un utilisateur ne peut lire que SES propres commandes", par
exemple. C'est une protection **indépendante du code applicatif** — même si
un bug côté frontend oubliait de filtrer par utilisateur, la base
refuserait quand même de renvoyer les données d'un autre client.

📍 **À voir** : `supabase/migrations/*.sql`, chercher `ENABLE ROW LEVEL
SECURITY` et `CREATE POLICY`

Les fonctions dans `admin.server.ts`/`checkout.server.ts` utilisent
`supabaseAdmin` (clé "service role"), qui **contourne** RLS — c'est
volontaire : ce sont des fonctions serveur déjà protégées par la vérification
d'identité (`requireSupabaseAuth`) et de rôle (`ensureStaff`). RLS protège
les accès **directs** depuis le navigateur (ex: le dashboard qui lit
`flex_deposits` avec la clé publique).

### 2.6 Secrets — ce qu'on ne commit jamais

Toutes les clés sensibles (`PAYTECH_API_SECRET`, clés Supabase...) vivent
dans des variables d'environnement, jamais dans le code. `.env` est dans
`.gitignore` ; seul `.env.example` (avec des valeurs vides) est versionné.

**Rappel de l'incident de ce projet** : au tout début, plusieurs dépôts
avaient un vrai `.env` commité par erreur (voir l'historique Git). Ça a été
corrigé, mais la leçon reste : **une fois une clé exposée publiquement, il
faut la régénérer** — la retirer du dépôt ne suffit pas, l'ancienne valeur
reste visible dans l'historique Git.

---

## 3. DevOps

### 3.1 Migrations SQL — versionner les changements de base de données

Chaque changement de structure de base de données (nouvelle colonne,
nouvelle table) est écrit dans un fichier SQL horodaté dans
`supabase/migrations/`, plutôt que modifié à la main dans le tableau de
bord Supabase. Avantages :
- **Traçabilité** : on sait exactement quand et pourquoi chaque colonne a
  été ajoutée (le nom du fichier + son contenu commenté font office
  d'historique)
- **Reproductibilité** : n'importe qui (ou un nouvel environnement de test)
  peut reconstruire la base à l'identique en rejouant les migrations dans
  l'ordre
- **Coordination** : moi (l'assistant) je n'ai pas d'accès réseau direct à
  Supabase, donc je livre les migrations en fichiers — c'est toi qui les
  appliques (SQL Editor ou `supabase db push`), ce qui te garde dans la
  boucle avant tout changement réel sur la base de production

📍 **Exemple concret** : `supabase/migrations/20260828070000_flex_completion_and_cancellation.sql`

### 3.2 Environnements (test / production)

`PAYTECH_ENV` bascule entre `"test"` (aucun vrai argent ne bouge, pour
essayer le parcours complet sans risque) et `"prod"`. Séparer les
environnements est une pratique DevOps fondamentale : on ne teste jamais de
nouvelles fonctionnalités directement avec de l'argent réel.

### 3.3 Le rôle de git — historique et retour arrière

Chaque changement fonctionnel de cette session a été fait dans un commit
séparé, avec un message qui explique le "pourquoi", pas juste le "quoi"
(regarde `git log` sur le dépôt). Ça sert à deux choses :
- Comprendre plus tard pourquoi une décision a été prise (relire ce
  document ne suffit pas toujours)
- Pouvoir revenir en arrière précisément si un changement casse quelque
  chose (`git revert <commit>`), sans toucher au reste

### 3.4 Vérifications avant chaque commit

Avant chaque changement poussé sur GitHub durant cette session, deux
vérifications automatiques ont systématiquement été faites :
- `npx tsc --noEmit` — vérifie que le code TypeScript est cohérent
  (types corrects) SANS générer de fichiers, juste pour détecter les
  erreurs
- `npx eslint --fix` — vérifie le style de code et corrige automatiquement
  ce qui peut l'être

C'est une version manuelle de ce qu'un vrai pipeline CI/CD (intégration
continue) ferait automatiquement à chaque push. **Prochaine étape possible**
si tu veux aller plus loin : configurer GitHub Actions pour que ces
vérifications tournent automatiquement sur chaque pull request.

---

## 4. Cloud

### 4.1 Serverless — pas de serveur à gérer

Sur un VPS classique, un processus tourne en permanence et écoute un port.
Sur Cloudflare Workers, il n'y a **aucun processus permanent** : la fonction
`fetch()` dans `src/server.ts` est exécutée à la demande, pour chaque
requête, sur le centre de données Cloudflare le plus proche du visiteur.
Conséquences concrètes :
- Pas de mise à jour de sécurité du serveur à faire (il n'y a pas de
  serveur au sens classique)
- Facturation à l'usage réel (gratuit jusqu'à 100 000 requêtes/jour)
- Mise à l'échelle automatique — pas de configuration à faire pour absorber
  un pic de trafic

### 4.2 Base de données managée (Supabase)

Supabase héberge et gère PostgreSQL pour nous — pas de serveur de base de
données à installer, sauvegarder, ou mettre à jour manuellement. On
interagit avec via son SDK JavaScript (`@supabase/supabase-js`), utilisé
partout dans `*.server.ts`.

### 4.3 PayTech comme "fournisseur de paiement" externe

On ne gère jamais directement les identifiants bancaires ou mobile money
d'un client — c'est délégué à PayTech, un prestataire déjà agréé par la
BCEAO pour ce rôle. C'est une architecture typique du cloud : déléguer les
responsabilités sensibles (paiement, authentification) à des services
spécialisés plutôt que tout réimplémenter soi-même.

---

## 5. Parcours métier expliqués

### 5.1 Achat Cash (`placeCashOrder`)

1. Client choisit un iPad, remplit adresse/téléphone
2. La commande est créée en base avec le statut `PENDING`
3. Si paiement à la livraison → reste `PENDING`, rien d'autre à faire
   maintenant
4. Sinon (Wave/OM/carte) → un paiement `PENDING` est créé, PayTech renvoie
   une URL de paiement, le navigateur y est redirigé
5. Le client paie chez PayTech (hors de notre site)
6. PayTech notifie notre webhook (`/api/paytech/ipn`) → si la signature est
   valide, la commande passe à `PAID`, le stock est décrémenté

### 5.2 Compte Flex (`openFlexAccount`, `depositToFlex`)

1. Client ouvre un compte Flex pour un iPad (adresse enregistrée dès le
   départ, pour la livraison automatique plus tard)
2. Chaque dépôt suit le même schéma que Cash : paiement `PENDING` → PayTech
   → webhook confirme → **alors seulement** le dépôt est enregistré
   (`flex_deposits`)
3. Un trigger SQL (`recompute_flex_balance`, voir les migrations)
   recalcule automatiquement le solde total à chaque dépôt confirmé
4. Si le solde atteint l'objectif, `finalizeFlexAccountIfCompleted` crée
   automatiquement la commande + la livraison — le client n'a plus rien à
   faire

### 5.3 Tontine (`payContribution`, admin `decideMembership`)

1. Client demande à rejoindre une tontine → statut `PENDING`
2. Un admin approuve ou refuse depuis `/admin/tontines`
3. Une fois approuvé, chaque cotisation suit le même schéma
   paiement→webhook que Flex

---

## 6. Glossaire rapide

| Terme | Définition simple |
|---|---|
| **Webhook** | Une URL que ton serveur expose pour qu'un service externe (ici PayTech) puisse t'appeler et te notifier d'un événement |
| **IPN** | Instant Payment Notification — le nom que PayTech donne à son webhook de confirmation de paiement |
| **HMAC** | Une signature cryptographique calculée avec un secret partagé, qui prouve l'authenticité et l'intégrité d'un message |
| **Idempotent** | Une opération qui produit le même résultat qu'elle soit exécutée une fois ou plusieurs fois |
| **RLS** | Row Level Security — règles d'accès aux données définies directement dans la base PostgreSQL |
| **CSRF** | Cross-Site Request Forgery — une attaque où un site tiers fait exécuter des actions à ton insu ; s'en protège avec un jeton secret |
| **Migration** | Un fichier SQL versionné qui décrit un changement de structure de base de données |
| **Serverless** | Un modèle d'hébergement où le code s'exécute à la demande, sans serveur permanent à gérer |
| **Idempotency key** (`external_reference`) | Un identifiant unique généré par nous pour chaque paiement, qui sert à retrouver et ne jamais dupliquer un paiement lors de la confirmation |
