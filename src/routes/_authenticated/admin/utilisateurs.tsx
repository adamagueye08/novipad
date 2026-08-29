import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Users, ShieldOff, ShieldCheck } from "lucide-react";
import { adminUsersFn, adminSetRoleFn, adminSetUserStatusFn } from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/_authenticated/admin/utilisateurs")({
  head: () => ({
    meta: [{ title: "Utilisateurs — iPad Rythme" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminUsersPage,
});

type AppRole = "super_admin" | "admin" | "finance" | "stock" | "tontine_manager" | "client";

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  status: "ACTIVE" | "SUSPENDED";
  created_at: string;
  roles: AppRole[];
};

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  finance: "Finance",
  stock: "Stock",
  tontine_manager: "Gestion tontines",
  client: "Client",
};

const ROLE_OPTIONS: AppRole[] = [
  "client",
  "stock",
  "finance",
  "tontine_manager",
  "admin",
  "super_admin",
];

function userName(u: UserRow) {
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return full || u.email || "Utilisateur";
}

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(adminUsersFn);
  const setRole = useServerFn(adminSetRoleFn);
  const setStatus = useServerFn(adminSetUserStatusFn);

  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const users = (data ?? []) as unknown as UserRow[];
  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      userName(u).toLowerCase().includes(q) ||
      (u.phone ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    );
  });

  async function onRoleChange(userId: string, role: AppRole) {
    setBusyId(userId);
    try {
      await setRole({ data: { userId, role } });
      toast.success("Rôle mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusyId(null);
    }
  }

  async function onToggleStatus(u: UserRow) {
    setBusyId(u.id);
    try {
      const next = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await setStatus({ data: { userId: u.id, status: next } });
      toast.success(next === "SUSPENDED" ? "Compte suspendu." : "Compte réactivé.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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
            <Users className="size-5 text-primary" /> Utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground">
            {users.length} utilisateur{users.length > 1 ? "s" : ""} · clients et équipe
          </p>
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un nom, téléphone, email…"
          className="h-9 w-64"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const currentRole = u.roles[0] ?? "client";
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{userName(u)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{u.phone ?? "—"}</div>
                      <div>{u.email ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(u.created_at)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={currentRole}
                        onValueChange={(v) => onRoleChange(u.id, v as AppRole)}
                        disabled={busyId === u.id}
                      >
                        <SelectTrigger className="h-8 w-[150px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === "ACTIVE" ? "default" : "secondary"}>
                        {u.status === "ACTIVE" ? "Actif" : "Suspendu"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === u.id}
                        onClick={() => onToggleStatus(u)}
                      >
                        {u.status === "ACTIVE" ? (
                          <>
                            <ShieldOff className="mr-1 size-3.5" /> Suspendre
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="mr-1 size-3.5" /> Réactiver
                          </>
                        )}
                      </Button>
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
