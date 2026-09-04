import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Wallet, PiggyBank, Users, ArrowRight } from "lucide-react";
import { productsQuery } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FormulaCards({ className }: { className?: string }) {
  const { isLoading } = useQuery(productsQuery());

  const cards = [
    {
      key: "cash",
      icon: Wallet,
      title: "Cash",
      gradient: "bg-gradient-cash",
      pitch: "Vous payez la totalité, votre iPad est réservé puis livré.",
      bullets: [
        "Paiement unique sécurisé",
        "Réservation immédiate du stock",
        "Livraison la plus rapide",
      ],
      to: "/catalogue" as const,
      cta: "Commander en Cash",
    },
    {
      key: "tontine",
      icon: Users,
      title: "Tontine",
      gradient: "bg-gradient-tontine",
      pitch: "Un groupe encadré, des cotisations régulières, une attribution transparente.",
      bullets: [
        "Adhésion validée par l'équipe",
        "Cotisations et rappels suivis",
        "Règles d'attribution affichées",
      ],
      to: "/tontines" as const,
      cta: "Voir les tontines",
    },
    {
      key: "flex",
      icon: PiggyBank,
      title: "Flex",
      gradient: "bg-gradient-flex",
      pitch: "Votre objectif d'épargne personnel : vous déposez à votre rythme.",
      bullets: [
        "Dépôts libres, à votre rythme",
        "Progression en temps réel",
        "Livraison à 100 % payé",
      ],
      to: "/catalogue" as const,
      cta: "Ouvrir un compte Flex",
    },
  ];

  return (
    <div className={cn("grid gap-6 md:grid-cols-3", className)}>
      {cards.map((c) => (
        <article key={c.key} className="glass hover-tilt flex flex-col rounded-3xl p-7">
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

          <ul className="mt-6 flex-1 space-y-2 text-sm text-muted-foreground">
            {c.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {b}
              </li>
            ))}
          </ul>

          <Button asChild variant="outline" className="mt-7 w-full" disabled={isLoading}>
            <Link to={c.to}>
              {c.cta} <ArrowRight />
            </Link>
          </Button>
        </article>
      ))}
    </div>
  );
}
