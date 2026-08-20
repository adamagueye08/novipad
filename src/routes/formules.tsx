import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, PiggyBank, Users, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FormulaCards } from "@/components/site/FormulaCards";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const TITLE = "Cash, Flex ou Tontine — comment payer votre iPad | iPad Rythme";
const DESCRIPTION =
  "Comparez les trois formules d'achat : paiement Cash immédiat, épargne Flex à votre rythme, ou tontine encadrée entre membres.";

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

const DETAILS = [
  {
    icon: Wallet,
    title: "Cash",
    steps: [
      "Vous choisissez un iPad disponible en stock.",
      "Vous réglez la totalité par Wave, Orange Money ou carte.",
      "Une unité est réservée à votre nom immédiatement.",
      "Livraison ou retrait sous 24 à 72 heures.",
    ],
  },
  {
    icon: PiggyBank,
    title: "Flex",
    steps: [
      "Vous ouvrez un compte Flex sur l'iPad visé.",
      "Vous déposez librement, dès 5 000 FCFA par versement.",
      "Votre progression n'augmente qu'avec les dépôts validés.",
      "À 100 %, la commande est créée et l'appareil livré.",
    ],
  },
  {
    icon: Users,
    title: "Tontine",
    steps: [
      "Vous demandez l'adhésion à une tontine ouverte.",
      "L'équipe valide votre dossier et vous acceptez le règlement.",
      "Vous cotisez selon la fréquence annoncée.",
      "Les attributions suivent les règles publiées de la tontine.",
    ],
  },
];

const FAQ = [
  {
    q: "Puis-je changer de formule en cours de route ?",
    a: "Oui pour le Flex vers le Cash : votre épargne validée est déduite du solde restant. Le passage d'une tontine à une autre formule dépend du règlement de la tontine concernée.",
  },
  {
    q: "Que se passe-t-il si j'arrête mes dépôts Flex ?",
    a: "Votre solde reste enregistré. Vous pouvez reprendre à tout moment, ou demander une clôture ; les conditions de remboursement sont indiquées dans les réglages du compte.",
  },
  {
    q: "Les prix sont-ils différents selon la formule ?",
    a: "Oui. Chaque fiche produit affiche le prix Cash, Tontine et Flex : les formules échelonnées incluent des frais de gestion.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Wave, Orange Money et carte bancaire. Chaque paiement génère une référence traçable dans votre espace client.",
  },
];

function FormulasPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container-page py-14 md:py-20">
          <p className="text-sm font-semibold text-primary">Formules</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Trois façons d'obtenir votre iPad
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Le même appareil, le même contrôle qualité, la même garantie. Seule la manière de payer
            change.
          </p>
          <FormulaCards className="mt-10" />
        </section>

        <section className="container-page pb-16">
          <div className="grid gap-6 md:grid-cols-3">
            {DETAILS.map((d) => (
              <article key={d.title} className="glass rounded-3xl p-7">
                <d.icon className="h-5 w-5 text-primary" />
                <h2 className="mt-4 font-display text-xl font-semibold">{d.title}</h2>
                <ol className="mt-5 space-y-3 text-sm text-muted-foreground">
                  {d.steps.map((s, i) => (
                    <li key={s} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="container-page pb-20">
          <div className="glass rounded-3xl p-8 md:p-10">
            <h2 className="font-display text-2xl font-semibold">Ce qui est inclus dans tous les cas</h2>
            <ul className="mt-6 grid gap-3 text-sm md:grid-cols-2">
              {[
                "Appareil Apple importé et contrôlé à l'arrivée",
                "Garantie constructeur ou atelier selon le modèle",
                "Suivi des paiements dans votre espace client",
                "Livraison Dakar et régions, ou retrait en boutique",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero">
                <Link to="/catalogue">Voir le catalogue</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Créer mon compte
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container-page pb-24">
          <h2 className="font-display text-2xl font-semibold">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="mt-6">
            {FAQ.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
