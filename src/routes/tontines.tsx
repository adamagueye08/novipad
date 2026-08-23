import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Users, CalendarClock, Tablet } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { tontinesQuery } from "@/lib/api";
import { formatFcfa, formatDate, FREQUENCY_LABELS } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { joinTontineFn } from "@/lib/checkout.functions";

const TITLE = "Tontines iPad ouvertes — iPad Rythme";
const DESCRIPTION =
  "Rejoignez une tontine encadrée : cotisations régulières, règles d'attribution transparentes et suivi complet de votre iPad.";

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
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-page py-12 md:py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Tontines ouvertes</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Chaque tontine réunit un nombre limité de membres autour d'un modèle d'iPad. Cotisations, durée et règles
          d'attribution sont affichées avant toute adhésion.
        </p>

        {isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : tontines.length === 0 ? (
          <p className="mt-12 text-muted-foreground">
            Aucune tontine n'est ouverte pour le moment. Créez un compte pour être prévenu de la prochaine ouverture.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {tontines.map((t) => (
              <article key={t.id} className="glass hover-lift flex flex-col rounded-3xl p-7">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display text-xl font-semibold">{t.name}</h2>
                  <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
                    {t.status === "OPEN" ? "Adhésions ouvertes" : "En cours"}
                  </span>
                </div>

                <dl className="mt-5 grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Cotisation</dt>
                    <dd className="font-semibold">
                      {formatFcfa(t.contribution_amount)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        / {FREQUENCY_LABELS[t.frequency] ?? t.frequency}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Prix tontine</dt>
                    <dd className="font-semibold">{formatFcfa(t.price)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Durée</dt>
                    <dd className="font-medium">{t.duration_months} mois</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Démarrage</dt>
                    <dd className="font-medium">{formatDate(t.start_date)}</dd>
                  </div>
                </dl>

                <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> {t.member_capacity} places au total
                  </li>
                  <li className="flex items-center gap-2">
                    <Tablet className="h-4 w-4 text-primary" /> {t.ipads_available} iPad à attribuer
                  </li>
                  <li className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" /> Conditions version {t.terms_version}
                  </li>
                </ul>

                {t.allocation_rules && (
                  <p className="mt-5 rounded-2xl bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Attribution : </span>
                    {t.allocation_rules}
                  </p>
                )}

                <JoinButton tontineId={t.id} />

              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function JoinButton({ tontineId }: { tontineId: string }) {
  const { user, loading } = useAuth();
  const join = useServerFn(joinTontineFn);
  const [busy, setBusy] = useState(false);

  if (loading || !user) {
    return (
      <Button asChild variant="hero" className="mt-7 w-full">
        <Link to="/auth" search={{ mode: "signup" }}>
          Demander à rejoindre
        </Link>
      </Button>
    );
  }

  async function onJoin() {
    setBusy(true);
    try {
      const res = await join({ data: { tontineId } });
      toast.success(
        res.created
          ? "Demande d'adhésion envoyée. Elle sera validée par notre équipe."
          : "Vous avez déjà une demande pour cette tontine.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="hero" className="mt-7 w-full" onClick={onJoin} disabled={busy}>
      {busy ? "Envoi…" : "Demander à rejoindre"}
    </Button>
  );
}
