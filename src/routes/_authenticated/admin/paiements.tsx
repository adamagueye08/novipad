import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreditCard, Check, X } from "lucide-react";
import { adminPaymentsFn, adminDecidePaymentFn } from "@/lib/admin.functions";
import { formatFcfa, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/paiements")({
  head: () => ({
    meta: [{ title: "Paiements — iPad Rythme" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPaymentsPage,
});

type Profile = { first_name: string | null; last_name: string | null };

type PaymentRow = {
  id: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";
  payment_method: string | null;
  external_reference: string | null;
  created_at: string;
  confirmed_at: string | null;
  order_id: string | null;
  flex_account_id: string | null;
  tontine_id: string | null;
  profiles: Profile | null;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  SUCCESS: "Réussi",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
};

function clientName(p: Profile | null) {
  const full = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
  return full || "Client";
}

function origin(p: PaymentRow) {
  if (p.order_id) return "Commande";
  if (p.flex_account_id) return "Flex";
  if (p.tontine_id) return "Tontine";
  return "—";
}

function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const fetchPayments = useServerFn(adminPaymentsFn);
  const decidePayment = useServerFn(adminDecidePaymentFn);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => fetchPayments(),
  });

  const payments = (data ?? []) as unknown as PaymentRow[];

  async function onDecide(paymentId: string, status: "SUCCESS" | "FAILED") {
    setBusyId(paymentId);
    try {
      await decidePayment({ data: { paymentId, status } });
      toast.success("Paiement mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <CreditCard className="size-5 text-primary" /> Paiements
        </h1>
        <p className="text-sm text-muted-foreground">
          Wave, Orange Money, carte (via PayTech) et paiements à la livraison. La confirmation en
          ligne se fait automatiquement — les actions ci-dessous servent pour une réconciliation
          manuelle.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Origine</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Aucun paiement.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{clientName(p.profiles)}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(p.created_at)}</div>
                  </TableCell>
                  <TableCell>{origin(p)}</TableCell>
                  <TableCell>{p.payment_method ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{p.external_reference ?? "—"}</TableCell>
                  <TableCell>{formatFcfa(p.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "SUCCESS" ? "default" : "outline"}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === p.id}
                          onClick={() => onDecide(p.id, "FAILED")}
                        >
                          <X className="mr-1 size-3.5" /> Échoué
                        </Button>
                        <Button
                          size="sm"
                          disabled={busyId === p.id}
                          onClick={() => onDecide(p.id, "SUCCESS")}
                        >
                          <Check className="mr-1 size-3.5" /> Confirmer
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
