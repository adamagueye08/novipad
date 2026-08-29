import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldCheck, Check, X, Users } from "lucide-react";
import { adminTontinesFn, adminDecideMemberFn, adminUpdateTontineFn } from "@/lib/admin.functions";
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

export const Route = createFileRoute("/_authenticated/admin/tontines")({
  head: () => ({
    meta: [{ title: "Tontines — iPad Rythme" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminTontinesPage,
});

type Profile = { first_name: string | null; last_name: string | null; phone: string | null };

type Member = {
  id: string;
  status: string;
  paid_amount: number;
  created_at: string;
  user_id: string;
  profiles: Profile | null;
};

type TontineRow = {
  id: string;
  name: string;
  status: "DRAFT" | "OPEN" | "ACTIVE" | "CLOSED";
  price: number;
  contribution_amount: number;
  frequency: string;
  duration_months: number;
  member_capacity: number;
  ipads_available: number;
  start_date: string | null;
  tontine_members: Member[];
};

const TONTINE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  OPEN: "Ouverte",
  ACTIVE: "Active",
  CLOSED: "Fermée",
};

const MEMBER_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  COMPLETED: "Terminé",
  REMOVED: "Retiré / refusé",
};

function memberName(p: Profile | null) {
  const full = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
  return full || "Client";
}

function AdminTontinesPage() {
  const queryClient = useQueryClient();
  const fetchTontines = useServerFn(adminTontinesFn);
  const decideMember = useServerFn(adminDecideMemberFn);
  const updateTontineStatus = useServerFn(adminUpdateTontineFn);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tontines"],
    queryFn: () => fetchTontines(),
  });

  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [busyTontineId, setBusyTontineId] = useState<string | null>(null);

  const tontines = (data ?? []) as unknown as TontineRow[];

  const pendingRequests = tontines.flatMap((t) =>
    t.tontine_members
      .filter((m) => m.status === "PENDING")
      .map((m) => ({ ...m, tontineId: t.id, tontineName: t.name })),
  );

  async function onDecide(memberId: string, decision: "APPROVED" | "REMOVED") {
    setBusyMemberId(memberId);
    try {
      await decideMember({ data: { memberId, decision } });
      toast.success(decision === "APPROVED" ? "Adhésion approuvée." : "Demande refusée.");
      queryClient.invalidateQueries({ queryKey: ["admin-tontines"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusyMemberId(null);
    }
  }

  async function onStatusChange(tontineId: string, status: TontineRow["status"]) {
    setBusyTontineId(tontineId);
    try {
      await updateTontineStatus({ data: { tontineId, status } });
      toast.success("Statut de la tontine mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["admin-tontines"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusyTontineId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShieldCheck className="size-5 text-primary" /> Tontines
        </h1>
        <p className="text-sm text-muted-foreground">
          Demandes d'adhésion à valider et suivi des tontines en cours.
        </p>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card/60">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h2 className="font-medium">
            Demandes d'adhésion en attente
            {pendingRequests.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Tontine</TableHead>
                <TableHead>Demandé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : pendingRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Aucune demande en attente.
                  </TableCell>
                </TableRow>
              ) : (
                pendingRequests.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{memberName(m.profiles)}</TableCell>
                    <TableCell>{m.profiles?.phone ?? "—"}</TableCell>
                    <TableCell>{m.tontineName}</TableCell>
                    <TableCell>{formatDate(m.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyMemberId === m.id}
                          onClick={() => onDecide(m.id, "REMOVED")}
                        >
                          <X className="mr-1 size-3.5" /> Refuser
                        </Button>
                        <Button
                          size="sm"
                          disabled={busyMemberId === m.id}
                          onClick={() => onDecide(m.id, "APPROVED")}
                        >
                          <Check className="mr-1 size-3.5" /> Approuver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-medium">
          <Users className="size-4" /> Vue d'ensemble des tontines
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : tontines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune tontine créée pour le moment.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tontines.map((t) => {
              const active = t.tontine_members.filter((m) =>
                ["APPROVED", "ACTIVE"].includes(m.status),
              ).length;
              const pending = t.tontine_members.filter((m) => m.status === "PENDING").length;
              return (
                <div key={t.id} className="rounded-2xl border border-border/60 bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFcfa(t.contribution_amount)} / {t.frequency} · {t.duration_months}{" "}
                        mois
                      </p>
                    </div>
                    <Select
                      value={t.status}
                      onValueChange={(v) => onStatusChange(t.id, v as TontineRow["status"])}
                      disabled={busyTontineId === t.id}
                    >
                      <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TONTINE_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-muted/50 py-2">
                      <dt className="text-xs text-muted-foreground">Membres</dt>
                      <dd className="font-semibold">
                        {active}/{t.member_capacity}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-muted/50 py-2">
                      <dt className="text-xs text-muted-foreground">En attente</dt>
                      <dd className="font-semibold">{pending}</dd>
                    </div>
                    <div className="rounded-lg bg-muted/50 py-2">
                      <dt className="text-xs text-muted-foreground">iPad dispo.</dt>
                      <dd className="font-semibold">{t.ipads_available}</dd>
                    </div>
                  </dl>

                  {t.tontine_members.filter((m) => ["APPROVED", "ACTIVE"].includes(m.status))
                    .length > 0 && (
                    <details className="mt-3 text-xs text-muted-foreground">
                      <summary className="cursor-pointer select-none font-medium text-foreground">
                        Voir les membres
                      </summary>
                      <ul className="mt-2 space-y-1.5">
                        {t.tontine_members
                          .filter((m) => ["APPROVED", "ACTIVE"].includes(m.status))
                          .map((m) => (
                            <li key={m.id} className="flex items-center justify-between">
                              <span>{memberName(m.profiles)}</span>
                              <span className="flex items-center gap-2">
                                <span>{formatFcfa(m.paid_amount)} versés</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {MEMBER_STATUS_LABELS[m.status] ?? m.status}
                                </Badge>
                              </span>
                            </li>
                          ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
