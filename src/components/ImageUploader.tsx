import { useRef, useState } from "react";
import { toast } from "sonner";
import { X, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

const MAX_FILE_SIZE_MB = 8;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function slugifyFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "jpg";
  const random = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${random}.${ext}`;
}

/**
 * Upload direct vers Supabase Storage (bucket "product-images"), utilisable
 * depuis un ordinateur (glisser-déposer ou clic) ou un smartphone (l'attribut
 * `capture` propose directement l'appareil photo en plus de la galerie).
 */
export function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    const valid = list.filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast.error(`${f.name} : format non supporté (JPEG, PNG, WEBP ou GIF uniquement).`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`${f.name} : trop lourd (max ${MAX_FILE_SIZE_MB} Mo).`);
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;

    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of valid) {
        const path = slugifyFileName(file.name);
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) {
          toast.error(`Échec de l'envoi de ${file.name} : ${error.message}`);
          continue;
        }
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length > 0) {
        onChange([...images, ...uploaded]);
        toast.success(
          `${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} ajoutée${uploaded.length > 1 ? "s" : ""}.`,
        );
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    onChange(images.filter((i) => i !== url));
  }

  return (
    <div className="sm:col-span-2">
      <Label>Photos</Label>

      {images.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border/60"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Retirer cette photo"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
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
              Glisse des photos ici, ou{" "}
              <span className="text-primary underline">clique pour choisir</span>
            </span>
            <span className="text-xs text-muted-foreground">
              Depuis ton ordinateur ou ton téléphone (galerie ou appareil photo) — JPEG/PNG/WEBP,{" "}
              {MAX_FILE_SIZE_MB} Mo max
            </span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
