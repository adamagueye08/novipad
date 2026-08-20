import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, ShieldCheck, Tablet, Truck, Wallet, Users, PiggyBank } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { productQuery } from "@/lib/api";
import { formatFcfa } from "@/lib/format";

export const Route = createFileRoute("/catalogue/$slug")({
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, " ");
    const title = `${name} — fiche produit | iPad Rythme`;
    const description = `Caractéristiques, garantie et prix Cash, Tontine et Flex pour ${name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="font-display text-2xl font-bold">Appareil introuvable</h1>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/catalogue">Retour au catalogue</Link>
      </Button>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(slug));

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="container-page py-16">
          <Skeleton className="h-96 rounded-3xl" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    throw notFound();
  }

  const image = product.images?.[0];
  const specs = [
    ["Modèle", `${product.model} ${product.generation ?? ""}`.trim()],
    ["Stockage", product.storage],
    ["Coloris", product.color],
    ["Connectivité", product.connectivity],
    ["État", product.condition],
    ["Garantie", `${product.warranty_months} mois`],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  const formulas = [
    {
      icon: Wallet,
      title: "Cash",
      price: product.price_cash,
      note: "Paiement intégral, réservation immédiate.",
      to: "/auth" as const,
      cta: "Commander en Cash",
    },
    {
      icon: Users,
      title: "Tontine",
      price: product.price_tontine,
      note: "Cotisations en groupe encadrées.",
      to: "/tontines" as const,
      cta: "Rejoindre une tontine",
    },
    {
      icon: PiggyBank,
      title: "Flex",
      price: product.price_flex,
      note: "Épargne libre jusqu'à 100 %.",
      to: "/formules" as const,
      cta: "Ouvrir un compte Flex",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container-page pt-8">
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-smooth hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Catalogue
          </Link>
        </div>

        <section className="container-page grid gap-10 py-10 lg:grid-cols-2 lg:py-14">
          <div className="glass flex h-80 items-center justify-center rounded-3xl lg:h-[26rem]">
            {image ? (
              <img
                src={image}
                alt={`${product.model} ${product.generation ?? ""}`}
                className="h-64 object-contain lg:h-80"
              />
            ) : (
              <Tablet className="h-24 w-24 text-primary/40" />
            )}
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              {product.model} {product.generation}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {product.description ??
                "Appareil Apple importé des États-Unis, contrôlé par notre équipe avant livraison."}
            </p>

            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
              <BadgeCheck className="h-4 w-4" />
              {product.stock_quantity > 0
                ? `${product.stock_quantity} unité(s) en stock`
                : "Réapprovisionnement en cours"}
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
              {specs.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border/60 p-4">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" /> Garantie {product.warranty_months} mois
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-primary" /> Livraison Dakar & régions
              </span>
            </div>
          </div>
        </section>

        <section className="container-page pb-16">
          <h2 className="font-display text-2xl font-semibold">Choisissez votre formule</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {formulas.map((f) => (
              <article key={f.title} className="glass hover-lift flex flex-col rounded-3xl p-6">
                <f.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.note}</p>
                <p className="mt-5 font-display text-xl font-bold">{formatFcfa(f.price)}</p>
                <Button asChild variant="outline" className="mt-6">
                  <Link to={f.to}>{f.cta}</Link>
                </Button>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
