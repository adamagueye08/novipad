/**
 * Découpe un texte en mots et les révèle un par un au montage (léger flou +
 * translation, décalage progressif) — pour les titres de hero, toujours
 * visibles dès le chargement (donc déclenché au montage, pas au scroll,
 * contrairement à <Reveal>).
 */
export function RevealWords({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="animate-word-in inline-block"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}
