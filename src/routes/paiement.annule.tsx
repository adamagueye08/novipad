import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { AnimatedBackground } from "@/components/site/AnimatedBackground";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/paiement/annule")({
  head: () => ({
    meta: [{ title: "Paiement annulé — JokkoTech" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search["ref"] === "string" ? (search["ref"] as string) : undefined,
  }),
  component: PaymentCancelPage,
});

function PaymentCancelPage() {
  const search = useSearch({ from: "/paiement/annule" });
  const ref = search["ref"];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <AnimatedBackground />
      <SiteHeader />
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <XCircle className="size-14 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Paiement annulé</h1>
        <p className="mt-3 text-muted-foreground">
          Vous avez annulé le paiement, aucun montant n'a été débité.
          {ref && (
            <>
              <br />
              Référence : <span className="font-mono text-foreground">{ref}</span>
            </>
          )}
        </p>
        <Button asChild className="mt-8">
          <Link to="/dashboard">Réessayer depuis mon espace</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
