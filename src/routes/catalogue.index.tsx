import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { productsQuery } from "@/lib/api";

const TITLE = "Catalogue iPad — modèles disponibles | iPad Rythme";
const DESCRIPTION =
  "Parcourez tous les iPad Apple importés des États-Unis : capacités, coloris, connectivité, garantie et prix Cash, Tontine ou Flex.";

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

const SORTS = [
  { key: "price-asc", label: "Prix croissant" },
  { key: "price-desc", label: "Prix décroissant" },
  { key: "stock", label: "Stock disponible" },
] as const;

function CataloguePage() {
  const { data: products = [], isLoading } = useQuery(productsQuery());
  const [term, setTerm] = useState("");
  const [model, setModel] = useState<string>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("price-asc");

  const models = useMemo(
    () => Array.from(new Set(products.map((p) => p.model))).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    let list = products.filter((p) => {
      const haystack = [p.model, p.generation, p.storage, p.color, p.connectivity]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (model === "all" || p.model === model) && (!q || haystack.includes(q));
    });
    list = [...list].sort((a, b) => {
      if (sort === "price-desc") return b.price_cash - a.price_cash;
      if (sort === "stock") return b.stock_quantity - a.stock_quantity;
      return a.price_cash - b.price_cash;
    });
    return list;
  }, [products, term, model, sort]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container-page py-14 md:py-20">
          <p className="text-sm font-semibold text-primary">Catalogue</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Nos iPad disponibles
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Tous nos appareils sont importés des États-Unis, contrôlés à l'arrivée et garantis.
            Chaque fiche affiche le prix des trois formules.
          </p>

          <div className="glass mt-8 flex flex-col gap-4 rounded-3xl p-5 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Rechercher un modèle, une capacité…"
                aria-label="Rechercher un iPad"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={model === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setModel("all")}
              >
                Tous
              </Button>
              {models.map((m) => (
                <Button
                  key={m}
                  variant={model === m ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModel(m)}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Trier :
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                className={
                  sort === s.key
                    ? "rounded-full bg-accent px-3 py-1 font-medium text-accent-foreground"
                    : "rounded-full px-3 py-1 transition-smooth hover:bg-accent/60"
                }
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-3xl" />
                ))
              : filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>

          {!isLoading && filtered.length === 0 && (
            <p className="glass mt-10 rounded-3xl p-8 text-center text-muted-foreground">
              Aucun appareil ne correspond à votre recherche.
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
