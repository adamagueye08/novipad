import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, LayoutDashboard, ShoppingCart, Heart } from "lucide-react";
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

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const { count: cartCount } = useCart();
  const { count: favCount } = useFavorites();

  return (
    <header className="sticky top-4 z-50 px-4">
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

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} label={item.label} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <SupportButton />
            <IconLinkWithBadge to="/favoris" count={favCount} label="Favoris" icon={Heart} />
            <IconLinkWithBadge to="/panier" count={cartCount} label="Panier" icon={ShoppingCart} />
            {!loading && <MessagesButton />}
          </div>

          {loading ? null : user ? (
            <Button
              asChild
              size="sm"
              className="hidden rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_-4px_var(--brand-cyan)] transition-smooth hover:scale-[1.04] active:scale-[0.97] md:inline-flex"
            >
              <Link to="/dashboard">
                <LayoutDashboard /> Mon espace
              </Link>
            </Button>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
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
            </div>
          )}

          {/* Mobile : la navigation principale vit dans MobileBottomNav (en
              bas de l'écran), donc ce menu ne garde que ce qui n'y est pas
              déjà — Formules, Tontines, messagerie, support. */}
          <button
            type="button"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 transition-smooth active:scale-95 md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="glass mx-auto mt-2 max-w-5xl rounded-3xl px-5 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.filter((item) => item.to === "/formules" || item.to === "/tontines").map(
              (item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-foreground/80 transition-smooth hover:bg-accent"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
          <div className="mt-3 flex items-center gap-2">
            <SupportButton />
            {!loading && <MessagesButton />}
            <Button
              asChild
              variant="outline"
              size="icon"
              className="relative"
              aria-label="Favoris"
              onClick={() => setOpen(false)}
            >
              <Link to="/favoris">
                <Heart className="size-4" />
                {favCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {favCount > 9 ? "9+" : favCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="icon"
              className="relative"
              aria-label="Panier"
              onClick={() => setOpen(false)}
            >
              <Link to="/panier">
                <ShoppingCart className="size-4" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            </Button>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {user ? (
              <Button asChild className="rounded-full" onClick={() => setOpen(false)}>
                <Link to="/dashboard">Mon espace</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/auth">Connexion</Link>
                </Button>
                <Button asChild className="rounded-full" onClick={() => setOpen(false)}>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Créer un compte
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
