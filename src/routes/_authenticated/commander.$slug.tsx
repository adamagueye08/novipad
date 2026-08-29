import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { productQuery } from "@/lib/api";
import { formatFcfa } from "@/lib/format";
import { placeCashOrderFn, openFlexAccountFn, depositToFlexFn } from "@/lib/checkout.functions";

const TITLE = "Commander votre iPad — iPad Rythme";
const DESCRIPTION =
  "Finalisez votre commande iPad Rythme : formule Cash ou Flex, adresse de livraison et moyen de paiement Wave, Orange Money ou carte.";

export const Route = createFileRoute("/_authenticated/commander/$slug")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

const METHODS = [
  { value: "WAVE", label: "Wave" },
  { value: "ORANGE_MONEY", label: "Orange Money" },
  { value: "CARD", label: "Carte bancaire" },
  { value: "CASH_ON_DELIVERY", label: "Paiement à la livraison" },
] as const;

type Method = (typeof METHODS)[number]["value"];

function OrderPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const placeOrder = useServerFn(placeCashOrderFn);
  const openFlex = useServerFn(openFlexAccountFn);
  const deposit = useServerFn(depositToFlexFn);

  const [formula, setFormula] = useState<"CASH" | "FLEX">("CASH");
  const [method, setMethod] = useState<Method>("WAVE");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [firstDeposit, setFirstDeposit] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setBusy(true);
    try {
      if (formula === "CASH") {
        const res = await placeOrder({
          data: { productId: product.id, method, address, phone },
        });
        if (res.redirectUrl) {
          // Wave / Orange Money / carte : on quitte le site pour la page de
          // paiement sécurisée PayTech. La commande sera confirmée par
          // webhook dès que le paiement aboutit.
          window.location.href = res.redirectUrl;
          return;
        }
        toast.success(`Commande ${res.reference} enregistrée. Vous payez à la livraison.`);
      } else {
        const { flexAccountId } = await openFlex({
          data: { productId: product.id, address, phone },
        });
        const amount = Number(firstDeposit);
        if (amount > 0) {
          const res = await deposit({
            data: {
              flexAccountId,
              amount,
              method: method === "CASH_ON_DELIVERY" ? "WAVE" : method,
            },
          });
          window.location.href = res.redirectUrl;
          return;
        }
        toast.success("Compte Flex ouvert. Suivez votre épargne depuis votre espace.");
      }
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  const price = product ? (formula === "CASH" ? product.price_cash : product.price_flex) : 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-page py-10 md:py-14">
        <Link
          to="/catalogue/$slug"
          params={{ slug }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à la fiche
        </Link>

        {isLoading ? (
          <div className="mt-8 h-80 animate-pulse rounded-4xl bg-muted" />
        ) : !product ? (
          <p className="mt-12 text-muted-foreground">Cet iPad n'est plus disponible.</p>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
            <form onSubmit={onSubmit} className="glass rounded-4xl p-6 md:p-8">
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                Commander {product.model} {product.generation}
              </h1>

              <div className="mt-7 space-y-3">
                <Label>Formule</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        key: "CASH",
                        label: "Cash",
                        price: product.price_cash,
                        hint: "Paiement immédiat",
                      },
                      {
                        key: "FLEX",
                        label: "Flex",
                        price: product.price_flex,
                        hint: "Épargne progressive",
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFormula(f.key)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        formula === f.key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <p className="text-sm font-semibold">{f.label}</p>
                      <p className="mt-1 font-display text-lg font-bold">{formatFcfa(f.price)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse de livraison</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Quartier, rue, ville"
                    required
                    minLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+221 …"
                    required
                    minLength={6}
                  />
                </div>
                {formula === "FLEX" && (
                  <p className="text-xs text-muted-foreground">
                    Cette adresse servira à la livraison automatique dès que votre épargne atteindra
                    100 %.
                  </p>
                )}
              </div>

              {formula === "FLEX" && (
                <div className="mt-6 space-y-2">
                  <Label htmlFor="firstDeposit">Premier versement (optionnel)</Label>
                  <Input
                    id="firstDeposit"
                    type="number"
                    min={0}
                    max={product.price_flex}
                    value={firstDeposit}
                    onChange={(e) => setFirstDeposit(e.target.value)}
                    placeholder="Ex. 50000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Objectif Flex : {formatFcfa(product.price_flex)}. Vous versez le montant que
                    vous voulez, quand vous voulez.
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <Label>Moyen de paiement</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {METHODS.filter((m) => formula === "CASH" || m.value !== "CASH_ON_DELIVERY").map(
                    (m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMethod(m.value)}
                        className={`rounded-xl border px-4 py-3 text-sm transition ${
                          method === m.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {m.label}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <Button type="submit" variant="hero" className="mt-8 w-full" disabled={busy}>
                {busy
                  ? "Traitement…"
                  : formula === "CASH"
                    ? "Confirmer la commande"
                    : "Ouvrir mon compte Flex"}
              </Button>
            </form>

            <aside className="glass h-fit rounded-4xl p-6">
              <h2 className="font-display text-lg font-semibold">Récapitulatif</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Modèle</dt>
                  <dd className="font-medium">
                    {product.model} {product.generation}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Formule</dt>
                  <dd className="font-medium">{formula === "CASH" ? "Cash" : "Flex"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Garantie</dt>
                  <dd className="font-medium">{product.warranty_months} mois</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="font-medium">Total</dt>
                  <dd className="font-display text-lg font-bold">{formatFcfa(price)}</dd>
                </div>
              </dl>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
