-- Stockage des images produits (upload direct depuis l'admin, ordinateur ou
-- mobile) au lieu de coller des URLs à la main.
--
-- Bucket public en lecture (les photos doivent s'afficher sur le site pour
-- tout le monde), mais l'écriture (ajout/suppression) est réservée au staff
-- — même principe que la policy "products_staff_write" déjà en place sur la
-- table products.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select
  using (bucket_id = 'product-images');

create policy "product_images_staff_insert" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_staff(auth.uid()));

create policy "product_images_staff_update" on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_staff(auth.uid()));

create policy "product_images_staff_delete" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_staff(auth.uid()));
