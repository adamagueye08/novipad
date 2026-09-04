import { Fragment } from "react";

/**
 * Bandeau de texte qui défile en boucle à l'infini. Le contenu est dupliqué
 * une fois (deux copies collées bout à bout) et l'animation CSS translate
 * exactement de -50% : au moment où la première copie sort de l'écran, la
 * seconde prend le relais au même endroit, sans coupure visible.
 */
export function Marquee({ items }: { items: string[] }) {
  return (
    <div className="glass overflow-hidden border-y border-border/60 py-3">
      <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
        {[0, 1].map((copy) => (
          <Fragment key={copy}>
            {items.map((item, i) => (
              <span
                key={`${copy}-${i}`}
                className="flex items-center gap-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {item}
                <span className="text-primary">◆</span>
              </span>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
