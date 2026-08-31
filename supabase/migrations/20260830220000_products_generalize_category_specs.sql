-- Jusqu'ici, la table products était pensée uniquement pour des iPad
-- (storage, generation, connectivity...). L'admin veut pouvoir vendre
-- n'importe quel type de produit (ordinateurs, télévisions...) avec ses
-- propres caractéristiques.
--
-- Approche choisie : ne rien casser de l'existant (les colonnes
-- storage/color/generation/connectivity restent, les iPad déjà en base
-- continuent de s'afficher exactement pareil), et ajouter deux colonnes
-- génériques utilisables par N'IMPORTE QUEL type de produit :
--   - category  : le type de produit, libre (iPad, Ordinateur, Télévision...)
--   - specs     : liste libre de caractéristiques {label, value}, ex.
--                 [{"label":"RAM","value":"16 Go"},{"label":"Écran","value":"55 pouces"}]

alter table public.products
  add column if not exists category text not null default 'iPad',
  add column if not exists specs jsonb not null default '[]'::jsonb;

comment on column public.products.category is
  'Type de produit choisi librement par l''admin (iPad, Ordinateur, Télévision, Smartphone...).';
comment on column public.products.specs is
  'Caractéristiques libres du produit sous forme de paires {label, value}. Généralise les anciens champs storage/color/generation/connectivity, qui restent en base pour compatibilité mais deviennent optionnels et spécifiques à la catégorie iPad.';

create index if not exists products_category_idx on public.products (category);
