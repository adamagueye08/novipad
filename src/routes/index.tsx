import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Wallet,
  Users,
  ShieldCheck,
  Truck,
  Sparkles,
  Check,
} from "lucide-react";
import heroIpad from "@/assets/hero-ipad.png";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { AnimatedBackground } from "@/components/site/AnimatedBackground";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard } from "@/components/site/ProductCard";
import { FormulaCards } from "@/components/site/FormulaCards";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { productsQuery, storiesQuery } from "@/lib/api";
import { StoriesRow } from "@/components/site/StoriesRow";

const TITLE = "JokkoTech — Votre iPad Apple au paiement qui vous correspond";
const DESCRIPTION =
  "Achetez votre iPad Apple importé des États-Unis au comptant, en épargne Flex ou en tontine encadrée. Paiement Wave, Orange Money et carte bancaire.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Landing,
});

const WHY = [
  {
    icon: BadgeCheck,
    title: "iPad testés et garantis",
    text: "Chaque iPad est importé des États-Unis, contrôlé à l'arrivée et livré avec garantie.",
  },
  {
    icon: Wallet,
    title: "Trois façons de payer",
    text: "Comptant, épargne progressive Flex ou tontine encadrée : vous choisissez votre rythme.",
  },
  {
    icon: ShieldCheck,
    title: "Paiements vérifiés",
    text: "Chaque transaction est confirmée côté serveur avant toute mise à jour de votre solde.",
  },
  {
    icon: Truck,
    title: "Livraison suivie",
    text: "Préparation, expédition et livraison suivies étape par étape depuis votre espace client.",
  },
];

const STEPS = [
  {
    n: "01",
    t: "Choisissez votre iPad",
    d: "Modèle, stockage, couleur et connectivité dans le catalogue.",
  },
  {
    n: "02",
    t: "Choisissez votre formule",
    d: "Cash, Flex ou Tontine, avec les conditions affichées clairement.",
  },
  {
    n: "03",
    t: "Payez en sécurité",
    d: "Wave, Orange Money ou carte bancaire, confirmation côté serveur.",
  },
  {
    n: "04",
    t: "Recevez votre iPad",
    d: "Suivi de préparation et de livraison dans votre espace client.",
  },
];

const FAQ = [
  {
    q: "Quelle est la différence entre Flex et Tontine ?",
    a: "Le Flex est un objectif d'épargne individuel : vous déposez librement jusqu'à atteindre 100 % du montant. La Tontine est un groupe encadré par notre équipe, avec des cotisations régulières et des règles d'attribution.",
  },
  {
    q: "Puis-je rejoindre une tontine immédiatement ?",
    a: "Non. Vous envoyez une demande d'adhésion, acceptez les conditions, puis notre équipe valide ou refuse votre demande avant que vous deveniez membre.",
  },
  {
    q: "Quand mon iPad est-il livré en formule Flex ?",
    a: "L'iPad est préparé et livré uniquement lorsque 100 % du montant de votre objectif est payé.",
  },
  {
    q: "Puis-je annuler un Flex en cours ?",
    a: "Oui, vous pouvez envoyer une demande d'annulation. Le montant remboursable et les éventuels frais sont affichés avant l'envoi, et l'administration traite la demande.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Wave, Orange Money et cartes bancaires, via notre prestataire de paiement sécurisé.",
  },
];

const TESTIMONIALS = [
  {
    name: "Awa D.",
    role: "Étudiante, Dakar",
    text: "J'ai payé mon iPad en trois mois avec le Flex. Voir la barre de progression avancer m'a beaucoup motivée.",
  },
  {
    name: "Mamadou S.",
    role: "Graphiste",
    text: "Formule Cash, commande le matin, iPad livré le lendemain. Tout était suivi depuis mon compte.",
  },
  {
    name: "Fatou N.",
    role: "Enseignante",
    text: "La tontine est bien encadrée : cotisations claires, rappels automatiques et attribution transparente.",
  },
];

function Landing() {
  const { data: products = [], isLoading } = useQuery(productsQuery());
  const { data: stories = [] } = useQuery(storiesQuery());
  const featured = products.slice(0, 3);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <AnimatedBackground />
      <SiteHeader />
      <StoriesRow stories={stories} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <div className="container-page grid items-center gap-12 py-16 md:grid-cols-2 md:py-28">
          <div className="animate-rise">
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> iPad Apple importés des États-Unis
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
              Votre iPad,
              <br />
              <span className="text-gradient">sans compromis.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
              Cash, Flex ou Tontine — choisissez comment payer. Livraison suivie, paiement sécurisé,
              tout géré depuis votre espace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="xl">
                <Link to="/catalogue">
                  Choisir mon iPad <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to="/formules">Découvrir les formules</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-3">
              {[
                { k: "Garantie", v: "6 mois" },
                { k: "Dépôt Flex", v: "Libre" },
                { k: "Paiement", v: "Wave · OM" },
              ].map((s) => (
                <div key={s.k} className="glass rounded-2xl px-3 py-3">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {s.k}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative flex justify-center [perspective:1200px]">
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
            <img
              src={heroIpad}
              alt="iPad Apple argent vu de face et de dos"
              width={1200}
              height={1200}
              className="w-[86%] max-w-md animate-tilt drop-shadow-2xl [transform-style:preserve-3d]"
            />
          </div>
        </div>
      </section>

      {/* FORMULES */}
      <section id="formules" className="section bg-subtle">
        <div className="container-page">
          <header className="max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">Trois formules, un seul iPad</h2>
            <p className="mt-3 text-muted-foreground">
              Les prix sont gérés depuis notre back-office et mis à jour en temps réel.
            </p>
          </header>
          <FormulaCards className="mt-10" />
        </div>
      </section>

      {/* POURQUOI NOUS */}
      <section className="section">
        <div className="container-page">
          <h2 className="max-w-xl text-3xl font-bold sm:text-4xl">Pourquoi nous choisir</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((item) => (
              <article key={item.title} className="glass hover-lift rounded-3xl p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NOS IPAD */}
      <section className="section bg-subtle">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">Nos iPad</h2>
              <p className="mt-3 max-w-lg text-muted-foreground">
                Une sélection contrôlée, avec les prix Cash, Tontine et Flex affichés pour chaque
                modèle.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/catalogue">
                Voir tout le catalogue <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass h-80 animate-pulse rounded-3xl" />
                ))
              : featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {!isLoading && featured.length === 0 && (
            <p className="mt-10 text-sm text-muted-foreground">
              Aucun iPad publié pour le moment. Revenez très bientôt.
            </p>
          )}
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section className="section">
        <div className="container-page">
          <h2 className="text-3xl font-bold sm:text-4xl">Comment ça marche</h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="glass rounded-3xl p-6">
                <span className="font-display text-2xl font-bold text-gradient">{s.n}</span>
                <h3 className="mt-4 text-base font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PAIEMENTS SECURISES */}
      <section className="section bg-subtle">
        <div className="container-page glass grid gap-8 rounded-4xl p-8 md:grid-cols-2 md:p-12">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-flex text-primary-foreground">
              <CreditCard className="h-5 w-5" />
            </span>
            <h2 className="mt-6 text-3xl font-bold">Paiements sécurisés</h2>
            <p className="mt-3 text-muted-foreground">
              Wave, Orange Money et carte bancaire. Aucun paiement n'est considéré comme réussi sans
              confirmation vérifiée côté serveur : vos soldes ne bougent qu'après validation.
            </p>
          </div>
          <ul className="grid gap-3 self-center">
            {[
              "Confirmation serveur obligatoire",
              "Historique complet de vos paiements",
              "Reçus et références de transaction",
              "Aucun solde modifiable par le client",
            ].map((li) => (
              <li
                key={li}
                className="flex items-center gap-3 rounded-2xl bg-card/70 px-4 py-3 text-sm"
              >
                <Check className="h-4 w-4 text-success" /> {li}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TEMOIGNAGES */}
      <section className="section">
        <div className="container-page">
          <h2 className="text-3xl font-bold sm:text-4xl">Ils nous font confiance</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="glass hover-lift rounded-3xl p-6">
                <blockquote className="text-sm leading-relaxed text-foreground/85">
                  “{t.text}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                    {t.name.slice(0, 1)}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-subtle">
        <div className="container-page max-w-3xl">
          <h2 className="text-3xl font-bold sm:text-4xl">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQ.map((item, i) => (
              <AccordionItem key={item.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm font-semibold">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-4xl bg-gradient-primary px-8 py-14 text-center text-primary-foreground shadow-glow md:px-16">
            <Users className="mx-auto h-10 w-10 opacity-80" />
            <h2 className="mt-6 text-3xl font-bold sm:text-4xl">Prêt à commencer ?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm opacity-90 sm:text-base">
              Créez votre compte, choisissez votre iPad et démarrez la formule qui correspond à
              votre budget.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="glass" size="xl">
                <Link to="/catalogue">Choisir mon iPad</Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to="/auth">Créer mon compte</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
