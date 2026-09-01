-- Bug détecté : les pages Commandes, Paiements, Tontines (demandes
-- d'adhésion) et Flex — Annulations n'affichaient jamais aucune donnée.
--
-- Cause : orders.user_id, tontine_members.user_id, payments.user_id et
-- flex_cancellations.user_id référençaient auth.users(id) plutôt que
-- public.profiles(id). Or le code admin fait des jointures du type
-- `profiles:user_id(first_name,last_name,phone)` — PostgREST ne peut
-- détecter automatiquement une relation pour ce genre de jointure que si
-- la clé étrangère pointe DIRECTEMENT vers la table demandée dans le
-- select (ici "profiles"). Comme la clé pointait vers auth.users (un
-- schéma interne, pas exposé à l'API), PostgREST ne trouvait aucune
-- relation et la requête entière échouait silencieusement — d'où des
-- pages qui semblaient juste vides.
--
-- Le correctif est sans risque : public.profiles.id référence déjà
-- auth.users(id) en 1-pour-1 (un profil est créé automatiquement à
-- l'inscription, voir la fonction handle_new_user), donc repointer ces
-- clés vers profiles(id) ne change aucune donnée existante.

alter table public.orders
  drop constraint if exists orders_user_id_fkey,
  add constraint orders_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.tontine_members
  drop constraint if exists tontine_members_user_id_fkey,
  add constraint tontine_members_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.payments
  drop constraint if exists payments_user_id_fkey,
  add constraint payments_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.flex_cancellations
  drop constraint if exists flex_cancellations_user_id_fkey,
  add constraint flex_cancellations_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;
