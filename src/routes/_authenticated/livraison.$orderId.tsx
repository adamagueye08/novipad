import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Phone, Truck, Bike, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

const TITLE = "Suivi de livraison — JokkoTech";

export const Route = createFileRoute("/_authenticated/livraison/$orderId")({
  head: () => ({
    meta: [{ title: TITLE }, { name: "robots", content: "noindex" }],
  }),
  component: DeliveryTrackingPage,
});

// Statuts dans l'ordre chronologique attendu, pour construire une petite
// timeline visuelle. FAILED n'est pas dans le flux normal, traité à part.
const STEPS: { status: string; label: string }[] = [
  { status: "PENDING", label: "Commande reçue" },
  { status: "PREPARING", label: "En préparation" },
  { status: "SHIPPED", label: "Expédiée" },
  { status: "OUT_FOR_DELIVERY", label: "En route avec le livreur" },
  { status: "DELIVERED", label: "Livrée" },
];

function stepIndex(status: string) {
  const idx = STEPS.findIndex((s) => s.status === status);
  return idx === -1 ? 0 : idx;
}

function DeliveryTrackingPage() {
  const { orderId } = Route.useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ["my-order-delivery", orderId],
    queryFn: async () => {
      // RLS (orders_own_select / deliveries_own_select / couriers_client_select_assigned)
      // garantit qu'on ne peut lire cette commande, sa livraison et son
      // livreur que si elle appartient bien à l'utilisateur connecté —
      // aucun filtre côté client à ajouter, la base refuse déjà le reste.
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,reference,status,created_at,products(model,storage),deliveries(id,status,address,phone,scheduled_date,courier_assigned_at,couriers(full_name,phone,vehicle))",
        )
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const delivery = order?.deliveries?.[0];
  const courier = delivery?.couriers;
  const currentStep = delivery ? stepIndex(delivery.status) : 0;
  const failed = delivery?.status === "FAILED";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader />
      <main className="container-page max-w-2xl py-10">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Mon espace client
        </Link>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : !order ? (
          <div className="rounded-2xl border border-border/60 bg-card/60 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Commande introuvable, ou elle ne vous appartient pas.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="size-4" /> {order.reference}
              </p>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {order.products?.model ?? "iPad"} {order.products?.storage ?? ""}
              </h1>
              <p className="text-sm text-muted-foreground">
                Commandée le {formatDate(order.created_at)}
              </p>
            </div>

            {!delivery ? (
              <div className="rounded-2xl border border-border/60 bg-card/60 p-8 text-center">
                <Truck className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucune livraison n'est encore associée à cette commande.
                </p>
              </div>
            ) : (
              <>
                {/* Timeline */}
                <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
                  {failed ? (
                    <p className="text-sm font-medium text-destructive">
                      La dernière tentative de livraison a échoué. Notre équipe vous contactera pour
                      reprogrammer.
                    </p>
                  ) : (
                    <ol className="space-y-4">
                      {STEPS.map((step, i) => {
                        const reached = i <= currentStep;
                        return (
                          <li key={step.status} className="flex items-center gap-3">
                            <span
                              className={
                                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs " +
                                (reached
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground")
                              }
                            >
                              {reached ? <CheckCircle2 className="size-4" /> : i + 1}
                            </span>
                            <span
                              className={
                                reached ? "text-sm font-medium" : "text-sm text-muted-foreground"
                              }
                            >
                              {step.label}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>

                {/* Livreur */}
                <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Bike className="size-4 text-primary" /> Votre livreur
                  </h2>
                  {courier ? (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{courier.full_name}</p>
                        {courier.vehicle && (
                          <p className="text-xs text-muted-foreground">{courier.vehicle}</p>
                        )}
                        {delivery.courier_assigned_at && (
                          <p className="text-xs text-muted-foreground">
                            Assigné le {formatDate(delivery.courier_assigned_at)}
                          </p>
                        )}
                      </div>
                      <Button asChild size="sm">
                        <a href={`tel:${courier.phone}`}>
                          <Phone className="mr-1.5 size-3.5" /> Appeler
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Pas encore assigné. Vous serez notifié dès qu'un livreur prendra en charge
                      votre commande.
                    </p>
                  )}
                </div>

                {/* Adresse */}
                <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
                  <h2 className="mb-3 text-sm font-semibold">Adresse de livraison</h2>
                  <p className="text-sm">{delivery.address}</p>
                  <p className="text-sm text-muted-foreground">{delivery.phone}</p>
                </div>
              </>
            )}
          </div>
        )}
      </main>
      <MobileBottomNav />
      <SiteFooter />
    </div>
  );
}
