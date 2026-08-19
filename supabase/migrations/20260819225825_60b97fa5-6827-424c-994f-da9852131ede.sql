-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','finance','stock','tontine_manager','client');
CREATE TYPE public.account_status AS ENUM ('ACTIVE','SUSPENDED');
CREATE TYPE public.purchase_formula AS ENUM ('CASH','FLEX','TONTINE');
CREATE TYPE public.order_status AS ENUM ('PENDING','PAID','CONFIRMED','PREPARING','SHIPPED','DELIVERED','COMPLETED','CANCELLED');
CREATE TYPE public.payment_status AS ENUM ('PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED');
CREATE TYPE public.unit_status AS ENUM ('AVAILABLE','RESERVED','PREPARING','SHIPPED','DELIVERED','SOLD');
CREATE TYPE public.flex_status AS ENUM ('ACTIVE','COMPLETED','CANCELLED');
CREATE TYPE public.request_status AS ENUM ('PENDING','APPROVED','REJECTED','REFUNDED');
CREATE TYPE public.tontine_status AS ENUM ('DRAFT','OPEN','ACTIVE','CLOSED');
CREATE TYPE public.member_status AS ENUM ('PENDING','APPROVED','ACTIVE','SUSPENDED','COMPLETED','REMOVED');
CREATE TYPE public.contribution_status AS ENUM ('PENDING','PAID','LATE','CANCELLED');
CREATE TYPE public.delivery_status AS ENUM ('PENDING','PREPARING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','FAILED');

-- UTIL
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  status public.account_status NOT NULL DEFAULT 'ACTIVE',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('super_admin','admin','finance','stock','tontine_manager'));
$$;

CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_staff(auth.uid())) WITH CHECK (true);
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "roles_own_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone, email)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name',''),
    COALESCE(NEW.raw_user_meta_data->>'last_name',''),
    NEW.raw_user_meta_data->>'phone',
    NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SETTINGS
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings_staff_write" ON public.settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  generation TEXT,
  storage TEXT,
  color TEXT,
  connectivity TEXT,
  condition TEXT,
  warranty_months INT NOT NULL DEFAULT 6,
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  images TEXT[] NOT NULL DEFAULT '{}',
  price_cash BIGINT NOT NULL DEFAULT 260000,
  price_tontine BIGINT NOT NULL DEFAULT 270000,
  price_flex BIGINT NOT NULL DEFAULT 275000,
  purchase_cost_usd NUMERIC(10,2) NOT NULL DEFAULT 250,
  shipping_cost_usd NUMERIC(10,2) NOT NULL DEFAULT 30,
  stock_quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "products_staff_write" ON public.products FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.inventory_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  serial_number TEXT,
  status public.unit_status NOT NULL DEFAULT 'AVAILABLE',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_units TO authenticated;
GRANT ALL ON public.inventory_units TO service_role;
ALTER TABLE public.inventory_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "units_staff_all" ON public.inventory_units FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.inventory_units(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movements_staff_all" ON public.inventory_movements FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  old_value NUMERIC,
  new_value NUMERIC,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.price_history TO authenticated;
GRANT ALL ON public.price_history TO service_role;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_history_staff" ON public.price_history FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_price_changes() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.price_cash <> OLD.price_cash THEN
    INSERT INTO public.price_history(product_id, field, old_value, new_value, changed_by)
    VALUES (NEW.id,'price_cash',OLD.price_cash,NEW.price_cash,auth.uid());
  END IF;
  IF NEW.price_tontine <> OLD.price_tontine THEN
    INSERT INTO public.price_history(product_id, field, old_value, new_value, changed_by)
    VALUES (NEW.id,'price_tontine',OLD.price_tontine,NEW.price_tontine,auth.uid());
  END IF;
  IF NEW.price_flex <> OLD.price_flex THEN
    INSERT INTO public.price_history(product_id, field, old_value, new_value, changed_by)
    VALUES (NEW.id,'price_flex',OLD.price_flex,NEW.price_flex,auth.uid());
  END IF;
  IF NEW.purchase_cost_usd <> OLD.purchase_cost_usd THEN
    INSERT INTO public.price_history(product_id, field, old_value, new_value, changed_by)
    VALUES (NEW.id,'purchase_cost_usd',OLD.purchase_cost_usd,NEW.purchase_cost_usd,auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER products_price_audit AFTER UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.log_price_changes();

-- TONTINES
CREATE TABLE public.tontines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  member_capacity INT NOT NULL DEFAULT 10,
  price BIGINT NOT NULL DEFAULT 270000,
  contribution_amount BIGINT NOT NULL DEFAULT 27000,
  frequency TEXT NOT NULL DEFAULT 'MONTHLY',
  duration_months INT NOT NULL DEFAULT 10,
  start_date DATE,
  end_date DATE,
  allocation_rules TEXT,
  ipads_available INT NOT NULL DEFAULT 10,
  terms TEXT,
  terms_version TEXT NOT NULL DEFAULT 'v1',
  status public.tontine_status NOT NULL DEFAULT 'DRAFT',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tontines TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tontines TO authenticated;
GRANT ALL ON public.tontines TO service_role;
ALTER TABLE public.tontines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tontines_public_read" ON public.tontines FOR SELECT USING (status IN ('OPEN','ACTIVE') OR public.is_staff(auth.uid()));
CREATE POLICY "tontines_staff_write" ON public.tontines FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER tontines_touch BEFORE UPDATE ON public.tontines FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.tontine_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.member_status NOT NULL DEFAULT 'PENDING',
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,
  assigned_unit_id UUID REFERENCES public.inventory_units(id) ON DELETE SET NULL,
  paid_amount BIGINT NOT NULL DEFAULT 0,
  late_count INT NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tontine_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.tontine_members TO authenticated;
GRANT ALL ON public.tontine_members TO service_role;
ALTER TABLE public.tontine_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_own_select" ON public.tontine_members FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "members_request_insert" ON public.tontine_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'PENDING');
CREATE POLICY "members_staff_update" ON public.tontine_members FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER members_touch BEFORE UPDATE ON public.tontine_members FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.tontine_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
  cycle_index INT NOT NULL,
  start_date DATE,
  end_date DATE,
  beneficiary_member_id UUID REFERENCES public.tontine_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tontine_cycles TO authenticated;
GRANT ALL ON public.tontine_cycles TO service_role;
ALTER TABLE public.tontine_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cycles_read" ON public.tontine_cycles FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.tontine_members m WHERE m.tontine_id = tontine_cycles.tontine_id AND m.user_id = auth.uid()));
CREATE POLICY "cycles_staff_write" ON public.tontine_cycles FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT ('CMD-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.inventory_units(id) ON DELETE SET NULL,
  formula public.purchase_formula NOT NULL,
  amount BIGINT NOT NULL,
  status public.order_status NOT NULL DEFAULT 'PENDING',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_own_select" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "orders_own_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'PENDING');
CREATE POLICY "orders_staff_update" ON public.orders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_read" ON public.order_items FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
CREATE POLICY "order_items_staff_write" ON public.order_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- FLEX
CREATE TABLE public.flex_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  target_amount BIGINT NOT NULL,
  paid_amount BIGINT NOT NULL DEFAULT 0,
  status public.flex_status NOT NULL DEFAULT 'ACTIVE',
  completed_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.flex_accounts TO authenticated;
GRANT ALL ON public.flex_accounts TO service_role;
ALTER TABLE public.flex_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flex_own_select" ON public.flex_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "flex_own_insert" ON public.flex_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND paid_amount = 0 AND status = 'ACTIVE');
CREATE POLICY "flex_staff_update" ON public.flex_accounts FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER flex_touch BEFORE UPDATE ON public.flex_accounts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.flex_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flex_account_id UUID NOT NULL REFERENCES public.flex_accounts(id) ON DELETE CASCADE,
  payment_id UUID,
  amount BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flex_deposits TO authenticated;
GRANT ALL ON public.flex_deposits TO service_role;
ALTER TABLE public.flex_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flex_deposits_read" ON public.flex_deposits FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.flex_accounts f WHERE f.id = flex_deposits.flex_account_id AND f.user_id = auth.uid()));

CREATE TABLE public.flex_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flex_account_id UUID NOT NULL REFERENCES public.flex_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  paid_amount BIGINT NOT NULL DEFAULT 0,
  fee_amount BIGINT NOT NULL DEFAULT 0,
  refundable_amount BIGINT NOT NULL DEFAULT 0,
  keep_as_credit BOOLEAN NOT NULL DEFAULT false,
  status public.request_status NOT NULL DEFAULT 'PENDING',
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.flex_cancellations TO authenticated;
GRANT ALL ON public.flex_cancellations TO service_role;
ALTER TABLE public.flex_cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flexcancel_own_select" ON public.flex_cancellations FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "flexcancel_own_insert" ON public.flex_cancellations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'PENDING');
CREATE POLICY "flexcancel_staff_update" ON public.flex_cancellations FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  payment_method TEXT,
  external_reference TEXT,
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  flex_account_id UUID REFERENCES public.flex_accounts(id) ON DELETE SET NULL,
  tontine_id UUID REFERENCES public.tontines(id) ON DELETE SET NULL,
  tontine_member_id UUID REFERENCES public.tontine_members(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_own_select" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

ALTER TABLE public.flex_deposits ADD CONSTRAINT flex_deposits_payment_fk FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;

CREATE TABLE public.tontine_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tontine_id UUID NOT NULL REFERENCES public.tontines(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.tontine_members(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  due_date DATE NOT NULL,
  status public.contribution_status NOT NULL DEFAULT 'PENDING',
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  reference TEXT,
  paid_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tontine_contributions TO authenticated;
GRANT ALL ON public.tontine_contributions TO service_role;
ALTER TABLE public.tontine_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contrib_read" ON public.tontine_contributions FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.tontine_members m WHERE m.id = tontine_contributions.member_id AND m.user_id = auth.uid()));
CREATE POLICY "contrib_staff_write" ON public.tontine_contributions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- REFUNDS
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  flex_cancellation_id UUID REFERENCES public.flex_cancellations(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL,
  status public.request_status NOT NULL DEFAULT 'PENDING',
  note TEXT,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refunds_own_select" ON public.refunds FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "refunds_staff_write" ON public.refunds FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- DELIVERIES
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT,
  phone TEXT,
  courier_name TEXT,
  scheduled_date DATE,
  status public.delivery_status NOT NULL DEFAULT 'PENDING',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO authenticated;
GRANT ALL ON public.deliveries TO service_role;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deliveries_own_select" ON public.deliveries FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "deliveries_staff_write" ON public.deliveries FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER deliveries_touch BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  channel TEXT NOT NULL DEFAULT 'IN_APP',
  audience TEXT NOT NULL DEFAULT 'USER',
  tontine_id UUID REFERENCES public.tontines(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own_select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR audience = 'ALL' OR public.is_staff(auth.uid()));
CREATE POLICY "notif_own_update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid())) WITH CHECK (true);
CREATE POLICY "notif_staff_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_staff_select" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "audit_staff_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- FLEX BALANCE RECOMPUTE (server-side only)
CREATE OR REPLACE FUNCTION public.recompute_flex_balance() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _total BIGINT; _target BIGINT; _acc UUID;
BEGIN
  _acc := COALESCE(NEW.flex_account_id, OLD.flex_account_id);
  IF _acc IS NULL THEN RETURN NEW; END IF;
  SELECT COALESCE(SUM(amount),0) INTO _total FROM public.flex_deposits WHERE flex_account_id = _acc;
  SELECT target_amount INTO _target FROM public.flex_accounts WHERE id = _acc;
  UPDATE public.flex_accounts
    SET paid_amount = _total,
        status = CASE WHEN status = 'CANCELLED' THEN status WHEN _total >= _target THEN 'COMPLETED' ELSE 'ACTIVE' END,
        completed_at = CASE WHEN _total >= _target AND completed_at IS NULL THEN now() ELSE completed_at END
  WHERE id = _acc;
  RETURN NEW;
END; $$;
CREATE TRIGGER flex_deposits_recompute AFTER INSERT OR UPDATE OR DELETE ON public.flex_deposits
FOR EACH ROW EXECUTE FUNCTION public.recompute_flex_balance();

-- DEFAULT SETTINGS
INSERT INTO public.settings (key, value) VALUES
 ('company', '{"name":"iPad Rythme","phone":"+221 77 000 00 00","email":"contact@ipadrythme.sn","address":"Dakar, Sénégal","logo_url":null}'::jsonb),
 ('flex', '{"min_deposit":5000,"cancellation_fee_percent":10}'::jsonb),
 ('stock', '{"low_stock_threshold":3}'::jsonb),
 ('delivery', '{"free_above":0,"default_fee":0,"zones":["Dakar","Régions"]}'::jsonb),
 ('terms', '{"general":"Conditions générales de vente.","flex":"Conditions de la formule Flex.","tontine":"Conditions des tontines."}'::jsonb);
