import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/paiement/succes")({
  head: () => ({
    meta: [{ title: "Paiement en cours de confirmation — iPad Rythme" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search["ref"] === "string" ? (search["ref"] as string) : undefined,
  }),
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const search = useSearch({ from: "/paiement/succes" });
  const ref = search["ref"];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <CheckCircle2 className="size-14 text-primary" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Paiement transmis</h1>
        <p className="mt-3 text-muted-foreground">
          Votre paiement a été envoyé à PayTech. Nous confirmons automatiquement votre commande dès
          réception — cela prend généralement quelques secondes.
          {ref && (
            <>
              <br />
              Référence : <span className="font-mono text-foreground">{ref}</span>
            </>
          )}
        </p>
        <Button asChild className="mt-8">
          <Link to="/dashboard">Voir mon espace</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
