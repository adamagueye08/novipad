-- Mise en relation client-livreur.
-- 1) Table `couriers` : les livreurs sont des fiches gérées uniquement par
--    l'équipe interne (pas d'auto-inscription livreur pour l'instant, donc
--    pas de lien vers auth.users — juste un profil texte + téléphone,
--    identique dans l'esprit à `courier_name` qui existait déjà sur
--    `deliveries`, mais devenu une vraie entité réutilisable).
-- 2) `deliveries.courier_id` remplace l'usage de `courier_name` en texte
--    libre : on assigne un livreur existant plutôt que de retaper son nom à
--    chaque commande. `courier_name` est conservé (colonne existante, non
--    supprimée) pour ne pas casser l'historique déjà en base ; le code
--    applicatif n'écrit plus dedans, seul `courier_id` est utilisé désormais.
-- 3) RLS : un client ne peut lire QUE le livreur assigné à l'une de ses
--    propres livraisons (jamais la liste complète des livreurs) — c'est la
--    même logique de "sécurité au niveau de la base" que pour orders/
--    deliveries (voir section 2.5 du GUIDE).

CREATE TABLE public.couriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle TEXT,
  zone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.couriers TO authenticated;
GRANT ALL ON public.couriers TO service_role;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;

-- Staff : accès complet (création/désactivation/suppression des livreurs).
CREATE POLICY "couriers_staff_all" ON public.couriers
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Client : ne peut lire qu'un livreur assigné à l'une de SES livraisons.
CREATE POLICY "couriers_client_select_assigned" ON public.couriers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deliveries d
      WHERE d.courier_id = couriers.id AND d.user_id = auth.uid()
    )
  );

CREATE TRIGGER couriers_touch BEFORE UPDATE ON public.couriers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS courier_id UUID REFERENCES public.couriers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS courier_assigned_at TIMESTAMPTZ;
