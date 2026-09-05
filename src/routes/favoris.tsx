import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { productsQuery } from "@/lib/api";
import { useFavorites } from "@/hooks/use-favorites";

const TITLE = "Mes favoris — JokkoTech";

export const Route = createFileRoute("/favoris")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: TITLE },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { ids } = useFavorites();
  const { data: products = [], isLoading } = useQuery(productsQuery());
  const favorites = products.filter((p) => ids.includes(p.id));

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader />
      <main className="container-page py-10 md:py-14">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight md:text-3xl">
          <Heart className="size-6 text-destructive" /> Mes favoris
        </h1>

        {isLoading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="mt-10 rounded-4xl border border-dashed border-border/60 p-12 text-center">
            <Heart className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Aucun favori pour l'instant. Touchez le cœur sur un produit pour l'ajouter ici.
            </p>
            <Button asChild className="mt-5" variant="hero">
              <Link to="/catalogue">Voir le catalogue</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
