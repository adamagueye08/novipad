import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import type { Story } from "@/lib/api";

const IMAGE_DURATION_MS = 5000;

/**
 * Bulles de stories (façon Instagram/Snapchat) en haut de la page d'accueil,
 * avec lecteur plein écran au clic. Uniquement des stories publiées par
 * l'équipe (vitrine boutique) — pas de story client.
 */
export function StoriesRow({ stories }: { stories: Story[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (stories.length === 0) return null;

  return (
    <>
      <div className="border-b border-border/60 bg-background/80 py-4 backdrop-blur">
        <div className="container-page flex gap-4 overflow-x-auto">
          {stories.map((story, i) => (
            <button
              key={story.id}
              onClick={() => setOpenIndex(i)}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <span className="rounded-full bg-gradient-to-tr from-primary via-orange-400 to-amber-300 p-[2px]">
                <span className="block size-16 overflow-hidden rounded-full border-2 border-background bg-muted">
                  {story.media_type === "IMAGE" ? (
                    <img src={story.media_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <video src={story.media_url} className="h-full w-full object-cover" muted />
                  )}
                </span>
              </span>
              <span className="max-w-[64px] truncate text-[11px] text-muted-foreground">
                {story.title ?? "Boutique"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {openIndex !== null && (
        <StoryViewer
          stories={stories}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}

function StoryViewer({
  stories,
  index,
  onIndexChange,
  onClose,
}: {
  stories: Story[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const story = stories[index];
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  function goNext() {
    if (index < stories.length - 1) onIndexChange(index + 1);
    else onClose();
  }
  function goPrev() {
    if (index > 0) onIndexChange(index - 1);
  }

  // Barre de progression : avance à date fixe pour une image, suit la
  // lecture réelle pour une vidéo.
  useEffect(() => {
    setProgress(0);
    if (!story) return;

    if (story.media_type === "IMAGE") {
      const start = Date.now();
      const timer = setInterval(() => {
        const pct = Math.min(100, ((Date.now() - start) / IMAGE_DURATION_MS) * 100);
        setProgress(pct);
        if (pct >= 100) {
          clearInterval(timer);
          goNext();
        }
      }, 50);
      return () => clearInterval(timer);
    }

    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };
    const onEnded = () => goNext();
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.play().catch(() => {});
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <div className="relative flex h-full w-full max-w-md flex-col">
        {/* Barres de progression */}
        <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
          {stories.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white transition-[width]"
                style={{ width: `${i < index ? 100 : i === index ? progress : 0}%` }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="absolute right-3 top-6 z-10 rounded-full bg-black/40 p-1.5 text-white"
          aria-label="Fermer"
        >
          <X className="size-5" />
        </button>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          {story.media_type === "IMAGE" ? (
            <img src={story.media_url} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              src={story.media_url}
              className="max-h-full max-w-full object-contain"
              playsInline
              autoPlay
            />
          )}

          {/* Zones tactiles gauche/droite pour naviguer */}
          <button
            onClick={goPrev}
            className="absolute inset-y-0 left-0 w-1/3"
            aria-label="Précédent"
          />
          <button
            onClick={goNext}
            className="absolute inset-y-0 right-0 w-1/3"
            aria-label="Suivant"
          />
        </div>

        <div className="flex items-center justify-between p-4">
          <div className="hidden text-white/70 sm:flex sm:gap-2">
            <button onClick={goPrev} disabled={index === 0} className="disabled:opacity-30">
              <ChevronLeft className="size-6" />
            </button>
            <button onClick={goNext} className="disabled:opacity-30">
              <ChevronRight className="size-6" />
            </button>
          </div>

          {story.product_id && story.products?.slug && (
            <Link
              to="/catalogue/$slug"
              params={{ slug: story.products.slug }}
              onClick={onClose}
              className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
            >
              <ShoppingBag className="size-4" /> Voir le produit
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
