import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Boxes, Pencil, Plus, X } from "lucide-react";
import { adminProductsFn, adminCreateProductFn, adminUpdateProductFn } from "@/lib/admin.functions";
import { ImageUploader } from "@/components/ImageUploader";
import { formatFcfa } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/produits")({
  head: () => ({
    meta: [{ title: "Produits & stock — JokkoTech" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminProductsPage,
});

type ProductRow = {
  id: string;
  slug: string;
  model: string;
  category: string;
  generation: string | null;
  storage: string | null;
  color: string | null;
  connectivity: string | null;
  condition: string | null;
  description: string | null;
  images: string[];
  specs: { label: string; value: string }[];
  warranty_months: number;
  purchase_cost_usd: number;
  shipping_cost_usd: number;
  price_cash: number;
  price_flex: number;
  price_tontine: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_demo: boolean;
};

type FormState = {
  model: string;
  slug: string;
  category: string;
  generation: string;
  storage: string;
  color: string;
  connectivity: string;
  condition: string;
  description: string;
  images: string[];
  specs: { label: string; value: string }[];
  warranty_months: string;
  purchase_cost_usd: string;
  shipping_cost_usd: string;
  price_cash: string;
  price_flex: string;
  price_tontine: string;
  stock_quantity: string;
  low_stock_threshold: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  model: "",
  slug: "",
  category: "iPad",
  generation: "",
  storage: "",
  color: "",
  connectivity: "",
  condition: "Neuf",
  description: "",
  images: [],
  specs: [],
  warranty_months: "12",
  purchase_cost_usd: "0",
  shipping_cost_usd: "0",
  price_cash: "0",
  price_flex: "0",
  price_tontine: "0",
  stock_quantity: "0",
  low_stock_threshold: "3",
  is_active: true,
};

function productToForm(p: ProductRow): FormState {
  return {
    model: p.model,
    slug: p.slug,
    category: p.category || "iPad",
    generation: p.generation ?? "",
    storage: p.storage ?? "",
    color: p.color ?? "",
    connectivity: p.connectivity ?? "",
    condition: p.condition ?? "",
    description: p.description ?? "",
    images: p.images ?? [],
    specs: Array.isArray(p.specs) ? p.specs : [],
    warranty_months: String(p.warranty_months ?? 0),
    purchase_cost_usd: String(p.purchase_cost_usd ?? 0),
    shipping_cost_usd: String(p.shipping_cost_usd ?? 0),
    price_cash: String(p.price_cash ?? 0),
    price_flex: String(p.price_flex ?? 0),
    price_tontine: String(p.price_tontine ?? 0),
    stock_quantity: String(p.stock_quantity ?? 0),
    low_stock_threshold: String(p.low_stock_threshold ?? 0),
    is_active: p.is_active,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildPayload(form: FormState) {
  return {
    model: form.model.trim(),
    slug: form.slug.trim() || slugify(form.model),
    category: form.category.trim() || "Autre",
    generation: form.generation.trim() || null,
    storage: form.storage.trim() || null,
    color: form.color.trim() || null,
    connectivity: form.connectivity.trim() || null,
    condition: form.condition.trim() || null,
    description: form.description.trim() || null,
    images: form.images,
    specs: form.specs.filter((s) => s.label.trim() && s.value.trim()),
    warranty_months: Number(form.warranty_months) || 0,
    purchase_cost_usd: Number(form.purchase_cost_usd) || 0,
    shipping_cost_usd: Number(form.shipping_cost_usd) || 0,
    price_cash: Number(form.price_cash) || 0,
    price_flex: Number(form.price_flex) || 0,
    price_tontine: Number(form.price_tontine) || 0,
    stock_quantity: Number(form.stock_quantity) || 0,
    low_stock_threshold: Number(form.low_stock_threshold) || 0,
    is_active: form.is_active,
  };
}

function SpecsEditor({
  specs,
  onChange,
}: {
  specs: { label: string; value: string }[];
  onChange: (specs: { label: string; value: string }[]) => void;
}) {
  function updateRow(i: number, patch: Partial<{ label: string; value: string }>) {
    onChange(specs.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeRow(i: number) {
    onChange(specs.filter((_, idx) => idx !== i));
  }
  function addRow() {
    onChange([...specs, { label: "", value: "" }]);
  }

  return (
    <div className="sm:col-span-2">
      <Label>Caractéristiques</Label>
      <p className="mb-2 text-xs text-muted-foreground">
        Libre, pour n'importe quel type de produit — ex. « RAM » / « 16 Go », « Taille d'écran » / «
        55 pouces ».
      </p>
      <div className="space-y-2">
        {specs.map((s, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={s.label}
              onChange={(e) => updateRow(i, { label: e.target.value })}
              placeholder="Caractéristique (ex. RAM)"
              className="flex-1"
            />
            <Input
              value={s.value}
              onChange={(e) => updateRow(i, { value: e.target.value })}
              placeholder="Valeur (ex. 16 Go)"
              className="flex-1"
            />
            <Button type="button" variant="outline" size="icon" onClick={() => removeRow(i)}>
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addRow}>
        <Plus className="mr-1 size-3.5" /> Ajouter une caractéristique
      </Button>
    </div>
  );
}

function ProductForm({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="model">Nom du produit *</Label>
        <Input
          id="model"
          value={form.model}
          onChange={(e) => {
            const model = e.target.value;
            onChange({ model, slug: form.slug ? form.slug : slugify(model) });
          }}
          placeholder="iPad 11e génération, PC portable HP 15, Téléviseur Samsung 55..."
        />
      </div>
      <div>
        <Label htmlFor="slug">Slug (URL) *</Label>
        <Input
          id="slug"
          value={form.slug}
          onChange={(e) => onChange({ slug: slugify(e.target.value) })}
          placeholder="ipad-11e-generation"
        />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="category">Type de produit *</Label>
        <Input
          id="category"
          list="category-suggestions"
          value={form.category}
          onChange={(e) => onChange({ category: e.target.value })}
          placeholder="iPad, Ordinateur, Télévision, Smartphone…"
        />
        <datalist id="category-suggestions">
          <option value="iPad" />
          <option value="Ordinateur" />
          <option value="Télévision" />
          <option value="Smartphone" />
          <option value="Accessoire" />
          <option value="Autre" />
        </datalist>
        <p className="mt-1 text-xs text-muted-foreground">
          Libre — utilisé pour filtrer le catalogue par type de produit.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border/60 p-3 sm:col-span-2">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Champs spécifiques iPad — optionnels, laisse vide pour un autre type de produit
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="generation">Génération</Label>
            <Input
              id="generation"
              value={form.generation}
              onChange={(e) => onChange({ generation: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="storage">Stockage</Label>
            <Input
              id="storage"
              value={form.storage}
              onChange={(e) => onChange({ storage: e.target.value })}
              placeholder="128 Go"
            />
          </div>
          <div>
            <Label htmlFor="connectivity">Connectivité</Label>
            <Input
              id="connectivity"
              value={form.connectivity}
              onChange={(e) => onChange({ connectivity: e.target.value })}
              placeholder="Wi-Fi ou Wi-Fi + Cellular"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="color">Couleur</Label>
        <Input
          id="color"
          value={form.color}
          onChange={(e) => onChange({ color: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="condition">État</Label>
        <Input
          id="condition"
          value={form.condition}
          onChange={(e) => onChange({ condition: e.target.value })}
          placeholder="Neuf"
        />
      </div>
      <div>
        <Label htmlFor="warranty">Garantie (mois)</Label>
        <Input
          id="warranty"
          type="number"
          min={0}
          value={form.warranty_months}
          onChange={(e) => onChange({ warranty_months: e.target.value })}
        />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <SpecsEditor specs={form.specs} onChange={(specs) => onChange({ specs })} />

      <ImageUploader images={form.images} onChange={(images) => onChange({ images })} />

      <div className="rounded-xl border border-dashed border-border/60 p-3 sm:col-span-2">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Coûts internes — jamais affichés côté client
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="purchase_cost">Coût fournisseur (USD)</Label>
            <Input
              id="purchase_cost"
              type="number"
              min={0}
              value={form.purchase_cost_usd}
              onChange={(e) => onChange({ purchase_cost_usd: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="shipping_cost">Transport (USD)</Label>
            <Input
              id="shipping_cost"
              type="number"
              min={0}
              value={form.shipping_cost_usd}
              onChange={(e) => onChange({ shipping_cost_usd: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="price_cash">Prix Cash (FCFA)</Label>
        <Input
          id="price_cash"
          type="number"
          min={0}
          value={form.price_cash}
          onChange={(e) => onChange({ price_cash: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="price_flex">Prix Flex (FCFA)</Label>
        <Input
          id="price_flex"
          type="number"
          min={0}
          value={form.price_flex}
          onChange={(e) => onChange({ price_flex: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="price_tontine">Prix Tontine (FCFA)</Label>
        <Input
          id="price_tontine"
          type="number"
          min={0}
          value={form.price_tontine}
          onChange={(e) => onChange({ price_tontine: e.target.value })}
        />
      </div>
      <div />

      <div>
        <Label htmlFor="stock">Stock disponible</Label>
        <Input
          id="stock"
          type="number"
          min={0}
          value={form.stock_quantity}
          onChange={(e) => onChange({ stock_quantity: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="low_stock">Seuil de stock faible</Label>
        <Input
          id="low_stock"
          type="number"
          min={0}
          value={form.low_stock_threshold}
          onChange={(e) => onChange({ low_stock_threshold: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-3 sm:col-span-2">
        <Switch
          checked={form.is_active}
          onCheckedChange={(checked) => onChange({ is_active: checked })}
        />
        <span className="text-sm">Produit actif (visible dans le catalogue)</span>
      </div>
    </div>
  );
}

function AdminProductsPage() {
  const queryClient = useQueryClient();
  const fetchProducts = useServerFn(adminProductsFn);
  const createProduct = useServerFn(adminCreateProductFn);
  const updateProduct = useServerFn(adminUpdateProductFn);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => fetchProducts(),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const products = (data ?? []) as unknown as ProductRow[];

  async function onCreate() {
    if (!createForm.model.trim()) {
      toast.error("Le modèle est obligatoire.");
      return;
    }
    setCreating(true);
    try {
      await createProduct({ data: { product: buildPayload(createForm) } });
      toast.success("Produit créé.");
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setCreating(false);
    }
  }

  async function onSaveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      await updateProduct({
        data: { productId: editing.id, patch: buildPayload(editForm) },
      });
      toast.success("Produit mis à jour.");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: ProductRow) {
    try {
      await updateProduct({ data: { productId: p.id, patch: { is_active: !p.is_active } } });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Boxes className="size-5 text-primary" /> Produits & stock
          </h1>
          <p className="text-sm text-muted-foreground">
            Catalogue des iPad, prix par formule et niveaux de stock.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setCreateForm(EMPTY_FORM)}>
              <Plus className="mr-2 size-4" /> Ajouter un iPad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau produit</DialogTitle>
            </DialogHeader>
            <ProductForm
              form={createForm}
              onChange={(patch) => setCreateForm((f) => ({ ...f, ...patch }))}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={onCreate} disabled={creating}>
                {creating ? "Création…" : "Créer le produit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modèle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Cash</TableHead>
              <TableHead>Flex</TableHead>
              <TableHead>Tontine</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Aucun produit. Ajoute ton premier produit, quel que soit son type.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.model}</div>
                    <div className="text-xs text-muted-foreground">
                      {[p.storage, p.color].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.category || "—"}</Badge>
                  </TableCell>
                  <TableCell>{formatFcfa(p.price_cash)}</TableCell>
                  <TableCell>{formatFcfa(p.price_flex)}</TableCell>
                  <TableCell>{formatFcfa(p.price_tontine)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        p.stock_quantity <= p.low_stock_threshold
                          ? "font-semibold text-destructive"
                          : ""
                      }
                    >
                      {p.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggleActive(p)}>
                      <Badge variant={p.is_active ? "default" : "secondary"}>
                        {p.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(p);
                        setEditForm(productToForm(p));
                      }}
                    >
                      <Pencil className="mr-1 size-3.5" /> Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier {editing?.model}</DialogTitle>
          </DialogHeader>
          <ProductForm
            form={editForm}
            onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button onClick={onSaveEdit} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
