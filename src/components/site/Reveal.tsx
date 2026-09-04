import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Enveloppe un contenu et le fait apparaître (fondu + légère translation)
 * quand il entre dans le viewport, via IntersectionObserver. `delay`
 * permet un effet de stagger simple en enchaînant plusieurs <Reveal>
 * avec des délais croissants (ex. 0, 80, 160ms). Respecte
 * prefers-reduced-motion (le contenu est affiché directement, sans
 * animation, si demandé).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "span";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entries]) => {
        if (entries?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <As
      ref={ref as never}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) blur(0px)" : "translateY(18px)",
        filter: visible ? "blur(0px)" : "blur(4px)",
        transition: `opacity 600ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 600ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, filter 600ms ease ${delay}ms`,
      }}
    >
      {children}
    </As>
  );
}
