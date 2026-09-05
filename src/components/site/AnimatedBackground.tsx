import { useEffect, useMemo, useRef } from "react";

/**
 * Fond animé global — monté UNE SEULE FOIS à la racine (voir __root.tsx),
 * en position fixed : il couvre donc TOUTES les pages du site.
 *
 * Couches (du fond vers l'avant) :
 * 1. Trois nappes de couleur floues (turquoise → ambré) qui dérivent
 *    lentement en boucle, avec un léger effet de parallax au mouvement
 *    de la souris (profondeur différente par nappe).
 * 2. Une grille en perspective ("sol 3D") en bas de l'écran.
 * 3. Quelques particules lumineuses qui montent et s'estompent en boucle.
 * 4. Un voile radial qui assombrit les bords + un grain subtil.
 *
 * Purement décoratif (pointer-events-none, aria-hidden). Respecte
 * prefers-reduced-motion : toutes les animations sont coupées si demandé.
 *
 * Perf : pas de boucle requestAnimationFrame qui tournerait en continu
 * (coûteux en CPU/batterie sur toute la durée de vie du site, sur
 * n'importe quelle page). La position ne se met à jour QUE sur un vrai
 * mousemove, et légèrement limitée dans le temps (throttle) — le
 * lissage visuel vient simplement de la transition CSS déjà posée sur
 * chaque nappe (transition-transform), pas d'un lerp recalculé à 60fps.
 */
export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpdate = useRef(0);

  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 1000) / 10, // 0–100%
        duration: 9 + Math.random() * 10, // 9–19s
        delay: Math.random() * -18, // démarrages désynchronisés
        size: 1 + Math.round(Math.random() * 2), // 1–3px
      })),
    [],
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onMouseMove(e: MouseEvent) {
      const now = performance.now();
      if (now - lastUpdate.current < 60) return; // ~16fps suffit pour un effet de parallax discret
      lastUpdate.current = now;
      const el = containerRef.current;
      if (!el) return;
      el.style.setProperty("--mx", String(e.clientX / window.innerWidth - 0.5));
      el.style.setProperty("--my", String(e.clientY / window.innerHeight - 0.5));
    }
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
      aria-hidden="true"
    >
      {/* Nappes de couleur turquoise → ambré */}
      <div
        className="animate-blob-a absolute -left-24 -top-24 size-[30rem] rounded-full opacity-45 blur-[100px] transition-transform duration-500 ease-out"
        style={{
          background:
            "radial-gradient(circle, var(--brand-cyan) 0%, var(--brand-amber) 70%, transparent 100%)",
          translate: "calc(var(--mx, 0) * 24px) calc(var(--my, 0) * 24px)",
        }}
      />
      <div
        className="animate-blob-b absolute -right-24 top-1/3 size-[34rem] rounded-full opacity-40 blur-[110px] transition-transform duration-500 ease-out"
        style={{
          background:
            "radial-gradient(circle, var(--brand-amber) 0%, var(--brand-cyan) 70%, transparent 100%)",
          translate: "calc(var(--mx, 0) * -32px) calc(var(--my, 0) * -32px)",
        }}
      />
      <div
        className="animate-blob-a absolute -bottom-32 left-1/4 size-[28rem] rounded-full opacity-40 blur-[100px] [animation-delay:6s] transition-transform duration-500 ease-out"
        style={{
          background:
            "radial-gradient(circle, var(--brand-cyan) 0%, var(--brand-amber) 70%, transparent 100%)",
          translate: "calc(var(--mx, 0) * 16px) calc(var(--my, 0) * 16px)",
        }}
      />

      {/* Sol 3D en perspective, bas de l'écran */}
      <div
        className="absolute inset-x-0 bottom-0 h-[40vh] opacity-[0.12]"
        style={{ perspective: "600px" }}
      >
        <div
          className="h-full w-full"
          style={{
            transform: "rotateX(72deg)",
            transformOrigin: "bottom",
            backgroundImage:
              "linear-gradient(var(--brand-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--brand-cyan) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Particules lumineuses */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="animate-particle-rise absolute bottom-0 rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: "var(--brand-cyan)",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Voile radial (assombrit les bords) + grain */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 40%, transparent 40%, oklch(0.13 0.03 260 / 65%) 100%)",
        }}
      />
      <div className="bg-grain absolute inset-0 opacity-[0.05] mix-blend-overlay" />
    </div>
  );
}
