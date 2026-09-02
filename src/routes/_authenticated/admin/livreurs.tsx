import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bike, Plus, Pencil, Trash2, Phone } from "lucide-react";
import {
  adminCouriersFn,
  adminCreateCourierFn,
  adminUpdateCourierFn,
  adminDeleteCourierFn,
} from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/livreurs")({
  head: () => ({
    meta: [{ title: "Livreurs — JokkoTech" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminCouriersPage,
});

type Courier = {
  id: string;
  full_name: string;
  phone: string;
  vehicle: string | null;
  zone: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

type FormState = {
  fullName: string;
  phone: string;
  vehicle: string;
  zone: string;
  notes: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  phone: "",
  vehicle: "",
  zone: "",
  notes: "",
  isActive: true,
};

function CourierFormDialog({ courier, onSaved }: { courier?: Courier; onSaved: () => void }) {
  const createCourier = useServerFn(adminCreateCourierFn);
  const updateCourier = useServerFn(adminUpdateCourierFn);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(
    courier
      ? {
          fullName: courier.full_name,
          phone: courier.phone,
          vehicle: courier.vehicle ?? "",
          zone: courier.zone ?? "",
          notes: courier.notes ?? "",
          isActive: courier.is_active,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error("Nom et téléphone obligatoires.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        vehicle: form.vehicle.trim() || undefined,
        zone: form.zone.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (courier) {
        await updateCourier({
          data: { ...payload, courierId: courier.id, isActive: form.isActive },
        });
        toast.success("Livreur mis à jour.");
      } else {
        await createCourier({ data: payload });
        toast.success("Livreur ajouté.");
        setForm(EMPTY_FORM);
      }
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {courier ? (
          <Button size="sm" variant="outline">
            <Pencil className="mr-1 size-3.5" /> Modifier
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="mr-1 size-3.5" /> Ajouter un livreur
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{courier ? "Modifier le livreur" : "Nouveau livreur"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Ex. Moussa Diop"
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Ex. 77 123 45 67"
              maxLength={30}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vehicle">Véhicule</Label>
              <Input
                id="vehicle"
                value={form.vehicle}
                onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))}
                placeholder="Moto, voiture…"
                maxLength={60}
              />
            </div>
            <div>
              <Label htmlFor="zone">Zone</Label>
              <Input
                id="zone"
                value={form.zone}
                onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
                placeholder="Dakar, Pikine…"
                maxLength={120}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes internes (non visibles du client)</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              maxLength={500}
            />
          </div>
          {courier && (
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <Label htmlFor="isActive" className="cursor-pointer">
                Livreur actif (assignable à une commande)
              </Label>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCourierButton({ courier, onDeleted }: { courier: Courier; onDeleted: () => void }) {
  const deleteCourier = useServerFn(adminDeleteCourierFn);
  const [busy, setBusy] = useState(false);

  async function onConfirm() {
    setBusy(true);
    try {
      await deleteCourier({ data: { courierId: courier.id } });
      toast.success("Livreur supprimé.");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 className="size-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer {courier.full_name} ?</AlertDialogTitle>
          <AlertDialogDescription>
            S'il a déjà été assigné à des livraisons passées, celles-ci resteront intactes mais
            n'afficheront plus son nom. Si ce livreur est juste temporairement indisponible,
            préférez le désactiver plutôt que le supprimer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={onConfirm}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AdminCouriersPage() {
  const queryClient = useQueryClient();
  const fetchCouriers = useServerFn(adminCouriersFn);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-couriers"],
    queryFn: () => fetchCouriers(),
  });

  const couriers = (data ?? []) as unknown as Courier[];

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-couriers"] });
    // Les commandes affichent le nom/téléphone du livreur assigné : on
    // rafraîchit aussi cette liste pour rester cohérent après une édition.
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Bike className="size-5 text-primary" /> Livreurs
          </h1>
          <p className="text-sm text-muted-foreground">
            {couriers.length} livreur{couriers.length > 1 ? "s" : ""} · ajoutés manuellement,
            assignables depuis « Commandes »
          </p>
        </div>
        <CourierFormDialog onSaved={refresh} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Véhicule</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Ajouté le</TableHead>
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
            ) : couriers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Aucun livreur pour l'instant. Ajoutez-en un pour pouvoir l'assigner à une
                  commande.
                </TableCell>
              </TableRow>
            ) : (
              couriers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.full_name}</TableCell>
                  <TableCell className="text-xs">
                    <a
                      href={`tel:${c.phone}`}
                      className="flex items-center gap-1.5 hover:underline"
                    >
                      <Phone className="size-3.5 text-muted-foreground" /> {c.phone}
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.vehicle || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.zone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? "default" : "secondary"}>
                      {c.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(c.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <CourierFormDialog courier={c} onSaved={refresh} />
                      <DeleteCourierButton courier={c} onDeleted={refresh} />
                    </div>
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
