import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Users, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { tontinesQuery } from "@/lib/api";
import { formatFcfa, formatDate, FREQUENCY_LABELS } from "@/lib/format";

const TITLE = "Tontines iPad ouvertes — cotisez en groupe | iPad Rythme";
const DESCRIPTION =
  "Rejoignez une tontine encadrée : cotisations régulières, règles d'attribution transparentes et suivi de chaque versement.";

export const Route = createFileRoute("/tontines")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: TontinesPage,
});

function TontinesPage() {
  const { data: tontines = [], isLoading } = useQuery(tontinesQuery());

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container-page py-14 md:py-20">
          <p className="text-sm font-semibold text-primary">Tontines</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Cotisez en groupe, recevez votre iPad
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Chaque tontine annonce sa capacité, son montant de cotisation, sa fréquence et ses règles
            d'attribution avant votre adhésion.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {isLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-3xl" />
                ))
              : tontines.map((t) => (
                  <article key={t.id} className="glass hover-lift flex flex-col rounded-3xl p-7">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-display text-xl font-semibold">{t.name}</h2>
                      <Badge variant={t.status === "OPEN" ? "default" : "secondary"}>
                        {t.status === "OPEN" ? "Adhésions ouvertes" : "En cours"}
                      </Badge>
                    </div>

                    <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Cotisation</dt>
                        <dd className="font-semibold">{formatFcfa(t.contribution_amount)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Fréquence</dt>
                        <dd className="font-medium">
                          {FREQUENCY_LABELS[t.frequency] ?? t.frequency}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Durée</dt>
                        <dd className="font-medium">{t.duration_months} mois</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Prix visé</dt>
                        <dd className="font-medium">{formatFcfa(t.price)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Places</dt>
                        <dd className="font-medium">{t.member_capacity} membres</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Démarrage</dt>
                        <dd className="font-medium">{formatDate(t.start_date)}</dd>
                      </div>
                    </dl>

                    {t.allocation_rules && (
                      <p className="mt-5 rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Attribution : </span>
                        {t.allocation_rules}
                      </p>
                    )}

                    <p className="mt-4 text-xs text-muted-foreground">
                      {t.ipads_available} iPad réservé(s) à ce groupe · règlement v{t.terms_version}
                    </p>

                    <Button asChild variant="hero" className="mt-6">
                      <Link to="/auth" search={{ mode: "signup" }}>
                        Demander l'adhésion
                      </Link>
                    </Button>
                  </article>
                ))}
          </div>

          {!isLoading && tontines.length === 0 && (
            <p className="glass mt-10 rounded-3xl p-8 text-center text-muted-foreground">
              Aucune tontine ouverte pour le moment. Créez un compte pour être prévenu de la
              prochaine session.
            </p>
          )}
        </section>

        <section className="container-page pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Groupe encadré",
                text: "Chaque adhésion est validée par notre équipe tontine avant le premier versement.",
              },
              {
                icon: CalendarClock,
                title: "Cotisations suivies",
                text: "Chaque versement est enregistré avec sa référence et visible dans votre espace.",
              },
              {
                icon: ShieldCheck,
                title: "Règles publiées",
                text: "Ordre d'attribution, retards et sanctions sont écrits dans le règlement accepté.",
              },
            ].map((c) => (
              <article key={c.title} className="glass rounded-3xl p-7">
                <c.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
