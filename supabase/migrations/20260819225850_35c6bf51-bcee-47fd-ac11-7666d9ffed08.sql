REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_price_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_flex_balance() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP POLICY "products_public_read" ON public.products;
CREATE POLICY "products_anon_read" ON public.products FOR SELECT TO anon USING (is_active);
CREATE POLICY "products_auth_read" ON public.products FOR SELECT TO authenticated USING (is_active OR public.is_staff(auth.uid()));

DROP POLICY "tontines_public_read" ON public.tontines;
CREATE POLICY "tontines_anon_read" ON public.tontines FOR SELECT TO anon USING (status IN ('OPEN','ACTIVE'));
CREATE POLICY "tontines_auth_read" ON public.tontines FOR SELECT TO authenticated USING (status IN ('OPEN','ACTIVE') OR public.is_staff(auth.uid()));

DROP POLICY "settings_public_read" ON public.settings;
CREATE POLICY "settings_anon_read" ON public.settings FOR SELECT TO anon USING (true);
CREATE POLICY "settings_auth_read" ON public.settings FOR SELECT TO authenticated USING (true);

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
