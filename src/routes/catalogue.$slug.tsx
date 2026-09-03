import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Tablet, ShieldCheck, Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site/SiteHeader";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { productQuery } from "@/lib/api";
import { formatFcfa } from "@/lib/format";
import { useFavorites } from "@/hooks/use-favorites";
import { useCart } from "@/hooks/use-cart";

export const Route = createFileRoute("/catalogue/$slug")({
  head: () => ({
    meta: [
      { title: "Fiche iPad — JokkoTech" },
      {
        name: "description",
        content:
          "Caractéristiques détaillées, garantie et prix Cash, Flex et Tontine de cet iPad importé des États-Unis.",
      },
      { property: "og:title", content: "Fiche iPad — JokkoTech" },
      {
        property: "og:description",
        content: "Caractéristiques, garantie et trois formules de paiement pour cet iPad.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const { has, toggle } = useFavorites();
  const { addItem } = useCart();

  const features = Array.isArray(product?.features) ? (product?.features as string[]) : [];
  const specs = Array.isArray(product?.specs)
    ? (product?.specs as { label: string; value: string }[])
    : [];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader />
      <main className="container-page py-10 md:py-14">
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au catalogue
        </Link>

        {isLoading ? (
          <div className="mt-8 h-96 animate-pulse rounded-4xl bg-muted" />
        ) : !product ? (
          <p className="mt-12 text-muted-foreground">Cet iPad n'est plus disponible.</p>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div className="glass flex h-80 items-center justify-center rounded-4xl md:h-[28rem]">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={`${product.model} ${product.generation ?? ""}`}
                  className="max-h-72 object-contain md:max-h-96"
                />
              ) : (
                <Tablet className="h-24 w-24 text-primary/40" />
              )}
            </div>

            <div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {product.category || "Produit"}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(product.id)}
                  aria-label={has(product.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  className="flex size-9 items-center justify-center rounded-full border border-border/70 transition-smooth hover:bg-accent"
                >
                  <Heart
                    className={
                      has(product.id) ? "size-4 fill-destructive text-destructive" : "size-4"
                    }
                  />
                </button>
              </div>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
                {product.model} {product.generation}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {[product.storage, product.color, product.connectivity, product.condition]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              {product.description && (
                <p className="mt-5 text-sm leading-relaxed">{product.description}</p>
              )}

              {specs.length > 0 && (
                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 rounded-2xl bg-muted/40 p-4 text-sm sm:grid-cols-3">
                  {specs.map((s, i) => (
                    <div key={i}>
                      <dt className="text-xs text-muted-foreground">{s.label}</dt>
                      <dd className="font-medium">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Cash", value: product.price_cash },
                  { label: "Flex", value: product.price_flex },
                  { label: "Tontine", value: product.price_tontine },
                ].map((p) => (
                  <div key={p.label} className="glass rounded-2xl p-4">
                    <p className="text-xs font-medium text-muted-foreground">{p.label}</p>
                    <p className="mt-1 font-display text-lg font-bold">{formatFcfa(p.value)}</p>
                  </div>
                ))}
              </div>

              <ul className="mt-7 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-primary" /> Garantie {product.warranty_months}{" "}
                  mois
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {product.stock_quantity > 0
                    ? `${product.stock_quantity} unité(s) en stock`
                    : "Rupture de stock — réapprovisionnement en cours"}
                </li>
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="hero">
                  <Link to="/commander/$slug" params={{ slug: product.slug }}>
                    Choisir cet iPad
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  disabled={product.stock_quantity <= 0}
                  onClick={() => {
                    addItem({
                      productId: product.id,
                      slug: product.slug,
                      model: product.model,
                      generation: product.generation,
                      storage: product.storage,
                      image: product.images?.[0] ?? null,
                      priceCash: product.price_cash,
                    });
                    toast.success("Ajouté au panier.");
                  }}
                >
                  <ShoppingCart /> Ajouter au panier
                </Button>

                <Button asChild variant="ghost">
                  <Link to="/formules">Comparer les formules</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <MobileBottomNav />
      <SiteFooter />
    </div>
  );
}
