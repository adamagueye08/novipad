import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Tablet, Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/api";
import { formatFcfa } from "@/lib/format";
import { useFavorites } from "@/hooks/use-favorites";
import { useCart } from "@/hooks/use-cart";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  const outOfStock = product.stock_quantity <= 0;
  const { has, toggle } = useFavorites();
  const { addItem } = useCart();
  const favorited = has(product.id);

  return (
    <div className="glass hover-tilt group relative flex flex-col overflow-hidden rounded-3xl">
      <button
        type="button"
        aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
        onClick={(e) => {
          e.preventDefault();
          toggle(product.id);
        }}
        className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-card/85 text-foreground transition-smooth hover:scale-110"
      >
        <Heart className={favorited ? "size-4 fill-destructive text-destructive" : "size-4"} />
      </button>

      <Link
        to="/catalogue/$slug"
        params={{ slug: product.slug }}
        className="flex h-44 items-center justify-center bg-gradient-to-b from-accent/60 to-transparent"
      >
        {image ? (
          <img
            src={image}
            alt={`${product.model} ${product.generation ?? ""}`}
            loading="lazy"
            className="h-36 object-contain transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <Tablet className="h-16 w-16 text-primary/40" />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-card/85 px-3 py-1 text-[11px] font-semibold">
          {outOfStock ? "Rupture" : `${product.stock_quantity} en stock`}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {product.category && (
          <span className="mb-1.5 w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
            {product.category}
          </span>
        )}
        <Link to="/catalogue/$slug" params={{ slug: product.slug }}>
          <h3 className="text-base font-semibold">
            {product.model} {product.generation}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          {[product.storage, product.color, product.connectivity].filter(Boolean).join(" · ")}
        </p>

        <dl className="mt-5 space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Cash</dt>
            <dd className="font-semibold">{formatFcfa(product.price_cash)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Tontine</dt>
            <dd className="font-medium">{formatFcfa(product.price_tontine)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Flex</dt>
            <dd className="font-medium">{formatFcfa(product.price_flex)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex items-center justify-between gap-2">
          <Link
            to="/catalogue/$slug"
            params={{ slug: product.slug }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            Voir la fiche
            <ArrowUpRight className="h-4 w-4 transition-smooth group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => {
              addItem({
                productId: product.id,
                slug: product.slug,
                model: product.model,
                generation: product.generation,
                storage: product.storage,
                image: image ?? null,
                priceCash: product.price_cash,
              });
              toast.success("Ajouté au panier.");
            }}
            className="flex size-9 items-center justify-center rounded-full border border-border/70 text-foreground transition-smooth hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Ajouter au panier"
          >
            <ShoppingCart className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
