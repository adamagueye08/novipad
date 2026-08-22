import type { ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LogOut,
  Package,
  PiggyBank,
  Users,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { formatFcfa, formatDate, progressPercent } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Mon espace client — iPad Rythme" },
      {
        name: "description",
        content:
          "Suivez vos commandes iPad, vos dépôts Flex et vos tontines depuis votre espace client iPad Rythme.",
      },
      { property: "og:title", content: "Mon espace client — iPad Rythme" },
      {
        property: "og:description",
        content: "Commandes, épargne Flex et tontines réunies dans un seul tableau de bord.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  AWAITING_PAYMENT: "Paiement attendu",
  PAID: "Payée",
  PREPARING: "En préparation",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const profile = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name,last_name,phone,email,status")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const orders = useQuery({
    queryKey: ["my-orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,reference,formula,amount,status,created_at,products(model,storage)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const flex = useQuery({
    queryKey: ["my-flex", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flex_accounts")
        .select("id,target_amount,paid_amount,status,created_at,products(model,storage)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const tontines = useQuery({
    queryKey: ["my-tontines", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tontine_members")
        .select("id,status,paid_amount,late_count,created_at,tontines(name,contribution_amount)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const fullName =
    [profile.data?.first_name, profile.data?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Client";

  const totalFlex = (flex.data ?? []).reduce((sum, f) => sum + Number(f.paid_amount ?? 0), 0);
  const totalTontine = (tontines.data ?? []).reduce(
    (sum, t) => sum + Number(t.paid_amount ?? 0),
    0,
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Espace client</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Bonjour {fullName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{profile.data?.phone ?? user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut /> Déconnexion
          </Button>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Package className="h-4 w-4" />} label="Commandes" value={String(orders.data?.length ?? 0)} />
          <StatCard icon={<Wallet className="h-4 w-4" />} label="Épargne Flex" value={formatFcfa(totalFlex)} />
          <StatCard icon={<Users className="h-4 w-4" />} label="Tontines" value={String(tontines.data?.length ?? 0)} />
          <StatCard icon={<PiggyBank className="h-4 w-4" />} label="Cotisations versées" value={formatFcfa(totalTontine)} />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Panel title="Mes commandes">
            {(orders.data?.length ?? 0) === 0 ? (
              <Empty
                text="Aucune commande pour le moment."
                cta={<Link to="/catalogue">Voir le catalogue</Link>}
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {orders.data!.map((o: any) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {o.products?.model ?? "iPad"} {o.products?.storage ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.reference} · {formatDate(o.created_at)} · {o.formula}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatFcfa(o.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Mes comptes Flex">
            {(flex.data?.length ?? 0) === 0 ? (
              <Empty
                text="Vous n'avez pas encore de compte Flex."
                cta={<Link to="/formules">Découvrir Flex</Link>}
              />
            ) : (
              <ul className="space-y-4">
                {flex.data!.map((f: any) => {
                  const pct = progressPercent(Number(f.paid_amount), Number(f.target_amount));
                  return (
                    <li key={f.id} className="rounded-2xl border border-border/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          {f.products?.model ?? "iPad"} {f.products?.storage ?? ""}
                        </p>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                      <Progress value={pct} className="mt-3" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatFcfa(f.paid_amount)} sur {formatFcfa(f.target_amount)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Mes tontines">
            {(tontines.data?.length ?? 0) === 0 ? (
              <Empty
                text="Aucune adhésion à une tontine."
                cta={<Link to="/tontines">Rejoindre une tontine</Link>}
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {tontines.data!.map((t: any) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">{t.tontines?.name ?? "Tontine"}</p>
                      <p className="text-xs text-muted-foreground">
                        Cotisation {formatFcfa(t.tontines?.contribution_amount)} · {t.status}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatFcfa(t.paid_amount)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Prochaines étapes">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 text-primary" />
                Choisissez un iPad dans le catalogue et sélectionnez votre formule.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 text-primary" />
                Réglez en Cash, épargnez en Flex ou cotisez via une tontine.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 text-primary" />
                Suivez ici l'avancement de vos paiements et de vos livraisons.
              </li>
            </ul>
            <div className="mt-5">
              <Button asChild variant="hero" size="sm">
                <Link to="/catalogue">Explorer le catalogue</Link>
              </Button>
            </div>
          </Panel>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur-xl">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Empty({ text, cta }: { text: string; cta: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <div className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline">
        {cta}
      </div>
    </div>
  );
}
