/**
 * Fond animé discret pour les pages publiques et l'espace client — remplace
 * le blanc uni par quelques formes floues bleu/primaire qui dérivent très
 * lentement. Purement décoratif (pointer-events-none, aria-hidden) : ne gêne
 * jamais la lecture ni les clics, et reste dans les tons du thème bleu/blanc
 * existant (aucune couleur nouvelle introduite).
 *
 * À placer en premier enfant d'un conteneur avec `relative overflow-hidden`.
 */
export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="animate-blob-a absolute -left-24 -top-24 size-[28rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="animate-blob-b absolute -right-24 top-1/3 size-[32rem] rounded-full bg-primary/[0.07] blur-3xl" />
      <div className="animate-blob-a absolute -bottom-32 left-1/4 size-[26rem] rounded-full bg-primary/[0.06] blur-3xl [animation-delay:6s]" />
    </div>
  );
}
