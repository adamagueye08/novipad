import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Coins, PiggyBank, ShoppingBag, Users } from "lucide-react";
import { adminOverviewFn } from "@/lib/admin.functions";
import { formatFcfa, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverviewPage,
});

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function AdminOverviewPage() {
  const fetchOverview = useServerFn(adminOverviewFn);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchOverview(),
  });

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Chargement des statistiques…</p>;
  }

  const o = data.overview;
  const maxMonth = Math.max(1, ...o.revenueByMonth.map((r) => r.amount));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vue d'ensemble</h1>
        <p className="text-sm text-muted-foreground">
          Indicateurs consolidés en temps réel sur les trois formules.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Encaissements confirmés"
          value={formatFcfa(o.revenue)}
          hint={`${o.pendingPayments} paiement(s) en attente`}
          icon={Coins}
        />
        <Stat
          label="Commandes"
          value={String(o.ordersTotal)}
          hint={`${o.ordersPending} à traiter`}
          icon={ShoppingBag}
        />
        <Stat
          label="Épargne Flex"
          value={formatFcfa(o.flexSaved)}
          hint={`${o.flexActive} compte(s) actif(s)`}
          icon={PiggyBank}
        />
        <Stat
          label="Membres tontine"
          value={String(o.membersActive)}
          hint={`${o.membersPending} demande(s) en attente`}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur">
          <h2 className="font-semibold">Encaissements par mois</h2>
          {o.revenueByMonth.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Aucun paiement confirmé.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {o.revenueByMonth.map((row) => (
                <li key={row.month}>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.month}</span>
                    <span className="font-medium">{formatFcfa(row.amount)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(row.amount / maxMonth) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-6 font-semibold">Répartition par formule</h3>
          <ul className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
            {(["CASH", "FLEX", "TONTINE"] as const).map((key) => (
              <li key={key} className="rounded-xl border border-border/60 p-3">
                <p className="text-muted-foreground">{key}</p>
                <p className="text-lg font-semibold">{o.formulaSplit[key] ?? 0}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 text-primary" /> Stock à surveiller
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {o.stockTotal} unité(s) disponibles au total · {o.clients} client(s) inscrits
          </p>
          {o.lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Aucune alerte de stock.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {o.lowStock.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between rounded-xl border border-border/60 px-3 py-2"
                >
                  <span>{p.model}</span>
                  <span className="font-medium text-destructive">{p.stock} en stock</span>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-6 font-semibold">Journal d'audit</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {data.logs.slice(0, 8).map((log) => (
              <li key={log.id} className="rounded-xl border border-border/60 px-3 py-2">
                <p className="font-medium">{log.action}</p>
                <p className="text-xs text-muted-foreground">
                  {log.entity_type ?? "—"} · {formatDateTime(log.created_at)}
                </p>
              </li>
            ))}
            {data.logs.length === 0 ? (
              <li className="text-muted-foreground">Aucune action enregistrée.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
