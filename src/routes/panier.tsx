import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { formatFcfa } from "@/lib/format";
import { placeCartOrderFn } from "@/lib/checkout.functions";

const TITLE = "Mon panier — JokkoTech";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: TITLE },
    ],
  }),
  component: CartPage,
});

const METHODS = [
  { value: "WAVE", label: "Wave" },
  { value: "ORANGE_MONEY", label: "Orange Money" },
  { value: "CARD", label: "Carte bancaire" },
  { value: "CASH_ON_DELIVERY", label: "Paiement à la livraison" },
] as const;

type Method = (typeof METHODS)[number]["value"];

function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, setQty, removeItem, clear } = useCart();
  const navigate = useNavigate();
  const placeCartOrder = useServerFn(placeCartOrderFn);

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<Method>("WAVE");
  const [busy, setBusy] = useState(false);

  async function onCheckout() {
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login" } });
      return;
    }
    if (!address.trim() || !phone.trim()) {
      toast.error("Adresse et téléphone obligatoires.");
      return;
    }
    setBusy(true);
    try {
      const result = await placeCartOrder({
        data: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.qty })),
          method,
          address: address.trim(),
          phone: phone.trim(),
        },
      });
      clear();
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        toast.success(`Commande ${result.reference} enregistrée.`);
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader />
      <main className="container-page py-10 md:py-14">
        <Link
          to="/catalogue"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Continuer mes achats
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight md:text-3xl">
          Mon panier
        </h1>

        {items.length === 0 ? (
          <div className="mt-10 rounded-4xl border border-dashed border-border/60 p-12 text-center">
            <ShoppingCart className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Votre panier est vide pour le moment.</p>
            <Button asChild className="mt-5" variant="hero">
              <Link to="/catalogue">Voir le catalogue</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="glass flex items-center gap-4 rounded-3xl p-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/50">
                    {item.image ? (
                      <img src={item.image} alt={item.model} className="h-12 object-contain" />
                    ) : (
                      <ShoppingCart className="size-6 text-primary/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {item.model} {item.generation}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.storage}</p>
                    <p className="mt-1 text-sm font-medium">{formatFcfa(item.priceCash)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQty(item.productId, item.qty - 1)}
                      className="flex size-7 items-center justify-center rounded-full border border-border/70 hover:bg-accent"
                      aria-label="Diminuer la quantité"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.productId, item.qty + 1)}
                      className="flex size-7 items-center justify-center rounded-full border border-border/70 hover:bg-accent"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Retirer du panier"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="glass h-fit rounded-4xl p-6">
              <h2 className="font-semibold">Livraison et paiement</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Paiement Cash uniquement depuis le panier. Pour Flex ou Tontine, choisissez la
                formule directement sur la fiche produit.
              </p>

              <div className="mt-5 space-y-3">
                <div>
                  <Label htmlFor="address">Adresse de livraison</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Quartier, ville, repère"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="77 123 45 67"
                  />
                </div>
                <div>
                  <Label>Moyen de paiement</Label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {METHODS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMethod(m.value)}
                        className={`rounded-xl border px-3 py-2 text-xs font-medium transition-smooth ${
                          method === m.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 hover:bg-accent"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <dl className="mt-5 space-y-1.5 border-t border-border/60 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Sous-total</dt>
                  <dd className="font-semibold">{formatFcfa(subtotal)}</dd>
                </div>
              </dl>

              <Button
                className="mt-5 w-full"
                variant="hero"
                onClick={onCheckout}
                disabled={busy || authLoading}
              >
                {!user
                  ? "Se connecter pour commander"
                  : busy
                    ? "Traitement…"
                    : `Payer ${formatFcfa(subtotal)}`}
              </Button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
