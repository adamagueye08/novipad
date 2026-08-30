import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { AnimatedBackground } from "@/components/site/AnimatedBackground";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { productsQuery } from "@/lib/api";

const TITLE = "Nos iPad disponibles — JokkoTech";
const DESCRIPTION =
  "Parcourez les iPad Apple disponibles : capacités, coloris, connectivité et prix Cash, Flex ou Tontine mis à jour en direct.";

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
  const [storage, setStorage] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("price-asc");

  const storages = useMemo(
    () => Array.from(new Set(products.map((p) => p.storage).filter(Boolean))) as string[],
    [products],
  );

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = products.filter((p) => {
      const haystack =
        `${p.model} ${p.generation ?? ""} ${p.color ?? ""} ${p.connectivity ?? ""}`.toLowerCase();
      return (!q || haystack.includes(q)) && (!storage || p.storage === storage);
    });
    return filtered.sort((a, b) => {
      if (sort === "price-asc") return a.price_cash - b.price_cash;
      if (sort === "price-desc") return b.price_cash - a.price_cash;
      return a.model.localeCompare(b.model);
    });
  }, [products, search, storage, sort]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <AnimatedBackground />
      <SiteHeader />
      <main className="container-page py-12 md:py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Nos iPad</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Tous les modèles en stock, avec les trois prix affichés : Cash, Flex et Tontine.
        </p>

        <div className="glass mt-8 flex flex-col gap-4 rounded-3xl p-5 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un modèle, un coloris…"
              className="pl-9"
              aria-label="Rechercher un iPad"
            />
          </div>
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

        {isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="mt-12 text-muted-foreground">Aucun iPad ne correspond à votre recherche.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
