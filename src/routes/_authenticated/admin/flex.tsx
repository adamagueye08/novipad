import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Wallet, Check, X, BadgeCheck } from "lucide-react";
import {
  adminFlexCancellationsFn,
  adminDecideFlexCancellationFn,
  adminMarkFlexCancellationRefundedFn,
} from "@/lib/admin.functions";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/flex")({
  head: () => ({
    meta: [{ title: "Flex — Annulations — JokkoTech" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminFlexPage,
});

type Profile = { first_name: string | null; last_name: string | null; phone: string | null };

type CancellationRow = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";
  reason: string | null;
  paid_amount: number;
  fee_amount: number;
  refundable_amount: number;
  keep_as_credit: boolean;
  created_at: string;
  decided_at: string | null;
  flex_accounts: { products: { model: string } | null } | null;
  profiles: Profile | null;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvée",
  REJECTED: "Refusée",
  REFUNDED: "Remboursée",
};

function clientName(p: Profile | null) {
  const full = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
  return full || "Client";
}

function AdminFlexPage() {
  const queryClient = useQueryClient();
  const fetchCancellations = useServerFn(adminFlexCancellationsFn);
  const decide = useServerFn(adminDecideFlexCancellationFn);
  const markRefunded = useServerFn(adminMarkFlexCancellationRefundedFn);

  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-flex-cancellations", filter],
    queryFn: () => fetchCancellations({ data: { status: filter } }),
  });

  const requests = (data ?? []) as unknown as CancellationRow[];

  async function onDecide(requestId: string, decision: "APPROVED" | "REJECTED") {
    setBusyId(requestId);
    try {
      await decide({ data: { requestId, decision } });
      toast.success(decision === "APPROVED" ? "Annulation approuvée." : "Demande refusée.");
      queryClient.invalidateQueries({ queryKey: ["admin-flex-cancellations"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusyId(null);
    }
  }

  async function onMarkRefunded(requestId: string) {
    setBusyId(requestId);
    try {
      await markRefunded({ data: { requestId } });
      toast.success("Marqué comme remboursé.");
      queryClient.invalidateQueries({ queryKey: ["admin-flex-cancellations"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Wallet className="size-5 text-primary" /> Flex — Annulations
          </h1>
          <p className="text-sm text-muted-foreground">
            Demandes d'annulation de comptes Flex à traiter.
          </p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as "PENDING" | "ALL")}>
          <SelectTrigger className="h-9 w-[160px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="ALL">Toutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Versé</TableHead>
              <TableHead>Frais</TableHead>
              <TableHead>À rendre</TableHead>
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
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Aucune demande.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{clientName(r.profiles)}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.profiles?.phone ?? "—"} · {formatDate(r.created_at)}
                    </div>
                    {r.reason && (
                      <div className="mt-1 text-xs italic text-muted-foreground">"{r.reason}"</div>
                    )}
                  </TableCell>
                  <TableCell>{r.flex_accounts?.products?.model ?? "iPad"}</TableCell>
                  <TableCell>{formatFcfa(r.paid_amount)}</TableCell>
                  <TableCell>{formatFcfa(r.fee_amount)}</TableCell>
                  <TableCell className="font-medium">
                    {formatFcfa(r.refundable_amount)}
                    {r.keep_as_credit && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Crédit
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "PENDING"
                          ? "outline"
                          : r.status === "REJECTED"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {STATUS_LABELS[r.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === r.id}
                          onClick={() => onDecide(r.id, "REJECTED")}
                        >
                          <X className="mr-1 size-3.5" /> Refuser
                        </Button>
                        <Button
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => onDecide(r.id, "APPROVED")}
                        >
                          <Check className="mr-1 size-3.5" /> Approuver
                        </Button>
                      </div>
                    )}
                    {r.status === "APPROVED" && !r.keep_as_credit && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === r.id}
                        onClick={() => onMarkRefunded(r.id)}
                      >
                        <BadgeCheck className="mr-1 size-3.5" /> Marquer remboursé
                      </Button>
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
