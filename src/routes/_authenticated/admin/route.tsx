import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart3,
  Boxes,
  CreditCard,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import { myAccessFn } from "@/lib/admin.functions";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Back-office — iPad Rythme" },
      {
        name: "description",
        content: "Pilotage des commandes, paiements, stock, tontines et utilisateurs iPad Rythme.",
      },
      { property: "og:title", content: "Back-office — iPad Rythme" },
      { property: "og:description", content: "Console interne de gestion iPad Rythme." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

// Pages construites : Vue d'ensemble et Produits & stock.
// Commandes / Paiements / Tontines / Utilisateurs arrivent ensuite —
// elles restent désactivées (plutôt que des liens vers des 404) tant
// qu'elles ne sont pas branchées.
const NAV = [
  { to: "/admin", label: "Vue d'ensemble", icon: BarChart3, ready: true },
  { to: "/admin/produits", label: "Produits & stock", icon: Boxes, ready: true },
  { to: "/admin/commandes", label: "Commandes", icon: ShoppingBag, ready: true },
  { to: "/admin/paiements", label: "Paiements", icon: CreditCard, ready: true },
  { to: "/admin/flex", label: "Flex — Annulations", icon: Wallet, ready: true },
  { to: "/admin/tontines", label: "Tontines", icon: ShieldCheck, ready: true },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users, ready: true },
] as const;

function AdminLayout() {
  const access = useServerFn(myAccessFn);
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-access"],
    queryFn: () => access(),
  });

  if (isLoading) {
    return <div className="p-10 text-center text-muted-foreground">Vérification des accès…</div>;
  }

  if (error || !data?.isStaff) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Accès réservé à l'équipe</h1>
        <p className="mt-3 text-muted-foreground">
          Votre compte n'a pas de rôle interne. Contactez un administrateur pour obtenir l'accès au
          back-office.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block text-primary underline">
          Retour à mon espace client
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            iPad Rythme <span className="text-muted-foreground">· Back-office</span>
          </Link>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {data.roles.join(" · ")}
          </span>
          <Link
            to="/dashboard"
            className="ml-auto text-sm text-muted-foreground hover:text-foreground"
          >
            Espace client
          </Link>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3">
          {NAV.map(({ to, label, icon: Icon, ready }) =>
            ready ? (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/admin" }}
                className="flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted/60 hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ) : (
              <span
                key={to}
                title="Bientôt disponible"
                className="flex cursor-not-allowed items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm text-muted-foreground/40"
              >
                <Icon className="size-4" />
                {label}
              </span>
            ),
          )}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
