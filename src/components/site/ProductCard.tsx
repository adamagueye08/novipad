import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Tablet } from "lucide-react";
import type { Product } from "@/lib/api";
import { formatFcfa } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  const outOfStock = product.stock_quantity <= 0;

  return (
    <Link
      to="/catalogue/$slug"
      params={{ slug: product.slug }}
      className="glass hover-lift group flex flex-col overflow-hidden rounded-3xl"
    >
      <div className="relative flex h-44 items-center justify-center bg-gradient-to-b from-accent/60 to-transparent">
        {image ? (
          <img
            src={image}
            alt={`${product.model} ${product.generation ?? ""}`}
            loading="lazy"
            className="h-36 object-contain"
          />
        ) : (
          <Tablet className="h-16 w-16 text-primary/40" />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-card/85 px-3 py-1 text-[11px] font-semibold">
          {outOfStock ? "Rupture" : `${product.stock_quantity} en stock`}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold">
          {product.model} {product.generation}
        </h3>
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

        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          Voir la fiche
          <ArrowUpRight className="h-4 w-4 transition-smooth group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
