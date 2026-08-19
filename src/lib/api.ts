import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  slug: string;
  model: string;
  generation: string | null;
  storage: string | null;
  color: string | null;
  connectivity: string | null;
  condition: string | null;
  warranty_months: number;
  description: string | null;
  features: unknown;
  images: string[];
  price_cash: number;
  price_tontine: number;
  price_flex: number;
  stock_quantity: number;
  is_active: boolean;
  is_demo: boolean;
};

const PRODUCT_COLUMNS =
  "id,slug,model,generation,storage,color,connectivity,condition,warranty_months,description,features,images,price_cash,price_tontine,price_flex,stock_quantity,is_active,is_demo";

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("is_active", true)
        .order("price_cash", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Product | null;
    },
  });

export type Tontine = {
  id: string;
  name: string;
  product_id: string | null;
  member_capacity: number;
  price: number;
  contribution_amount: number;
  frequency: string;
  duration_months: number;
  start_date: string | null;
  end_date: string | null;
  allocation_rules: string | null;
  ipads_available: number;
  terms: string | null;
  terms_version: string;
  status: string;
};

export const tontinesQuery = () =>
  queryOptions({
    queryKey: ["tontines"],
    queryFn: async (): Promise<Tontine[]> => {
      const { data, error } = await supabase
        .from("tontines")
        .select(
          "id,name,product_id,member_capacity,price,contribution_amount,frequency,duration_months,start_date,end_date,allocation_rules,ipads_available,terms,terms_version,status",
        )
        .in("status", ["OPEN", "ACTIVE"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Tontine[];
    },
  });

export const settingsQuery = () =>
  queryOptions({
    queryKey: ["settings"],
    queryFn: async (): Promise<Record<string, Record<string, unknown>>> => {
      const { data, error } = await supabase.from("settings").select("key,value");
      if (error) throw error;
      const map: Record<string, Record<string, unknown>> = {};
      for (const row of data ?? []) {
        map[row.key] = (row.value ?? {}) as Record<string, unknown>;
      }
      return map;
    },
  });

/** Prix affichés par formule, toujours issus de la base de données. */
export function formulaPrices(products: Product[]) {
  if (!products.length) return null;
  const cheapest = products.reduce((a, b) => (a.price_cash <= b.price_cash ? a : b));
  return {
    cash: cheapest.price_cash,
    tontine: cheapest.price_tontine,
    flex: cheapest.price_flex,
  };
}
