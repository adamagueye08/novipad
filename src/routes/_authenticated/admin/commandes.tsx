import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShoppingBag, Truck } from "lucide-react";
import { adminOrdersFn, adminUpdateOrderFn } from "@/lib/admin.functions";
import { formatFcfa, formatDate } from "@/lib/format";
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

export const Route = createFileRoute("/_authenticated/admin/commandes")({
  head: () => ({
    meta: [{ title: "Commandes — JokkoTech" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminOrdersPage,
});

type Profile = { first_name: string | null; last_name: string | null; phone: string | null };
type Delivery = { id: string; status: string; address: string; phone: string };

type OrderRow = {
  id: string;
  reference: string;
  status: string;
  formula: "CASH" | "FLEX" | "TONTINE";
  amount: number;
  created_at: string;
  user_id: string;
  products: { model: string } | null;
  profiles: Profile | null;
  deliveries: Delivery[];
};

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payée",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const FORMULA_LABELS: Record<string, string> = {
  CASH: "Cash",
  FLEX: "Flex",
  TONTINE: "Tontine",
};

const STATUS_BADGE_VARIANT = (status: string) => {
  if (status === "CANCELLED") return "secondary" as const;
  if (status === "DELIVERED" || status === "COMPLETED") return "default" as const;
  return "outline" as const;
};

function clientName(p: Profile | null) {
  const full = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
  return full || "Client";
}

function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(adminOrdersFn);
  const updateOrder = useServerFn(adminUpdateOrderFn);

  const [formulaFilter, setFormulaFilter] = useState<"ALL" | "CASH" | "FLEX" | "TONTINE">("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => fetchOrders(),
  });

  const orders = ((data ?? []) as unknown as OrderRow[]).filter(
    (o) => formulaFilter === "ALL" || o.formula === formulaFilter,
  );

  async function onStatusChange(orderId: string, status: (typeof ORDER_STATUSES)[number]) {
    setBusyId(orderId);
    try {
      await updateOrder({ data: { orderId, status } });
      toast.success("Statut mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
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
            <ShoppingBag className="size-5 text-primary" /> Commandes
          </h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} commande{orders.length > 1 ? "s" : ""} · Cash, Flex et Tontine
          </p>
        </div>
        <Select
          value={formulaFilter}
          onValueChange={(v) => setFormulaFilter(v as typeof formulaFilter)}
        >
          <SelectTrigger className="h-9 w-[160px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes formules</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="FLEX">Flex</SelectItem>
            <SelectItem value="TONTINE">Tontine</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Formule</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Livraison</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Aucune commande.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => {
                const delivery = o.deliveries[0];
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.reference}</TableCell>
                    <TableCell>
                      <div className="font-medium">{clientName(o.profiles)}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.profiles?.phone ?? "—"} · {formatDate(o.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>{o.products?.model ?? "iPad"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{FORMULA_LABELS[o.formula] ?? o.formula}</Badge>
                    </TableCell>
                    <TableCell>{formatFcfa(o.amount)}</TableCell>
                    <TableCell className="max-w-[180px]">
                      {delivery ? (
                        <div className="flex items-start gap-1.5 text-xs">
                          <Truck className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                          <div>
                            <div className="truncate">{delivery.address}</div>
                            <div className="text-muted-foreground">{delivery.phone}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={o.status}
                        onValueChange={(v) =>
                          onStatusChange(o.id, v as (typeof ORDER_STATUSES)[number])
                        }
                        disabled={busyId === o.id}
                      >
                        <SelectTrigger className="h-8 w-[150px] text-xs">
                          <SelectValue>
                            <Badge variant={STATUS_BADGE_VARIANT(o.status)}>
                              {STATUS_LABELS[o.status] ?? o.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
