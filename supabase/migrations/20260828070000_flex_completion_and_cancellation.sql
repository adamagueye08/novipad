-- Compte Flex complet :
-- 1) Adresse/téléphone de livraison capturés à l'ouverture du compte Flex
--    (au même titre que pour une commande Cash), pour pouvoir livrer
--    automatiquement une fois l'épargne complétée.
-- 2) Lien entre une commande auto-créée et le compte Flex qui l'a générée,
--    pour éviter de créer deux fois la commande si le trigger de recalcul
--    du solde se déclenche plusieurs fois.

ALTER TABLE public.flex_accounts
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_phone TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS flex_account_id UUID REFERENCES public.flex_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_flex_account_id_idx ON public.orders (flex_account_id);
