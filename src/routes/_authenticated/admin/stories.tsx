import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Clapperboard, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import {
  adminStoriesFn,
  adminCreateStoryFn,
  adminSetStoryActiveFn,
  adminDeleteStoryFn,
  adminProductsFn,
} from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StoryMediaUploader } from "@/components/StoryMediaUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/stories")({
  head: () => ({
    meta: [{ title: "Stories — iPad Rythme" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminStoriesPage,
});

type StoryRow = {
  id: string;
  title: string | null;
  media_url: string;
  media_type: "IMAGE" | "VIDEO";
  product_id: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string;
  products: { model: string } | null;
};

type ProductOption = { id: string; model: string };

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() < Date.now();
}

function AdminStoriesPage() {
  const queryClient = useQueryClient();
  const fetchStories = useServerFn(adminStoriesFn);
  const fetchProducts = useServerFn(adminProductsFn);
  const createStory = useServerFn(adminCreateStoryFn);
  const setActive = useServerFn(adminSetStoryActiveFn);
  const remove = useServerFn(adminDeleteStoryFn);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-stories"],
    queryFn: () => fetchStories(),
  });
  const { data: productsData } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => fetchProducts(),
  });

  const stories = (data ?? []) as unknown as StoryRow[];
  const products = (productsData ?? []) as unknown as ProductOption[];

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [media, setMedia] = useState<{ url: string; type: "IMAGE" | "VIDEO" } | null>(null);
  const [productId, setProductId] = useState<string>("none");
  const [durationHours, setDurationHours] = useState("24");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setMedia(null);
    setProductId("none");
    setDurationHours("24");
  }

  async function onCreate() {
    if (!media) {
      toast.error("Ajoute une photo ou une vidéo.");
      return;
    }
    const hours = Number(durationHours);
    if (!hours || hours <= 0) {
      toast.error("Durée de vie invalide.");
      return;
    }
    setCreating(true);
    try {
      await createStory({
        data: {
          title: title.trim() || undefined,
          mediaUrl: media.url,
          mediaType: media.type,
          productId: productId === "none" ? undefined : productId,
          durationHours: hours,
        },
      });
      toast.success("Story publiée.");
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-stories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setCreating(false);
    }
  }

  async function onToggle(story: StoryRow) {
    setBusyId(story.id);
    try {
      await setActive({ data: { storyId: story.id, isActive: !story.is_active } });
      queryClient.invalidateQueries({ queryKey: ["admin-stories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(story: StoryRow) {
    setBusyId(story.id);
    try {
      await remove({ data: { storyId: story.id } });
      toast.success("Story supprimée.");
      queryClient.invalidateQueries({ queryKey: ["admin-stories"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Clapperboard className="size-5 text-primary" /> Stories
          </h1>
          <p className="text-sm text-muted-foreground">
            Vitrine boutique affichée en haut de la page d'accueil. Durée de vie personnalisée par
            story.
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" /> Nouvelle story
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle story</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <StoryMediaUploader
                mediaUrl={media?.url ?? null}
                mediaType={media?.type ?? null}
                onChange={setMedia}
              />
              <div>
                <Label htmlFor="story-title">Titre (optionnel)</Label>
                <Input
                  id="story-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. Nouveau stock !"
                  maxLength={100}
                />
              </div>
              <div>
                <Label>Produit lié (optionnel)</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="story-duration">Durée de vie (en heures)</Label>
                <Input
                  id="story-duration"
                  type="number"
                  min={1}
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  24h = comme Snapchat/WhatsApp. Mets ce que tu veux (ex. 72 pour 3 jours).
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={onCreate} disabled={creating}>
                {creating ? "Publication…" : "Publier"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : stories.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune story pour l'instant.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {stories.map((s) => {
            const expired = isExpired(s.expires_at);
            return (
              <div
                key={s.id}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/60"
              >
                <div className="aspect-[9/16] bg-muted">
                  {s.media_type === "IMAGE" ? (
                    <img src={s.media_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <video src={s.media_url} className="h-full w-full object-cover" muted />
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{s.title ?? "Sans titre"}</p>
                    <Badge variant={expired ? "secondary" : s.is_active ? "default" : "outline"}>
                      {expired ? "Expirée" : s.is_active ? "Active" : "Masquée"}
                    </Badge>
                  </div>
                  {s.products?.model && (
                    <p className="text-xs text-muted-foreground">Lié : {s.products.model}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Expire le {formatDate(s.expires_at)}
                  </p>
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === s.id || expired}
                      onClick={() => onToggle(s)}
                    >
                      {s.is_active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === s.id}
                      onClick={() => onDelete(s)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
