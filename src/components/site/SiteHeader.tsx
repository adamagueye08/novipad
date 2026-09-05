import { Link } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { MessagesButton } from "@/components/site/MessagesButton";
import { SupportButton } from "@/components/site/SupportButton";
import logo from "@/assets/jokkotech-logo.png";

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/catalogue", label: "Catalogue" },
  { to: "/formules", label: "Formules" },
  { to: "/tontines", label: "Tontines" },
] as const;

/** Lien avec un soulignement animé (trait qui apparaît de gauche à droite au survol). */
function NavLink({ to, label }: { to: (typeof NAV)[number]["to"]; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="group relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
      activeProps={{ className: "text-foreground" }}
    >
      {label}
      <span className="pointer-events-none absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-primary transition-transform duration-300 ease-out group-hover:scale-x-100" />
    </Link>
  );
}

function IconLinkWithBadge({
  to,
  count,
  label,
  icon: Icon,
}: {
  to: "/panier" | "/favoris";
  count: number;
  label: string;
  icon: typeof ShoppingCart;
}) {
  return (
    <Button asChild variant="outline" size="icon" className="relative" aria-label={label}>
      <Link to={to}>
        <Icon className="size-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}

/**
 * Navigation du site — DESKTOP UNIQUEMENT (hidden md:block). Sur mobile,
 * toute la navigation vit dans MobileBottomNav (barre flottante en bas de
 * l'écran) : il n'y a jamais deux barres de navigation actives en même
 * temps sur un même écran.
 */
export function SiteHeader() {
  const { user, loading } = useAuth();
  const { count: cartCount } = useCart();
  const { count: favCount } = useFavorites();

  return (
    <header className="sticky top-4 z-50 hidden px-4 md:block">
      <div
        className="glass mx-auto flex h-16 max-w-5xl animate-nav-in items-center justify-between gap-4 rounded-full px-5 shadow-glass"
        style={{
          backdropFilter: "blur(16px) saturate(140%)",
          WebkitBackdropFilter: "blur(16px) saturate(140%)",
        }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="JokkoTech" className="h-8 w-auto" />
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} label={item.label} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SupportButton />
          <IconLinkWithBadge to="/favoris" count={favCount} label="Favoris" icon={Heart} />
          <IconLinkWithBadge to="/panier" count={cartCount} label="Panier" icon={ShoppingCart} />
          {!loading && <MessagesButton />}

          {loading ? null : user ? (
            <Button
              asChild
              size="sm"
              className="rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_-4px_var(--brand-cyan)] transition-smooth hover:scale-[1.04] active:scale-[0.97]"
            >
              <Link to="/dashboard">
                <LayoutDashboard /> Mon espace
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/auth">Connexion</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_-4px_var(--brand-cyan)] transition-smooth hover:scale-[1.04] active:scale-[0.97]"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  Créer un compte
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
