# NoviPad

Plateforme e-commerce premium dédiée à la vente d'iPad, avec trois formules de paiement flexibles : Cash, Flex (épargne progressive) et Tontine (achat collectif).

📚 **[Documentation pédagogique complète](./docs/GUIDE.md)** — architecture, cybersécurité, DevOps, cloud, expliqués à travers le code réel du projet.

## Fonctionnalités

### Espace client
- Catalogue d'iPad avec caractéristiques détaillées
- Achat **Cash** : paiement en une fois
- **Flex** : le client définit un objectif d'épargne et dépose progressivement jusqu'à atteindre le montant de l'iPad
- **Tontine** : demande d'adhésion à une tontine (validée par un administrateur), cotisations échelonnées, attribution des iPad aux membres
- Suivi des commandes, paiements et livraisons
- Authentification sécurisée (inscription, connexion, gestion de session)

### Back-office administrateur
- Gestion du catalogue et des prix (Cash / Flex / Tontine), avec historique des modifications
- Gestion des stocks (réservation, vente, alertes de stock faible)
- Gestion des clients, commandes et livraisons
- Gestion des tontines : création, validation des demandes d'adhésion, suivi des cotisations et des retards
- Gestion des Flex : suivi des objectifs, approbation des annulations et remboursements
- Rapports et statistiques (ventes, chiffre d'affaires, formule la plus utilisée...), exportables en CSV/Excel/PDF
- Rôles administrateurs différenciés (Super Admin, Finance, Stock, Gestionnaire de tontines...)
- Journal d'audit des actions sensibles

## Stack technique

- **Frontend** : React, TypeScript, TanStack Router
- **UI** : Tailwind CSS, shadcn/ui
- **Backend / Base de données** : Supabase (authentification, PostgreSQL, Row Level Security)
- **Paiements** : intégration prévue avec PayTech (Wave, Orange Money, cartes bancaires)

## Démarrage local

```bash
npm install
cp .env.example .env   # renseigner les identifiants Supabase
npm run dev
```

## Sécurité

- Authentification via Supabase Auth avec Row Level Security : chaque client n'accède qu'à ses propres données
- Aucune opération financière sensible n'est validée côté client : tout paiement est confirmé côté serveur
- Les identifiants Supabase sont définis dans un fichier `.env` local (voir `.env.example`), jamais versionné
