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
    <header className="sticky top-0 z-50 border-b border-border/60 glass-soft">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="JokkoTech" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
            >
              {item.label}
            </Link>
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
            <Button asChild variant="hero" size="sm" className="hidden md:inline-flex">
              <Link to="/dashboard">
                <LayoutDashboard /> Mon espace
              </Link>
            </Button>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Connexion</Link>
              </Button>
              <Button asChild variant="hero" size="sm">
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-card/95 px-5 pb-5 pt-3 backdrop-blur-xl md:hidden">
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
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {user ? (
              <Button asChild variant="hero" onClick={() => setOpen(false)}>
                <Link to="/dashboard">Mon espace</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" onClick={() => setOpen(false)}>
                  <Link to="/auth">Connexion</Link>
                </Button>
                <Button asChild variant="hero" onClick={() => setOpen(false)}>
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
