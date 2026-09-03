import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { productsQuery } from "@/lib/api";

const TITLE = "Notre catalogue — JokkoTech";
const DESCRIPTION =
  "Parcourez tous nos produits disponibles : caractéristiques, prix Cash, Flex ou Tontine mis à jour en direct.";

export const Route = createFileRoute("/catalogue/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: CataloguePage,
});

type Sort = "price-asc" | "price-desc" | "model";

function CataloguePage() {
  const { data: products = [], isLoading } = useQuery(productsQuery());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [storage, setStorage] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("price-asc");

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
    [products],
  );

  const storages = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .filter((p) => !category || p.category === category)
            .map((p) => p.storage)
            .filter(Boolean),
        ),
      ) as string[],
    [products, category],
  );

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = products.filter((p) => {
      const haystack =
        `${p.model} ${p.category ?? ""} ${p.generation ?? ""} ${p.color ?? ""} ${p.connectivity ?? ""}`.toLowerCase();
      return (
        (!q || haystack.includes(q)) &&
        (!category || p.category === category) &&
        (!storage || p.storage === storage)
      );
    });
    return filtered.sort((a, b) => {
      if (sort === "price-asc") return a.price_cash - b.price_cash;
      if (sort === "price-desc") return b.price_cash - a.price_cash;
      return a.model.localeCompare(b.model);
    });
  }, [products, search, category, storage, sort]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader />
      <main className="container-page py-12 md:py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Notre catalogue
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Tous nos produits en stock, avec les trois prix affichés : Cash, Flex et Tontine.
        </p>

        <div className="glass mt-8 flex flex-col gap-4 rounded-3xl p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit, un coloris…"
                className="pl-9"
                aria-label="Rechercher un produit"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Trier"
              className="h-9 rounded-full border border-input bg-background px-4 text-sm"
            >
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="model">Modèle (A-Z)</option>
            </select>
          </div>

          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={category === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCategory(null);
                  setStorage(null);
                }}
              >
                Tous les produits
              </Button>
              {categories.map((c) => (
                <Button
                  key={c}
                  variant={category === c ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCategory(c);
                    setStorage(null);
                  }}
                >
                  {c}
                </Button>
              ))}
            </div>
          )}

          {storages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={storage === null ? "default" : "outline"}
                size="sm"
                onClick={() => setStorage(null)}
              >
                Toutes capacités
              </Button>
              {storages.map((s) => (
                <Button
                  key={s}
                  variant={storage === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStorage(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="mt-12 text-muted-foreground">
            Aucun produit ne correspond à votre recherche.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <MobileBottomNav />
      <SiteFooter />
    </div>
  );
}
