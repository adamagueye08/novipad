import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShoppingBag, Truck, MessageCircle, Phone, Mail, Bike } from "lucide-react";
import {
  adminOrdersFn,
  adminUpdateOrderFn,
  adminSendMessageFn,
  adminCouriersFn,
  adminAssignCourierFn,
} from "@/lib/admin.functions";
import { formatFcfa, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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

type Profile = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
};
type Delivery = {
  id: string;
  status: string;
  address: string;
  phone: string;
  courier_id: string | null;
  couriers: { id: string; full_name: string; phone: string } | null;
};
type Courier = { id: string; full_name: string; phone: string; is_active: boolean };

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

function ContactClientDialog({
  userId,
  name,
  onSent,
}: {
  userId: string;
  name: string;
  onSent: () => void;
}) {
  const sendMessage = useServerFn(adminSendMessageFn);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function onSend() {
    if (!title.trim() || !body.trim()) {
      toast.error("Titre et message obligatoires.");
      return;
    }
    setSending(true);
    try {
      await sendMessage({ data: { userId, title: title.trim(), body: body.trim() } });
      toast.success("Message envoyé.");
      setOpen(false);
      setTitle("");
      setBody("");
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageCircle className="mr-1 size-3.5" /> Contacter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message à {name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Objet (ex. À propos de votre commande)"
            maxLength={120}
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Votre message…"
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground">
            Le client verra ce message dans l'espace "Messages" de son compte.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={onSend} disabled={sending}>
            {sending ? "Envoi…" : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignCourierSelect({
  delivery,
  couriers,
  onAssigned,
}: {
  delivery: Delivery;
  couriers: Courier[];
  onAssigned: () => void;
}) {
  const assignCourier = useServerFn(adminAssignCourierFn);
  const [busy, setBusy] = useState(false);

  async function onChange(value: string) {
    setBusy(true);
    try {
      await assignCourier({
        data: { deliveryId: delivery.id, courierId: value === "NONE" ? null : value },
      });
      toast.success(value === "NONE" ? "Livreur retiré." : "Livreur assigné.");
      onAssigned();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  // Le livreur déjà assigné doit rester sélectionnable même s'il vient
  // d'être désactivé ailleurs, pour ne pas perdre l'affichage de qui est
  // sur cette livraison.
  const options =
    delivery.courier_id && !couriers.some((c) => c.id === delivery.courier_id)
      ? [
          ...couriers,
          delivery.couriers
            ? {
                id: delivery.couriers.id,
                full_name: delivery.couriers.full_name,
                phone: delivery.couriers.phone,
                is_active: false,
              }
            : null,
        ].filter((c): c is Courier => c !== null)
      : couriers;

  return (
    <Select value={delivery.courier_id ?? "NONE"} onValueChange={onChange} disabled={busy}>
      <SelectTrigger className="h-7 w-full text-xs">
        <SelectValue placeholder="Aucun livreur" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="NONE">Aucun livreur</SelectItem>
        {options.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.full_name} {!c.is_active ? "(inactif)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(adminOrdersFn);
  const updateOrder = useServerFn(adminUpdateOrderFn);
  const fetchCouriers = useServerFn(adminCouriersFn);

  const { data: couriersData } = useQuery({
    queryKey: ["admin-couriers"],
    queryFn: () => fetchCouriers(),
  });
  const activeCouriers = ((couriersData ?? []) as unknown as Courier[]).filter((c) => c.is_active);

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
              <TableHead>Contact</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Formule</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Livraison</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Aucune commande.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => {
                const delivery = o.deliveries[0];
                const name = clientName(o.profiles);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.reference}</TableCell>
                    <TableCell>
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(o.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {o.profiles?.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="size-3.5 text-muted-foreground" />
                          <a href={`tel:${o.profiles.phone}`} className="hover:underline">
                            {o.profiles.phone}
                          </a>
                        </div>
                      )}
                      {o.profiles?.email && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <Mail className="size-3.5 text-muted-foreground" />
                          <a href={`mailto:${o.profiles.email}`} className="hover:underline">
                            {o.profiles.email}
                          </a>
                        </div>
                      )}
                      {!o.profiles?.phone && !o.profiles?.email && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{o.products?.model ?? "iPad"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{FORMULA_LABELS[o.formula] ?? o.formula}</Badge>
                    </TableCell>
                    <TableCell>{formatFcfa(o.amount)}</TableCell>
                    <TableCell className="max-w-[200px] space-y-2">
                      {delivery ? (
                        <>
                          <div className="flex items-start gap-1.5 text-xs">
                            <Truck className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                            <div>
                              <div className="truncate">{delivery.address}</div>
                              <div className="text-muted-foreground">{delivery.phone}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <Bike className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                            <AssignCourierSelect
                              delivery={delivery}
                              couriers={activeCouriers}
                              onAssigned={() =>
                                queryClient.invalidateQueries({ queryKey: ["admin-orders"] })
                              }
                            />
                          </div>
                        </>
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
                    <TableCell className="text-right">
                      <ContactClientDialog
                        userId={o.user_id}
                        name={name}
                        onSent={() => queryClient.invalidateQueries({ queryKey: ["admin-orders"] })}
                      />
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
