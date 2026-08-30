import type { ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut, Package, PiggyBank, Users, Wallet, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SiteHeader } from "@/components/site/SiteHeader";
import { AnimatedBackground } from "@/components/site/AnimatedBackground";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Input } from "@/components/ui/input";
import { formatFcfa, formatDate, progressPercent } from "@/lib/format";
import {
  depositToFlexFn,
  payContributionFn,
  requestFlexCancellationFn,
  flexSettingsFn,
} from "@/lib/checkout.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Mon espace client — JokkoTech" },
      {
        name: "description",
        content:
          "Suivez vos commandes iPad, vos dépôts Flex et vos tontines depuis votre espace client JokkoTech.",
      },
      { property: "og:title", content: "Mon espace client — JokkoTech" },
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

const FLEX_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "En cours",
  COMPLETED: "Complété",
  CANCELLED: "Annulé",
};

const CANCELLATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Demande en cours d'examen",
  APPROVED: "Annulation approuvée",
  REJECTED: "Demande refusée",
  REFUNDED: "Remboursé",
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
        .select(
          "id,target_amount,paid_amount,status,created_at,delivery_address,delivery_phone,products(model,storage)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const flexAccountIds = (flex.data ?? []).map((f: any) => f.id);

  const flexDeposits = useQuery({
    queryKey: ["my-flex-deposits", flexAccountIds.join(",")],
    enabled: flexAccountIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flex_deposits")
        .select("id,flex_account_id,amount,created_at")
        .in("flex_account_id", flexAccountIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const flexCancellations = useQuery({
    queryKey: ["my-flex-cancellations", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flex_cancellations")
        .select("id,flex_account_id,status,reason,refundable_amount,fee_amount,created_at")
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <AnimatedBackground />
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Espace client</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Bonjour {fullName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.data?.phone ?? user?.email}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut /> Déconnexion
          </Button>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Package className="h-4 w-4" />}
            label="Commandes"
            value={String(orders.data?.length ?? 0)}
          />
          <StatCard
            icon={<Wallet className="h-4 w-4" />}
            label="Épargne Flex"
            value={formatFcfa(totalFlex)}
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Tontines"
            value={String(tontines.data?.length ?? 0)}
          />
          <StatCard
            icon={<PiggyBank className="h-4 w-4" />}
            label="Cotisations versées"
            value={formatFcfa(totalTontine)}
          />
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
                  const deposits = (flexDeposits.data ?? []).filter(
                    (d: any) => d.flex_account_id === f.id,
                  );
                  const pendingCancellation = (flexCancellations.data ?? []).find(
                    (c: any) => c.flex_account_id === f.id && c.status === "PENDING",
                  );
                  const latestCancellation = (flexCancellations.data ?? []).find(
                    (c: any) => c.flex_account_id === f.id,
                  );
                  return (
                    <li key={f.id} className="rounded-2xl border border-border/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          {f.products?.model ?? "iPad"} {f.products?.storage ?? ""}
                        </p>
                        <Badge
                          variant={
                            f.status === "COMPLETED"
                              ? "default"
                              : f.status === "CANCELLED"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {FLEX_STATUS_LABELS[f.status] ?? f.status}
                        </Badge>
                      </div>
                      <Progress value={pct} className="mt-3" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatFcfa(f.paid_amount)} sur {formatFcfa(f.target_amount)} ({pct}%)
                      </p>

                      {f.status === "COMPLETED" && (
                        <p className="mt-3 text-xs font-medium text-primary">
                          🎉 Épargne complétée — votre commande a été créée automatiquement.
                          Retrouvez-la dans « Mes commandes ».
                        </p>
                      )}

                      {f.status === "ACTIVE" && pendingCancellation && (
                        <p className="mt-3 rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
                          Demande d'annulation envoyée le{" "}
                          {formatDate(pendingCancellation.created_at)}, en cours d'examen.
                        </p>
                      )}

                      {f.status === "ACTIVE" && !pendingCancellation && (
                        <>
                          <DepositForm
                            flexAccountId={f.id}
                            remaining={Number(f.target_amount) - Number(f.paid_amount)}
                            onDone={() => {
                              flex.refetch();
                              flexDeposits.refetch();
                            }}
                          />
                          <div className="mt-3 flex items-center justify-end">
                            <CancelFlexDialog
                              flexAccountId={f.id}
                              paidAmount={Number(f.paid_amount)}
                              onDone={() => flexCancellations.refetch()}
                            />
                          </div>
                        </>
                      )}

                      {f.status === "CANCELLED" && latestCancellation && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          {CANCELLATION_STATUS_LABELS[latestCancellation.status] ??
                            latestCancellation.status}
                          {" · "}
                          Montant remboursable : {formatFcfa(latestCancellation.refundable_amount)}
                        </p>
                      )}

                      {deposits.length > 0 && (
                        <details className="mt-3 text-xs text-muted-foreground">
                          <summary className="cursor-pointer select-none font-medium text-foreground">
                            Historique des versements ({deposits.length})
                          </summary>
                          <ul className="mt-2 space-y-1.5">
                            {deposits.map((d: any) => (
                              <li key={d.id} className="flex items-center justify-between">
                                <span>{formatDate(d.created_at)}</span>
                                <span className="font-medium text-foreground">
                                  {formatFcfa(d.amount)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
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
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold">{formatFcfa(t.paid_amount)}</p>
                      {["APPROVED", "ACTIVE"].includes(t.status) && (
                        <ContributionButton memberId={t.id} onDone={() => tontines.refetch()} />
                      )}
                    </div>
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

function DepositForm({
  flexAccountId,
  remaining,
  onDone,
}: {
  flexAccountId: string;
  remaining: number;
  onDone: () => void;
}) {
  const deposit = useServerFn(depositToFlexFn);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    setBusy(true);
    try {
      const res = await deposit({ data: { flexAccountId, amount: value, method: "WAVE" } });
      window.location.href = res.redirectUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex items-center gap-2">
      <Input
        type="number"
        min={1}
        max={remaining}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={`Verser (reste ${formatFcfa(remaining)})`}
        className="h-9"
      />
      <Button type="submit" size="sm" variant="hero" disabled={busy}>
        {busy ? "…" : "Verser"}
      </Button>
    </form>
  );
}

function CancelFlexDialog({
  flexAccountId,
  paidAmount,
  onDone,
}: {
  flexAccountId: string;
  paidAmount: number;
  onDone: () => void;
}) {
  const requestCancellation = useServerFn(requestFlexCancellationFn);
  const fetchFlexSettings = useServerFn(flexSettingsFn);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [keepAsCredit, setKeepAsCredit] = useState(false);
  const [busy, setBusy] = useState(false);

  const settings = useQuery({
    queryKey: ["flex-settings"],
    enabled: open,
    queryFn: () => fetchFlexSettings(),
  });

  const feePercent = settings.data?.cancellationFeePercent ?? 10;
  const feeAmount = keepAsCredit ? 0 : Math.round((paidAmount * feePercent) / 100);
  const refundableAmount = paidAmount - feeAmount;

  async function onConfirm() {
    setBusy(true);
    try {
      await requestCancellation({
        data: { flexAccountId, reason: reason.trim() || undefined, keepAsCredit },
      });
      toast.success("Demande d'annulation envoyée. Nous revenons vers vous rapidement.");
      setOpen(false);
      setReason("");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
          Demander l'annulation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annuler ce compte Flex ?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Votre demande sera examinée par notre équipe avant confirmation finale.
        </p>

        <div className="space-y-2">
          <p className="text-sm font-medium">Que souhaitez-vous faire du montant versé ?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setKeepAsCredit(false)}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                !keepAsCredit
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <p className="font-medium">Être remboursé</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Frais d'annulation de {feePercent}% appliqués
              </p>
            </button>
            <button
              type="button"
              onClick={() => setKeepAsCredit(true)}
              className={`rounded-xl border p-3 text-left text-sm transition ${
                keepAsCredit
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <p className="font-medium">Garder en crédit</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Aucun frais, utilisable plus tard
              </p>
            </button>
          </div>
        </div>

        <dl className="space-y-1.5 rounded-xl bg-muted/50 p-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Montant versé</dt>
            <dd className="font-medium">{formatFcfa(paidAmount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Frais d'annulation</dt>
            <dd className="font-medium">
              {feeAmount > 0 ? `- ${formatFcfa(feeAmount)}` : "Aucun"}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border/60 pt-1.5">
            <dt className="font-medium">
              {keepAsCredit ? "Crédit conservé" : "Montant remboursable"}
            </dt>
            <dd className="font-semibold">{formatFcfa(refundableAmount)}</dd>
          </div>
        </dl>

        <div className="space-y-2">
          <label htmlFor="cancel-reason" className="text-sm font-medium">
            Raison (optionnel)
          </label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Dites-nous pourquoi vous souhaitez annuler…"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Retour
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? "Envoi…" : "Confirmer la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContributionButton({ memberId, onDone }: { memberId: string; onDone: () => void }) {
  const pay = useServerFn(payContributionFn);
  const [busy, setBusy] = useState(false);

  async function onPay() {
    setBusy(true);
    try {
      const res = await pay({ data: { memberId, method: "WAVE" } });
      window.location.href = res.redirectUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={onPay} disabled={busy}>
      {busy ? "…" : "Cotiser"}
    </Button>
  );
}
