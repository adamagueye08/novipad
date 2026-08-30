-- Stories façon Snapchat/WhatsApp : uniquement publiées par l'admin (vitrine
-- boutique), avec une durée de vie personnalisée choisie à la création
-- (pas de valeur fixe imposée), affichées en haut de la page d'accueil.

create type public.story_media_type as enum ('IMAGE', 'VIDEO');

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  title text,
  media_url text not null,
  media_type public.story_media_type not null,
  product_id uuid references public.products(id) on delete set null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index stories_active_expiry_idx on public.stories (is_active, expires_at);

alter table public.stories enable row level security;

-- Lecture publique uniquement des stories actives et non expirées — c'est
-- la base de données elle-même qui fait respecter l'expiration, pas
-- seulement le filtre côté frontend (qui pourrait être contourné).
create policy "stories_public_read" on public.stories
  for select
  using (is_active and expires_at > now());

-- Le staff voit tout (y compris expirées/inactives, pour la page de gestion)
-- et peut tout modifier.
create policy "stories_staff_all" on public.stories
  for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- Stockage des médias (images ET vidéos) des stories.
insert into storage.buckets (id, name, public, file_size_limit)
values ('stories-media', 'stories-media', true, 52428800) -- 50 Mo max
on conflict (id) do nothing;

create policy "stories_media_public_read" on storage.objects
  for select
  using (bucket_id = 'stories-media');

create policy "stories_media_staff_insert" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'stories-media' and public.is_staff(auth.uid()));

create policy "stories_media_staff_delete" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'stories-media' and public.is_staff(auth.uid()));
