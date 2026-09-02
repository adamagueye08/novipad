# JokkoTech — Documentation pédagogique

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
6. [Explication détaillée, fichier par fichier](#7-explication-détaillée-fichier-par-fichier)
7. [Glossaire rapide](#8-glossaire-rapide)

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
parlent en HTTP. JokkoTech utilise **TanStack Start**, un framework qui compile
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
pourrait faire exécuter des actions sur JokkoTech à l'insu d'un client connecté
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

### 5.4 Mise en relation client-livreur (`assignCourier`)

**Le choix de conception** : pas d'auto-inscription livreur pour l'instant
— un livreur est une simple fiche (nom, téléphone, véhicule, zone) créée
par l'équipe interne depuis `/admin/livreurs`, pas un compte avec
connexion. C'est délibérément le plus simple qui fonctionne : on ajoutera
un vrai compte livreur (avec son propre espace pour mettre à jour le
statut) seulement si le volume de commandes le justifie un jour.

1. L'équipe crée les fiches livreurs une fois (`/admin/livreurs`,
   `createCourier`/`updateCourier` dans `admin.server.ts`)
2. Depuis `/admin/commandes`, chaque ligne "Livraison" a désormais un
   sélecteur : assigner (ou retirer) un livreur à cette livraison
   (`assignCourier`)
3. Assigner un livreur fait automatiquement passer la livraison à
   `OUT_FOR_DELIVERY` (si elle était encore à `PENDING`/`PREPARING`), et
   crée une notification pour le client avec le nom et le téléphone du
   livreur — le même mécanisme `notifications` que pour les messages
   admin→client (section 7.5)
4. Le client voit le livreur assigné directement dans « Mes commandes »
   (dashboard) et peut suivre le détail sur une page dédiée
   `/livraison/$orderId` : timeline de statut, coordonnées du livreur avec
   bouton d'appel direct (`tel:`), adresse de livraison

**Sécurité (RLS) — le point le plus important de cette fonctionnalité** :
un client ne doit voir QUE le livreur assigné à SES propres livraisons,
jamais l'annuaire complet. Contrairement aux autres tables où RLS compare
`auth.uid()` à une colonne `user_id` de la même ligne, ici la policy sur
`couriers` doit vérifier une relation indirecte (est-ce que CE livreur est
référencé par UNE livraison qui M'appartient ?) :

```sql
CREATE POLICY "couriers_client_select_assigned" ON public.couriers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deliveries d
      WHERE d.courier_id = couriers.id AND d.user_id = auth.uid()
    )
  );
```

📍 **À lire** : `supabase/migrations/20260902090000_couriers_and_delivery_assignment.sql`
(schéma complet + policies), `src/lib/admin.server.ts` (`listCouriers`,
`createCourier`, `updateCourier`, `deleteCourier`, `assignCourier`),
`src/routes/_authenticated/admin/livreurs.tsx` (CRUD admin),
`src/routes/_authenticated/livraison.$orderId.tsx` (page client)

---

## 7. Explication détaillée, fichier par fichier

> Cette section va en profondeur : après l'avoir lue en gardant les fichiers
> ouverts à côté, tu dois pouvoir relire n'importe quelle page du projet et
> comprendre chaque ligne. L'objectif n'est pas de mémoriser, mais de
> reconnaître les **patterns** (les mêmes reviennent partout).

### 7.0 Les briques transversales — à comprendre AVANT tout le reste

Ces quelques concepts reviennent dans presque tous les fichiers. Une fois
qu'ils sont clairs, lire n'importe quelle page devient mécanique.

#### a) React : composant fonctionnel + hooks

Chaque page est une simple fonction JavaScript qui retourne du JSX (du HTML
écrit dans du JS) :

```tsx
function FormulasPage() {
  return <div>...</div>;
}
```

Les **hooks** (fonctions qui commencent par `use`) donnent des
"super-pouvoirs" à ce composant :
- `useState("")` → une variable qui, quand elle change, refait afficher le
  composant automatiquement (ex: le champ `amount` du formulaire de dépôt)
- `useEffect(() => {...}, [])` → exécute du code après l'affichage (ex:
  `use-auth.ts` s'abonne aux changements de connexion)

📍 Exemple simple à lire en premier : `src/hooks/use-auth.ts`

#### b) TanStack Router — le routage par fichiers

Chaque fichier dans `src/routes/` devient automatiquement une URL. Le nom
du fichier détermine l'URL :
- `src/routes/formules.tsx` → `/formules`
- `src/routes/_authenticated/dashboard.tsx` → `/dashboard` (le préfixe
  `_authenticated/` groupe les pages protégées SANS apparaître dans l'URL)
- `src/routes/_authenticated/admin/produits.tsx` → `/admin/produits`
- `src/routes/commander.$slug.tsx` → `/commander/nom-du-produit` (le `$`
  signifie "paramètre dynamique", récupéré avec `Route.useParams()`)

Chaque fichier de route exporte un objet `Route` créé avec
`createFileRoute("/chemin")({ component: MonComposant })`. **Important** :
`src/routeTree.gen.ts` est un fichier **généré automatiquement** à partir
de ces fichiers de route — normalement, on ne le modifie jamais à la main
(je l'ai fait manuellement dans ce projet uniquement parce que je n'avais
pas accès à l'outil de génération automatique dans mon environnement ; toi,
en local, la commande `bun run dev` le régénère toute seule dès que tu
ajoutes un fichier dans `routes/`).

#### c) TanStack Query — aller chercher des données

Plutôt que d'écrire soi-même la gestion du chargement/erreur/cache, on
utilise `useQuery` :

```tsx
const { data, isLoading } = useQuery({
  queryKey: ["admin-products"],   // identifiant unique de cette donnée
  queryFn: () => fetchProducts(), // comment aller la chercher
});
```

`queryKey` sert aussi à **invalider le cache** après une modification :
`queryClient.invalidateQueries({ queryKey: ["admin-products"] })` force
TanStack Query à refaire la requête (utilisé après chaque création/
modification dans les pages admin).

#### d) `createServerFn` — le pont entre le navigateur et le serveur

C'est LE pattern le plus important du projet. Une fonction serveur se
définit en 2 parties toujours dans le même ordre :

```ts
export const adminCreateProductFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])         // 1. qui a le droit d'appeler ?
  .inputValidator((data: unknown) =>          // 2. les données reçues sont-elles valides ?
    z.object({ product: productPatchSchema }).parse(data),
  )
  .handler(async ({ data, context }) => {     // 3. le vrai code, exécuté SEULEMENT côté serveur
    const { ensureStaff, createProduct } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return createProduct({ product: data.product, actorId: context.userId });
  });
```

Ce code est écrit dans un fichier `*.functions.ts`, mais **n'est jamais
envoyé au navigateur du client** — TanStack Start le remplace
automatiquement par un simple appel réseau. Le vrai travail (accès à la
base de données) est délégué à un fichier `*.server.ts` (import dynamique
`await import(...)`, qui garantit que ce code ne peut techniquement pas
finir dans le bundle JavaScript envoyé au navigateur).

Côté composant React, on "active" cette fonction avec `useServerFn` :

```tsx
const createProduct = useServerFn(adminCreateProductFn);
await createProduct({ data: { product: {...} } });
```

📍 **Résumé du flux** : Composant React → `useServerFn` → réseau (protégé
CSRF) → `createServerFn` → `middleware` (auth) → `inputValidator` (Zod) →
`handler` → fichier `*.server.ts` → Supabase.

#### e) Zod — valider des données à l'exécution

TypeScript vérifie les types **au moment d'écrire le code** (avant même de
l'exécuter), mais il ne peut RIEN garantir sur des données reçues depuis le
réseau au moment de l'exécution (un client malveillant peut envoyer
n'importe quoi). Zod comble ce trou :

```ts
z.object({
  productId: z.string().uuid(),        // doit être un UUID valide
  amount: z.number().int().nonnegative(), // entier, jamais négatif
  reason: z.string().max(500).optional(), // texte, 500 caractères max, peut être absent
})
```

Si les données ne respectent pas ce schéma, `.parse(data)` lève une erreur
et le `handler` n'est **jamais exécuté**. C'est une couche de sécurité à
part entière : jamais faire confiance aux données venues du client.

#### f) shadcn/ui — les briques d'interface

Les composants dans `src/components/ui/` (`Button`, `Dialog`, `Table`,
`Select`...) ne sont pas une librairie externe classique — ce sont des
fichiers **copiés dans le projet**, basés sur Radix UI (accessibilité) +
Tailwind CSS (classes utilitaires comme `flex`, `gap-4`, `rounded-2xl`).
Avantage : on peut les modifier directement si besoin, pas de "boîte
noire".

#### g) Le client Supabase : deux instances différentes, jamais interchangeables

| Fichier | Instance | Clé utilisée | Où l'utiliser |
|---|---|---|---|
| `src/integrations/supabase/client.ts` | `supabase` | Clé publique ("publishable") | Dans les composants React (navigateur) — respecte RLS |
| `src/integrations/supabase/client.server.ts` | `supabaseAdmin` | Clé "service role" (secrète) | Dans les fichiers `*.server.ts` uniquement — **contourne** RLS |

Confondre les deux serait une faille de sécurité grave : la clé service
role ne doit **jamais** atteindre le navigateur (elle donnerait un accès
total à la base à n'importe qui inspecte le code source de la page).

---

### 7.1 Authentification

| Fichier | Rôle |
|---|---|
| `src/hooks/use-auth.ts` | Hook React qui expose l'utilisateur connecté (`user`, `session`) partout dans l'app, et se met à jour automatiquement (connexion/déconnexion) |
| `src/routes/_authenticated/route.tsx` | Le "garde" : toutes les pages sous `_authenticated/` (dashboard, admin, commander) passent par `beforeLoad`, qui vérifie la session Supabase et redirige vers `/auth` si absente — **avant même que la page ne s'affiche** |
| `src/integrations/supabase/auth-middleware.ts` | Équivalent côté serveur : `requireSupabaseAuth`, utilisé dans `.middleware([...])` de chaque fonction serveur sensible, vérifie le jeton envoyé par le navigateur et fournit `context.userId` |
| `src/routes/auth.tsx` | Formulaire de connexion/inscription |

**À retenir** : il y a TOUJOURS deux niveaux de vérification — un côté
frontend (`_authenticated/route.tsx`, pour l'expérience utilisateur : éviter
d'afficher une page puis rediriger) et un côté serveur
(`requireSupabaseAuth`, pour la vraie sécurité). **Le frontend seul ne
protège jamais rien** : n'importe qui peut appeler une fonction serveur
directement (via les outils développeur du navigateur) en contournant
totalement l'interface. C'est le contrôle serveur qui compte réellement.

### 7.2 Pages publiques (accessibles sans compte)

| Fichier | Contenu |
|---|---|
| `src/routes/index.tsx` | Page d'accueil |
| `src/routes/catalogue.index.tsx` | Liste des iPad actifs (`productsQuery()` dans `src/lib/api.ts`, filtré `is_active = true`) |
| `src/routes/formules.tsx` | Explication des 3 formules Cash/Flex/Tontine, étapes, FAQ — page 100% statique (pas d'appel serveur), juste du contenu |
| `src/routes/tontines.tsx` | Liste des tontines ouvertes, via `tontinesQuery()` |
| `src/routes/auth.tsx` | Connexion / inscription |

📍 `src/lib/api.ts` centralise les requêtes **publiques** en lecture seule
(via le client `supabase` classique, donc soumises à RLS — un visiteur non
connecté ne peut lire que ce que les policies autorisent explicitement,
typiquement les produits actifs et les tontines ouvertes).

### 7.3 Le parcours d'achat — `commander.$slug.tsx`

C'est la page la plus complexe côté client : un seul formulaire qui change
de comportement selon la formule choisie (`formula === "CASH"` vs
`"FLEX"`).

**Ce qu'il faut comprendre du flux** :
1. Le `slug` de l'URL (ex: `/commander/ipad-11e-generation`) identifie le
   produit — récupéré et affiché
2. Le client choisit Cash ou Flex, remplit adresse/téléphone
3. À la soumission (`onSubmit`), on appelle soit `placeCashOrderFn`
   (`useServerFn(placeCashOrderFn)`) soit `openFlexAccountFn` +
   éventuellement `depositToFlexFn`
4. **Point clé à retenir** : dans les deux cas, si la réponse contient un
   `redirectUrl`, on fait `window.location.href = res.redirectUrl` — ça
   quitte complètement le site pour la page de paiement PayTech. On ne sait
   PAS encore si le client va réellement payer ; la confirmation viendra
   plus tard, via le webhook (voir section 7.6)

### 7.4 L'espace client — `dashboard.tsx`

Trois blocs indépendants, chacun avec sa propre requête `useQuery` :
- **Mes commandes** (`orders`) — lecture directe via le client `supabase`
  (RLS filtre automatiquement sur l'utilisateur connecté)
- **Mes comptes Flex** (`flex`, `flexDeposits`, `flexCancellations`) — trois
  requêtes séparées, croisées côté React (`.filter(...)`) plutôt qu'une
  jointure SQL complexe, pour rester simple à lire
- **Mes tontines** (`tontines`)

**Deux composants "boîte à outils" à repérer, réutilisés dans plusieurs
blocs** :
- `DepositForm` — formulaire de dépôt Flex, redirige vers PayTech
- `CancelFlexDialog` — la modale d'annulation, qui **calcule en direct** le
  montant remboursable selon le choix "remboursement" (frais appliqués) ou
  "crédit" (sans frais), en interrogeant `flexSettingsFn` pour ne jamais
  coder le pourcentage en dur côté frontend

### 7.5 Le back-office admin (`src/routes/_authenticated/admin/`)

| Fichier | Rôle |
|---|---|
| `route.tsx` | Layout partagé : vérifie `myAccessFn` (le rôle staff), affiche le menu (`NAV`), enveloppe toutes les pages admin dans `<Outlet />` |
| `index.tsx` | Vue d'ensemble — indicateurs agrégés (`adminOverviewFn`) |
| `produits.tsx` | CRUD complet des iPad (créer/modifier/désactiver), historique des prix |
| `tontines.tsx` | Demandes d'adhésion (approuver/refuser) + vue d'ensemble par tontine |
| `flex.tsx` | Demandes d'annulation Flex (approuver/refuser/marquer remboursé) |
| `commandes.tsx` | Liste des commandes toutes formules confondues, changement de statut, assignation d'un livreur à chaque livraison |
| `livreurs.tsx` | CRUD des fiches livreurs (nom, téléphone, véhicule, zone, actif/inactif) — voir section 5.4 |
| `paiements.tsx` | Liste des paiements, réconciliation manuelle en filet de sécurité |
| `utilisateurs.tsx` | Liste clients + équipe, changement de rôle, suspension |

**Le pattern répété dans CHAQUE page admin** (une fois compris ici, tu
reconnais toutes les pages) :

```tsx
const queryClient = useQueryClient();
const fetchX = useServerFn(adminXFn);       // lire
const doY = useServerFn(adminYFn);          // agir (créer/modifier/décider)

const { data, isLoading } = useQuery({ queryKey: ["admin-x"], queryFn: () => fetchX() });

async function onAction() {
  await doY({ data: {...} });
  toast.success("...");
  queryClient.invalidateQueries({ queryKey: ["admin-x"] }); // rafraîchit l'affichage
}
```

**Sécurité en profondeur (defense in depth)** — remarque qu'il y a TROIS
niveaux de protection empilés sur chaque action admin, jamais un seul :
1. `route.tsx` vérifie `myAccessFn` côté React (n'affiche même pas le menu
   admin si pas staff)
2. Chaque `createServerFn` a `.middleware([requireSupabaseAuth])` (faut être
   connecté)
3. Chaque `handler` appelle `await ensureStaff(context.supabase,
   context.userId)` **avant** de faire quoi que ce soit (faut être staff)

Si un des trois niveaux avait un bug, les deux autres protègent encore.

### 7.6 La couche serveur — où vit toute la logique métier

C'est le cœur du projet. Toujours la même séparation en deux fichiers par
domaine :

| Domaine | `*.functions.ts` (le "contrat" exposé) | `*.server.ts` (le vrai travail) |
|---|---|---|
| Achat/paiement | `checkout.functions.ts` | `checkout.server.ts` |
| Back-office | `admin.functions.ts` | `admin.server.ts` |
| PayTech | — (pas de `createServerFn`, voir ci-dessous) | `paytech.server.ts` |

**Pourquoi cette séparation ?** `checkout.functions.ts` ne contient QUE la
définition des `createServerFn` (validation Zod + appel au vrai code). Le
vrai code (accès Supabase, calculs, logique métier) est dans
`checkout.server.ts`, importé dynamiquement (`await import(...)`) depuis le
`handler`. Ça permet à `paytech.server.ts` (appelé aussi par le webhook
dans `server.ts`, en dehors de tout `createServerFn`) de réutiliser les
mêmes fonctions métier (`confirmPaytechPayment`) sans dépendre du mécanisme
RPC.

**Fonctions clés de `checkout.server.ts` à bien connaître** :
- `placeCashOrder`, `openFlexAccount`, `depositToFlex`, `payContribution`
  → créent une commande/un compte/un paiement en base, **puis** appellent
  `createPaytechPayment` (sauf paiement à la livraison) pour obtenir
  `redirectUrl`
- `confirmPaytechPayment` → LA fonction pivot, appelée uniquement par le
  webhook, qui finalise réellement chaque opération (voir section 2.4 sur
  l'idempotence)
- `finalizeFlexAccountIfCompleted` → déclenchée automatiquement quand un
  compte Flex atteint 100%, crée la commande + livraison sans action du
  client

**`src/lib/paytech.server.ts`** — le seul fichier qui parle réellement au
réseau PayTech (`fetch(...)` vers `paytech.sn/api`). Toute la logique de
sécurité (section 2.2) y vit : `createPaytechPayment` (créer une demande de
paiement) et `verifyPaytechIpn` (vérifier une notification).

**`src/server.ts`** — déjà détaillé en section 2.1 et 2.3. À retenir : ce
fichier route `/api/paytech/ipn` à la main, avant de laisser TanStack Start
gérer tout le reste.

### 7.7 La couche données

| Fichier | Rôle |
|---|---|
| `src/integrations/supabase/types.ts` | Types TypeScript générés depuis le schéma de la base — normalement regénérés automatiquement par `supabase gen types` ; ici, édités à la main à certains endroits car mon environnement n'a pas accès réseau à Supabase (voir les migrations "manuelles" section 3.1) |
| `supabase/migrations/*.sql` | L'historique complet du schéma, dans l'ordre chronologique (nom de fichier = date) |
| `supabase/config.toml` | Configuration du projet Supabase (non détaillé ici) |

**Comment lire une migration** : chaque fichier commence généralement par
un commentaire expliquant le "pourquoi" (regarde
`20260828070000_flex_completion_and_cancellation.sql` comme exemple de
style à suivre pour toute future migration).

### 7.8 Le "câblage" du framework (à connaître, rarement à modifier)

| Fichier | Rôle |
|---|---|
| `src/router.tsx` | Crée l'instance du routeur (`createRouter`), y attache TanStack Query (`context: { queryClient }`) |
| `src/start.ts` | Configuration TanStack Start : middleware CSRF (voir section 2.1) |
| `src/routeTree.gen.ts` | Généré automatiquement, ne pas éditer à la main sauf cas de force majeure (voir 7.0-b) |
| `vite.config.ts` | Configuration du build (Vite + plugin TanStack Start + Nitro/Cloudflare) |

---

## 8. Glossaire rapide

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
