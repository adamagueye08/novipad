import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FormulaCards } from "@/components/site/FormulaCards";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TITLE = "Cash, Flex ou Tontine — Choisir sa formule | iPad Rythme";
const DESCRIPTION =
  "Comparez les trois façons d'obtenir votre iPad : paiement comptant, épargne progressive Flex ou tontine encadrée entre membres.";

export const Route = createFileRoute("/formules")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: FormulasPage,
});

const STEPS = {
  Cash: [
    "Vous choisissez votre iPad dans le catalogue.",
    "Vous payez la totalité par Wave, Orange Money ou carte.",
    "Une unité est réservée à votre nom dès la confirmation du paiement.",
    "Préparation, expédition puis livraison suivies dans votre espace.",
  ],
  Flex: [
    "Vous ouvrez un compte Flex sur l'iPad visé.",
    "Vous déposez librement, à partir de 5 000 FCFA.",
    "Votre progression est recalculée après chaque paiement confirmé.",
    "À 100 %, la commande est créée et votre iPad est livré.",
  ],
  Tontine: [
    "Vous demandez à rejoindre une tontine ouverte.",
    "L'équipe valide votre adhésion et les conditions acceptées.",
    "Vous cotisez selon la fréquence du groupe, avec rappels et suivi.",
    "Les iPad sont attribués selon les règles affichées de la tontine.",
  ],
};

function FormulasPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-page py-12 md:py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Trois formules, un seul objectif</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Le prix affiché dépend de la formule choisie. Tous les montants viennent directement de notre base de
          données, sans surprise à la commande.
        </p>

        <FormulaCards className="mt-10" />

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {Object.entries(STEPS).map(([name, steps]) => (
            <article key={name} className="glass rounded-3xl p-7">
              <h2 className="font-display text-xl font-semibold">Comment marche le {name} ?</h2>
              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                {steps.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </section>

        <section className="glass mt-16 rounded-4xl p-8 md:p-12">
          <h2 className="font-display text-2xl font-semibold">Ce qui est garanti dans tous les cas</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "iPad importé des États-Unis, testé à l'arrivée",
              "Garantie constructeur ou boutique selon le modèle",
              "Paiement confirmé côté serveur avant tout crédit",
              "Historique complet de vos paiements et livraisons",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero">
              <Link to="/catalogue">Voir les iPad disponibles</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/tontines">Explorer les tontines</Link>
            </Button>
          </div>
        </section>

        <section className="mt-16 max-w-3xl">
          <h2 className="font-display text-2xl font-semibold">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="mt-5">
            <AccordionItem value="1">
              <AccordionTrigger>Puis-je changer de formule en cours de route ?</AccordionTrigger>
              <AccordionContent>
                Oui. Contactez l'équipe depuis votre espace client : le solde déjà versé est repris dans la nouvelle
                formule selon les conditions en vigueur.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>Que se passe-t-il si j'annule un compte Flex ?</AccordionTrigger>
              <AccordionContent>
                Vous adressez une demande d'annulation. Après examen, le montant remboursable est calculé, frais
                éventuels déduits, ou conservé en crédit sur votre compte.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>Les cotisations de tontine sont-elles obligatoires ?</AccordionTrigger>
              <AccordionContent>
                Oui, elles suivent la fréquence du groupe. Les retards sont comptabilisés et peuvent affecter l'ordre
                d'attribution des iPad.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
