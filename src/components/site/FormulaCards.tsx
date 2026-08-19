import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Wallet, PiggyBank, Users, ArrowRight } from "lucide-react";
import { productsQuery, formulaPrices } from "@/lib/api";
import { formatFcfa } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FormulaCards({ className }: { className?: string }) {
  const { data: products = [], isLoading } = useQuery(productsQuery());
  const prices = formulaPrices(products);

  const cards = [
    {
      key: "cash",
      icon: Wallet,
      title: "Cash",
      gradient: "bg-gradient-cash",
      price: prices?.cash,
      pitch: "Vous payez la totalité, votre iPad est réservé puis livré.",
      bullets: ["Paiement unique sécurisé", "Réservation immédiate du stock", "Livraison la plus rapide"],
      to: "/catalogue" as const,
      cta: "Commander en Cash",
    },
    {
      key: "tontine",
      icon: Users,
      title: "Tontine",
      gradient: "bg-gradient-tontine",
      price: prices?.tontine,
      pitch: "Un groupe encadré, des cotisations régulières, une attribution transparente.",
      bullets: ["Adhésion validée par l'équipe", "Cotisations et rappels suivis", "Règles d'attribution affichées"],
      to: "/tontines" as const,
      cta: "Voir les tontines",
    },
    {
      key: "flex",
      icon: PiggyBank,
      title: "Flex",
      gradient: "bg-gradient-flex",
      price: prices?.flex,
      pitch: "Votre objectif d'épargne personnel : vous déposez à votre rythme.",
      bullets: ["Dépôts dès 5 000 FCFA", "Progression en temps réel", "Livraison à 100 % payé"],
      to: "/formules" as const,
      cta: "Comprendre le Flex",
    },
  ];

  return (
    <div className={cn("grid gap-6 md:grid-cols-3", className)}>
      {cards.map((c) => (
        <article key={c.key} className="glass hover-lift flex flex-col rounded-3xl p-7">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl text-primary-foreground",
              c.gradient,
            )}
          >
            <c.icon className="h-5 w-5" />
          </span>
          <h3 className="mt-5 font-display text-xl font-semibold">{c.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{c.pitch}</p>

          <p className="mt-6 font-display text-2xl font-bold">
            {isLoading ? (
              <span className="inline-block h-7 w-36 animate-pulse rounded-md bg-muted" />
            ) : c.price ? (
              <>
                {formatFcfa(c.price)}
                <span className="ml-1 text-xs font-medium text-muted-foreground">à partir de</span>
              </>
            ) : (
              <span className="text-base text-muted-foreground">Prix bientôt disponible</span>
            )}
          </p>

          <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
            {c.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {b}
              </li>
            ))}
          </ul>

          <Button asChild variant="outline" className="mt-7 w-full">
            <Link to={c.to}>
              {c.cta} <ArrowRight />
            </Link>
          </Button>
        </article>
      ))}
    </div>
  );
}
