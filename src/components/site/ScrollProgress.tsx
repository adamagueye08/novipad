import { useEffect, useRef } from "react";

/**
 * Barre de progression du scroll — fixée en haut (z-50), largeur (scaleX)
 * suit le pourcentage de défilement de la page. La transition CSS avec une
 * courbe "spring-like" (léger dépassement) donne l'effet ressort demandé,
 * sans dépendance à une librairie de physique.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function update() {
      const el = barRef.current;
      if (!el) return;
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = height > 0 ? Math.min(1, Math.max(0, scrollTop / height)) : 0;
      el.style.transform = `scaleX(${progress})`;
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent">
      <div
        ref={barRef}
        className="h-full origin-left"
        style={{
          background: "linear-gradient(90deg, var(--brand-cyan), var(--brand-amber))",
          transform: "scaleX(0)",
          transition: "transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
    </div>
  );
}
