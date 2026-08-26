# Apple Pace

Tu es un architecte logiciel senior, expert en SaaS, fintech, e-commerce, UX/UI premium et développement full-stack.

Je veux que tu CONÇOIVES ET DÉVELOPPES une application web complète, professionnelle et prête pour la production.

IMPORTANT :

Ce projet n'est PAS une simple landing page ou une simple boutique en ligne.

Je veux une véritable plateforme avec :

- espace public

- espace client

- système Cash

- système Flex

- système Tontine

- paiements

- commandes

- gestion de stock

- gestion des utilisateurs

- back-office administrateur complet

- statistiques

- rapports

- sécurité

- base de données

- architecture évolutive

==================================================

1. CONCEPT DU PROJET

==================================================

La plateforme est spécialisée dans la vente d'iPad Apple provenant des États-Unis.

La V1 vend UNIQUEMENT des iPad Apple.

Le client doit pouvoir acheter un iPad selon trois formules :

1. CASH

2. FLEX

3. TONTINE

Prix de référence :

CASH : 260 000 FCFA

TONTINE : 270 000 FCFA

FLEX : 275 000 FCFA

Ces prix doivent être modifiables dynamiquement depuis le Back-Office.

Le coût fournisseur de référence est de 250 USD par iPad + 30 USD de transport par iPad.

Ces informations sont internes à l'administration et ne doivent pas être affichées publiquement comme prix d'achat.

==================================================

2. IDENTITÉ VISUELLE

==================================================

Je veux une interface haut de gamme inspirée des standards Apple.

Style :

- Apple premium

- minimaliste

- futuriste

- élégant

- glassmorphism

- effet verre

- transparence

- backdrop blur

- profondeur

- ombres douces

- grands espaces

- typographie moderne

- animations fluides

- micro-interactions

- transitions élégantes

Le design doit donner l'impression d'utiliser une application fintech premium.

Ne pas faire un design générique de template SaaS.

Le design doit être original, très travaillé et cohérent.

Palette principale :

- blanc

- bleu très léger

- bleu profond pour les éléments importants

- gris clair

- effets de verre translucide

Prévoir également un mode sombre premium.

L'application doit être parfaitement responsive :

- mobile

- tablette

- laptop

- desktop

Priorité UX : MOBILE FIRST.

==================================================

3. PAGE D'ACCUEIL

==================================================

Créer une landing page premium.

Hero :

"Votre iPad. Votre rythme."

Sous-titre :

"Accédez à votre iPad Apple avec le paiement qui vous correspond."

Présenter les trois possibilités :

CASH

260 000 FCFA

TONTINE

270 000 FCFA

FLEX

275 000 FCFA

CTA :

"Choisir mon iPad"

et

"Découvrir les formules"

Créer une présentation très visuelle des iPad avec des animations élégantes.

Sections :

- Hero

- Pourquoi nous choisir

- Nos iPad

- Cash

- Flex

- Tontine

- Comment ça marche

- Paiements sécurisés

- FAQ

- témoignages

- CTA final

- footer

==================================================

4. CATALOGUE

==================================================

Créer un catalogue dynamique d'iPad.

Chaque produit doit contenir :

- modèle

- génération

- stockage

- couleur

- connectivité

- état

- garantie

- images

- description

- caractéristiques

- stock

- prix Cash

- prix Tontine

- prix Flex

Créer une fiche produit premium.

Les prix doivent être récupérés depuis la base de données.

NE PAS hardcoder les prix dans le frontend.

==================================================

5. COMPTE CLIENT

==================================================

Créer une authentification complète.

Inscription :

- prénom

- nom

- téléphone

- email

- mot de passe

Connexion :

- email/téléphone

- mot de passe

Prévoir :

- récupération de mot de passe

- déconnexion

- protection des routes

- gestion de session

Créer un dashboard client premium.

Le client doit voir :

- résumé de son compte

- commandes

- paiements

- Flex

- Tontines

- notifications

- profil

==================================================

6. FORMULE CASH

==================================================

Le client sélectionne un iPad.

Il choisit :

"CASH"

Le prix est affiché.

Exemple :

iPad

260 000 FCFA

Le client clique :

"Commander"

Puis il paie via le système de paiement.

Après confirmation du paiement :

- créer la commande

- réserver l'iPad

- mettre à jour le stock

- afficher la confirmation

- envoyer une notification

Statuts commande :

PENDING

PAID

CONFIRMED

PREPARING

SHIPPED

DELIVERED

COMPLETED

CANCELLED

==================================================

7. FORMULE FLEX

==================================================

Le Flex est un objectif d'achat individuel.

Prix de référence :

275 000 FCFA

Le client crée un objectif.

Exemple :

Objectif :

iPad

275 000 FCFA

Le client peut déposer :

5 000

10 000

15 000

20 000

etc.

Le montant minimum doit être configurable par l'administrateur.

Dashboard :

275 000 FCFA

──────────────

125 000 FCFA payé

Progression :

45.45 %

Reste :

150 000 FCFA

Créer une barre de progression animée.

Chaque paiement validé doit automatiquement mettre à jour :

- montant payé

- montant restant

- pourcentage

- historique

IMPORTANT :

Le client ne doit JAMAIS pouvoir modifier son propre solde.

Le solde doit uniquement être modifié après confirmation d'un paiement valide côté serveur.

Lorsque :

paid_amount >= target_amount

le Flex passe automatiquement à :

COMPLETED

L'administrateur peut ensuite préparer la commande.

L'iPad ne doit PAS être livré avant que 100 % du montant soit payé.

==================================================

8. ANNULATION FLEX

==================================================

Créer une fonctionnalité de demande d'annulation.

Le client peut demander l'annulation selon les conditions définies par l'entreprise.

Afficher :

- montant payé

- montant restant

- éventuels frais

- montant remboursable

- conditions

La demande doit être envoyée à l'administration.

Statuts :

PENDING

APPROVED

REJECTED

REFUNDED

L'administrateur décide de l'acceptation.

Prévoir également la possibilité de conserver le montant comme crédit client selon les règles définies.

==================================================

9. FORMULE TONTINE

==================================================

IMPORTANT :

Un client ne rejoint PAS automatiquement une tontine.

Le client peut :

"Demander à rejoindre"

Mais l'administrateur doit VALIDER la demande.

Workflow :

Client

↓

Consulte une tontine

↓

Demande à rejoindre

↓

Accepte les conditions

↓

Demande PENDING

↓

Administrateur examine

↓

APPROUVE ou REFUSE

↓

Si approuvé : membre de la tontine

==================================================

10. GESTION DES TONTINES

==================================================

Une tontine doit pouvoir être créée uniquement par un administrateur.

L'administrateur peut définir :

- nom

- produit

- nombre de membres

- prix

- montant des cotisations

- fréquence

- durée

- date de début

- date de fin

- règles d'attribution

- nombre d'iPad disponibles

- conditions

Prix de référence :

270 000 FCFA

Chaque membre doit avoir :

- profil

- statut

- historique

- cotisations

- retards

- iPad attribué

Statuts membre :

PENDING

APPROVED

ACTIVE

SUSPENDED

COMPLETED

REMOVED

==================================================

11. TONTINE : COTISATIONS

==================================================

Créer un système de cotisations.

Chaque échéance doit avoir :

- montant

- date d'échéance

- statut

- paiement

- référence

Statuts :

PENDING

PAID

LATE

CANCELLED

Détecter automatiquement les retards.

Envoyer des notifications.

==================================================

12. TONTINE : CONDITIONS

==================================================

Avant de rejoindre une tontine, afficher clairement :

- montant

- durée

- fréquence

- règles

- conditions

- politique d'annulation

- politique de remboursement

Le client doit cocher :

"J'ai lu et j'accepte les conditions de la tontine."

Enregistrer :

- date

- heure

- utilisateur

- version des conditions acceptées

==================================================

13. PAIEMENTS

==================================================

Préparer l'architecture pour intégrer PAYTECH.

Les paiements doivent pouvoir prendre en charge les moyens disponibles via PayTech, notamment :

- Wave

- Orange Money

- cartes bancaires

IMPORTANT :

Ne jamais considérer un paiement comme réussi simplement parce que le frontend affiche une confirmation.

Le paiement doit être confirmé côté serveur via le mécanisme sécurisé fourni par PayTech.

Créer une table payments.

Chaque paiement contient :

- id

- user_id

- amount

- payment_method

- external_reference

- status

- order_id

- flex_account_id

- tontine_id

- tontine_member_id

- created_at

- confirmed_at

Statuts :

PENDING

SUCCESS

FAILED

CANCELLED

REFUNDED

==================================================

14. STOCK

==================================================

Créer un système complet de gestion du stock.

Un produit peut avoir plusieurs unités.

Prévoir :

AVAILABLE

RESERVED

PREPARING

SHIPPED

DELIVERED

SOLD

L'administrateur doit pouvoir :

- ajouter du stock

- retirer du stock

- modifier le stock

- réserver une unité

- vendre une unité

- voir l'historique

Créer des alertes de stock faible.

==================================================

15. BACK-OFFICE ADMINISTRATEUR

==================================================

C'est une partie CRITIQUE du projet.

Créer un véritable dashboard administrateur professionnel.

L'administrateur doit pouvoir gérer ABSOLUMENT TOUT sans modifier le code.

Dashboard principal :

- chiffre d'affaires

- ventes

- bénéfices/marges estimées

- paiements

- clients

- stock

- Flex

- Tontines

- commandes

- livraisons

- remboursements

Créer des graphiques modernes.

Filtres :

- aujourd'hui

- 7 jours

- 30 jours

- mois

- année

- période personnalisée

==================================================

16. ADMIN : GESTION DES IPAD

==================================================

L'administrateur doit pouvoir :

- ajouter un nouvel iPad

- modifier un iPad

- supprimer/désactiver un iPad

- ajouter des images

- modifier les caractéristiques

- modifier le prix Cash

- modifier le prix Tontine

- modifier le prix Flex

- modifier le prix d'achat

- modifier le coût de transport

- modifier le stock

- modifier la garantie

AUCUN prix ne doit être hardcodé.

==================================================

17. ADMIN : HISTORIQUE DES PRIX

==================================================

Chaque modification de prix doit être enregistrée.

Exemple :

Ancien prix :

260 000

Nouveau prix :

265 000

Administrateur :

Nom

Date :

Date + heure

==================================================

18. ADMIN : CLIENTS

==================================================

Créer une interface complète de gestion des clients.

Recherche :

- nom

- téléphone

- email

- ID client

Fiche client :

- informations

- commandes

- paiements

- Flex

- Tontines

- remboursements

- livraisons

- historique

L'administrateur peut :

- consulter

- suspendre

- réactiver

- modifier certaines informations

- voir l'activité

==================================================

19. ADMIN : TONTINES

==================================================

L'administrateur doit pouvoir :

- créer une tontine

- modifier une tontine

- fermer une tontine

- ajouter un membre

- accepter une demande

- refuser une demande

- suspendre un membre

- voir les cotisations

- voir les retards

- gérer les échéances

- gérer les attributions

- consulter les statistiques

Créer une page :

"Demandes d'adhésion"

avec :

Nom

Téléphone

Date de demande

Historique

Statut

Boutons :

APPROUVER

REFUSER

==================================================

20. ADMIN : FLEX

==================================================

L'administrateur doit pouvoir :

- voir tous les Flex

- rechercher un client

- voir les objectifs

- voir les montants collectés

- voir les montants restants

- voir les paiements

- voir les annulations

- approuver/refuser une annulation

- gérer les remboursements

==================================================

21. ADMIN : COMMANDES

==================================================

Créer une interface permettant de :

- voir toutes les commandes

- filtrer

- rechercher

- modifier les statuts

- voir les paiements

- voir le produit

- voir le client

- voir la livraison

==================================================

22. ADMIN : LIVRAISONS

==================================================

Créer une gestion complète des livraisons.

Informations :

- client

- téléphone

- adresse

- produit

- commande

- livreur

- date

- statut

Statuts :

PENDING

PREPARING

SHIPPED

OUT_FOR_DELIVERY

DELIVERED

FAILED

==================================================

23. ADMIN : RAPPORTS

==================================================

Créer une section :

"Rapports"

Rapports :

- ventes

- chiffre d'affaires

- paiements

- Cash

- Flex

- Tontines

- stock

- clients

- remboursements

- livraisons

Permettre l'export :

CSV

Excel

PDF

==================================================

24. ADMIN : STATISTIQUES

==================================================

Mesurer toute l'activité de l'application.

Exemples :

- nombre de visiteurs

- inscriptions

- conversion

- ventes

- CA

- marge estimée

- produits les plus vendus

- formule la plus utilisée

- moyen de paiement le plus utilisé

- clients actifs

- clients inactifs

- montant moyen des dépôts

- taux d'abandon Flex

- nombre de tontines

- taux de retard

Créer des graphiques interactifs.

==================================================

25. ADMIN : NOTIFICATIONS

==================================================

L'administrateur peut envoyer :

- notification individuelle

- notification à un groupe

- notification à une tontine

- notification à tous les clients

Prévoir une architecture permettant d'ajouter plus tard :

- email

- SMS

- push notifications

==================================================

26. ADMIN : PARAMÈTRES

==================================================

Créer une section paramètres permettant de modifier :

- nom de l'entreprise

- logo

- téléphone

- email

- adresse

- conditions générales

- conditions Flex

- conditions Tontine

- frais d'annulation

- dépôt minimum

- seuil de stock

- paramètres de livraison

==================================================

27. ADMIN : UTILISATEURS ADMIN

==================================================

Prévoir plusieurs rôles.

SUPER_ADMIN :

accès total.

ADMIN :

gestion générale.

FINANCE :

paiements, remboursements, rapports financiers.

STOCK :

produits et stock.

TONTINE_MANAGER :

tontines et membres.

Chaque rôle doit avoir des permissions différentes.

==================================================

28. JOURNAL D'AUDIT

==================================================

Créer un audit log.

Enregistrer toutes les actions importantes.

Exemple :

Admin X

a modifié le prix d'un iPad.

Ancien :

260 000

Nouveau :

265 000

Date :

17/08/2026 14:32

Enregistrer également :

- création

- modification

- suppression

- validation

- remboursement

- changement de statut

- modification de stock

- modification de prix

==================================================

29. BASE DE DONNÉES

==================================================

Utiliser PostgreSQL/Supabase.

Créer une architecture relationnelle propre.

Tables minimales :

users

profiles

admin_users

roles

permissions

products

product_variants

inventory

inventory_movements

orders

order_items

payments

flex_accounts

flex_deposits

flex_cancellations

refunds

tontines

tontine_members

tontine_contributions

tontine_cycles

deliveries

notifications

audit_logs

price_history

settings

Utiliser des relations et contraintes appropriées.

==================================================

30. SÉCURITÉ

==================================================

Utiliser Supabase Auth.

Mettre en place Row Level Security.

Un client ne doit pouvoir accéder qu'à ses propres :

- données

- commandes

- paiements

- Flex

- tontines

- notifications

Les administrateurs doivent avoir des permissions contrôlées par rôle.

IMPORTANT :

Les montants et soldes financiers ne doivent jamais être calculés uniquement côté client.

Toute opération financière sensible doit être contrôlée côté serveur.

==================================================

31. ARCHITECTURE

==================================================

Technologies préférées :

Frontend :

React / Next.js

TypeScript

Tailwind CSS

shadcn/ui

Framer Motion

Backend :

Supabase

PostgreSQL

Supabase Auth

Edge Functions

Paiements :

PayTech

Déploiement :

Vercel

==================================================

32. QUALITÉ DU CODE

==================================================

Je veux :

- composants réutilisables

- architecture propre

- code maintenable

- TypeScript strict

- gestion des erreurs

- loading states

- empty states

- responsive design

- validations

- sécurité

- bonnes pratiques

Ne pas créer une énorme page monolithique.

Séparer les fonctionnalités en composants et modules.

==================================================

33. UX

==================================================

Créer des états :

Loading

Empty

Error

Success

Afficher des confirmations avant les opérations sensibles.

Exemple :

"Êtes-vous sûr de vouloir modifier le prix ?"

"Êtes-vous sûr de vouloir suspendre ce membre ?"

"Êtes-vous sûr de vouloir approuver ce remboursement ?"

==================================================

34. DONNÉES DE DÉMONSTRATION

==================================================

Créer des données de démonstration réalistes pour permettre de tester l'application.

Créer :

- plusieurs iPad

- plusieurs clients

- plusieurs commandes

- plusieurs paiements

- plusieurs Flex

- plusieurs tontines

- plusieurs membres

- plusieurs cotisations

- quelques retards

- statistiques

IMPORTANT :

Les données de démonstration doivent être clairement identifiables et facilement supprimables.

==================================================

35. DASHBOARD PREMIUM

==================================================

Le dashboard administrateur doit ressembler à un véritable logiciel professionnel.

Créer :

- KPI cards

- graphiques

- tableaux

- filtres

- recherche

- badges de statut

- menus latéraux

- notifications

- raccourcis

Prévoir un sidebar :

Dashboard

Produits

Stock

Commandes

Clients

Paiements

Flex

Tontines

Livraisons

Rapports

Statistiques

Notifications

Administrateurs

Paramètres

Audit Logs

==================================================

36. IMPORTANT : NE PAS FAIRE UNE SIMPLE DEMO

==================================================

Je ne veux pas uniquement des interfaces visuelles.

Je veux que les fonctionnalités soient réellement connectées à la base de données.

Exemple :

Créer un produit dans l'administration

→ il doit apparaître dans le catalogue.

Modifier son prix dans l'administration

→ le nouveau prix doit apparaître automatiquement au client.

Créer une tontine dans l'administration

→ elle doit apparaître côté client.

Approuver un membre

→ son statut doit changer.

Effectuer un paiement

→ la transaction doit être enregistrée.

Paiement confirmé

→ le Flex doit être mis à jour.

Flex atteint 100 %

→ l'objectif doit être terminé.

Vente confirmée

→ le stock doit diminuer.

Tout doit être connecté.

==================================================

37. ORDRE DE DÉVELOPPEMENT

==================================================

Ne tente pas de générer tout le projet de manière désordonnée.

Construis progressivement :

PHASE 1 :

Architecture + base de données + authentification.

PHASE 2 :

Catalogue + produits + stock.

PHASE 3 :

Espace client.

PHASE 4 :

Cash.

PHASE 5 :

Flex.

PHASE 6 :

Tontines.

PHASE 7 :

Paiements PayTech.

PHASE 8 :

Back-Office.

PHASE 9 :

Rapports + statistiques.

PHASE 10 :

Notifications + livraisons.

PHASE 11 :

Sécurité + tests.

PHASE 12 :

Polissage UI/UX + animations.

Après chaque phase, vérifie que les fonctionnalités fonctionnent avant de continuer.

==================================================

38. RÈGLE FINALE

==================================================

Construis une application réellement utilisable et évolutive.

Priorités :

1. Fonctionnalités réelles

2. Sécurité

3. Base de données

4. Paiements

5. Administration

6. UX

7. Design premium

8. Animations

Ne sacrifie jamais la sécurité et la logique métier pour obtenir simplement un beau design.

Le résultat final doit être une plateforme SaaS professionnelle permettant à une entreprise de vendre et gérer des iPad avec :

CASH

FLEX

TONTINE

depuis une seule application.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://novipad.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fa37f2c3-7dd9-4d20-bdfa-162d60244c5e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
