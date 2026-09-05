import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingCart, Heart, User, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { MessagesButton } from "@/components/site/MessagesButton";
import { SupportButton } from "@/components/site/SupportButton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";

const ITEMS = [
  { to: "/" as const, label: "Accueil", icon: Home, exact: true },
  { to: "/catalogue" as const, label: "Catalogue", icon: LayoutGrid, exact: false },
  { to: "/panier" as const, label: "Panier", icon: ShoppingCart, exact: false },
  { to: "/favoris" as const, label: "Favoris", icon: Heart, exact: false },
];

/**
 * Navigation principale et UNIQUE sur mobile — pilule flottante "verre"
 * fixée en bas de l'écran. Le header du haut (SiteHeader) est entièrement
 * masqué sur mobile : tout — y compris Formules, Tontines, support et
 * messagerie, regroupés ici sous "Plus" — vit dans cette seule barre, pour
 * ne jamais avoir deux navigations différentes à deux endroits de l'écran.
 * Masquée sur desktop (md:hidden), où la nav du header reste utilisée.
 */
export function MobileBottomNav() {
  const { user } = useAuth();
  const { count: cartCount } = useCart();
  const { count: favCount } = useFavorites();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed inset-x-4 bottom-4 z-50 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="glass mx-auto flex max-w-md items-center justify-between rounded-full px-2 py-2 shadow-glass"
          style={{
            backdropFilter: "blur(18px) saturate(150%)",
            WebkitBackdropFilter: "blur(18px) saturate(150%)",
          }}
        >
          {ITEMS.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const badge = item.to === "/panier" ? cartCount : item.to === "/favoris" ? favCount : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium transition-smooth ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="size-5" />
                {badge > 0 && (
                  <span className="absolute right-[calc(50%-16px)] top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
                {item.label}
              </Link>
            );
          })}
          <Link
            to={user ? "/dashboard" : "/auth"}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium transition-smooth ${
              pathname === "/dashboard" || pathname === "/auth"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="size-5" />
            {user ? "Compte" : "Connexion"}
          </Link>
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium text-muted-foreground transition-smooth hover:text-foreground"
          >
            <MoreHorizontal className="size-5" />
            Plus
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl md:hidden">
          <SheetHeader>
            <SheetTitle>Plus</SheetTitle>
          </SheetHeader>
          <div className="mt-2 flex flex-col gap-1">
            <SheetClose asChild>
              <Link
                to="/formules"
                className="rounded-xl px-3 py-3 text-sm font-medium text-foreground/80 transition-smooth hover:bg-accent"
              >
                Formules
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                to="/tontines"
                className="rounded-xl px-3 py-3 text-sm font-medium text-foreground/80 transition-smooth hover:bg-accent"
              >
                Tontines
              </Link>
            </SheetClose>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <SupportButton />
            <MessagesButton />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
