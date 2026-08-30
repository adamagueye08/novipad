import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 50;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

function slugifyFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "bin";
  const random = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${random}.${ext}`;
}

/**
 * Upload d'un unique média (photo ou vidéo courte) pour une story, vers le
 * bucket Supabase "stories-media". Contrairement à ImageUploader (plusieurs
 * photos produit), une story ne contient qu'un seul média à la fois.
 */
export function StoryMediaUploader({
  mediaUrl,
  mediaType,
  onChange,
}: {
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | null;
  onChange: (media: { url: string; type: "IMAGE" | "VIDEO" } | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Format non supporté (image JPEG/PNG/WEBP/GIF ou vidéo MP4/MOV/WEBM).");
      return;
    }
    const isVideo = file.type.startsWith("video/");
    const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`Fichier trop lourd (max ${maxMb} Mo).`);
      return;
    }

    setUploading(true);
    try {
      const path = slugifyFileName(file.name);
      const { error } = await supabase.storage
        .from("stories-media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        toast.error(`Échec de l'envoi : ${error.message}`);
        return;
      }
      const { data } = supabase.storage.from("stories-media").getPublicUrl(path);
      onChange({ url: data.publicUrl, type: isVideo ? "VIDEO" : "IMAGE" });
      toast.success("Média envoyé.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <Label>Photo ou vidéo</Label>

      {mediaUrl ? (
        <div className="relative mt-2 overflow-hidden rounded-xl border border-border/60">
          {mediaType === "VIDEO" ? (
            <video src={mediaUrl} className="max-h-64 w-full object-contain" controls />
          ) : (
            <img src={mediaUrl} alt="" className="max-h-64 w-full object-contain" />
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
            aria-label="Retirer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm transition ${
            dragOver ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Envoi en cours…</span>
            </>
          ) : (
            <>
              <Upload className="size-5 text-muted-foreground" />
              <span>
                Glisse un fichier ici, ou{" "}
                <span className="text-primary underline">clique pour choisir</span>
              </span>
              <span className="text-xs text-muted-foreground">
                Photo (max {MAX_IMAGE_MB} Mo) ou vidéo courte (max {MAX_VIDEO_MB} Mo)
              </span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
          />
        </div>
      )}
    </div>
  );
}
