import { useEffect, useRef } from "react";

/**
 * Fond animé global — monté UNE SEULE FOIS à la racine (voir __root.tsx),
 * en position fixed : il couvre donc TOUTES les pages du site (avant, ça
 * n'était instancié que page par page, et coupé par le conteneur de chaque
 * page — d'où l'impression que "l'animation s'arrête après le hero").
 *
 * Les formes dérivent doucement en continu (comme avant), et suivent aussi
 * très légèrement la souris (effet de parallax discret : chaque blob a une
 * profondeur différente). Le mouvement est lissé avec un lerp + rAF plutôt
 * que d'appliquer la position brute à chaque `mousemove`, pour rester fluide
 * et ne jamais distraire de la lecture.
 *
 * Purement décoratif (pointer-events-none, aria-hidden).
 */
export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    // Respecte les personnes qui ont demandé moins d'animations.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onMouseMove(e: MouseEvent) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      target.current = { x: e.clientX / w - 0.5, y: e.clientY / h - 0.5 };
    }
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    function tick() {
      // Lerp simple pour un mouvement doux plutôt qu'un suivi instantané.
      current.current.x += (target.current.x - current.current.x) * 0.04;
      current.current.y += (target.current.y - current.current.y) * 0.04;
      const el = containerRef.current;
      if (el) {
        el.style.setProperty("--mx", String(current.current.x));
        el.style.setProperty("--my", String(current.current.y));
      }
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
      aria-hidden="true"
    >
      <div
        className="animate-blob-a absolute -left-24 -top-24 size-[28rem] rounded-full bg-primary/10 blur-3xl transition-transform duration-500 ease-out"
        style={{
          translate: "calc(var(--mx, 0) * 24px) calc(var(--my, 0) * 24px)",
        }}
      />
      <div
        className="animate-blob-b absolute -right-24 top-1/3 size-[32rem] rounded-full bg-primary/[0.07] blur-3xl transition-transform duration-500 ease-out"
        style={{
          translate: "calc(var(--mx, 0) * -32px) calc(var(--my, 0) * -32px)",
        }}
      />
      <div
        className="animate-blob-a absolute -bottom-32 left-1/4 size-[26rem] rounded-full bg-primary/[0.06] blur-3xl [animation-delay:6s] transition-transform duration-500 ease-out"
        style={{
          translate: "calc(var(--mx, 0) * 16px) calc(var(--my, 0) * 16px)",
        }}
      />
    </div>
  );
}
