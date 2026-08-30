import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { adminSettingsFn, adminUpdateSettingFn } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/parametres")({
  head: () => ({
    meta: [{ title: "Paramètres — iPad Rythme" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSettingsPage,
});

type SettingRow = { key: string; value: Record<string, unknown>; updated_at: string };

type CompanyValue = {
  name: string;
  phone: string;
  email: string;
  address: string;
  logo_url: string | null;
};
type FlexValue = { min_deposit: number; cancellation_fee_percent: number };
type StockValue = { low_stock_threshold: number };
type DeliveryValue = { free_above: number; default_fee: number; zones: string[] };
type TermsValue = { general: string; flex: string; tontine: string };

function SettingCard({
  title,
  description,
  saving,
  onSave,
  children,
}: {
  title: string;
  description: string;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <div className="mt-4 grid gap-3">{children}</div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}

function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(adminSettingsFn);
  const updateSetting = useServerFn(adminUpdateSettingFn);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => fetchSettings(),
  });

  const rows = (data ?? []) as unknown as SettingRow[];
  const byKey = <T,>(key: string): T | undefined => rows.find((r) => r.key === key)?.value as T;

  const [company, setCompany] = useState<CompanyValue | null>(null);
  const [flex, setFlex] = useState<FlexValue | null>(null);
  const [stock, setStock] = useState<StockValue | null>(null);
  const [delivery, setDelivery] = useState<DeliveryValue | null>(null);
  const [zonesText, setZonesText] = useState("");
  const [terms, setTerms] = useState<TermsValue | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!rows.length) return;
    setCompany((c) => c ?? byKey<CompanyValue>("company") ?? null);
    setFlex((f) => f ?? byKey<FlexValue>("flex") ?? null);
    setStock((s) => s ?? byKey<StockValue>("stock") ?? null);
    const d = byKey<DeliveryValue>("delivery") ?? null;
    setDelivery((prev) => prev ?? d);
    setZonesText((prev) => prev || (d?.zones ?? []).join(", "));
    setTerms((t) => t ?? byKey<TermsValue>("terms") ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length]);

  async function save(key: "company" | "flex" | "stock" | "delivery" | "terms", value: object) {
    setSavingKey(key);
    try {
      await updateSetting({ data: { key, value } });
      toast.success("Paramètres enregistrés.");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setSavingKey(null);
    }
  }

  if (isLoading || !company || !flex || !stock || !delivery || !terms) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Settings className="size-5 text-primary" /> Paramètres
        </h1>
        <p className="text-sm text-muted-foreground">
          Réglages globaux — modifiables ici sans toucher au code.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SettingCard
          title="Entreprise"
          description="Identité affichée sur le site et dans les communications."
          saving={savingKey === "company"}
          onSave={() => save("company", company)}
        >
          <div>
            <Label>Nom</Label>
            <Input
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input
              value={company.phone}
              onChange={(e) => setCompany({ ...company, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={company.email}
              onChange={(e) => setCompany({ ...company, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Adresse</Label>
            <Input
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
            />
          </div>
        </SettingCard>

        <SettingCard
          title="Flex"
          description="Règles du dépôt libre et de l'annulation."
          saving={savingKey === "flex"}
          onSave={() => save("flex", flex)}
        >
          <div>
            <Label>Dépôt minimum (FCFA)</Label>
            <Input
              type="number"
              min={0}
              value={flex.min_deposit}
              onChange={(e) => setFlex({ ...flex, min_deposit: Number(e.target.value) })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Mis à 0 actuellement : le client dépose ce qu'il veut, sans minimum.
            </p>
          </div>
          <div>
            <Label>Frais d'annulation (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={flex.cancellation_fee_percent}
              onChange={(e) =>
                setFlex({ ...flex, cancellation_fee_percent: Number(e.target.value) })
              }
            />
          </div>
        </SettingCard>

        <SettingCard
          title="Stock"
          description="Seuil d'alerte de stock faible."
          saving={savingKey === "stock"}
          onSave={() => save("stock", stock)}
        >
          <div>
            <Label>Seuil de stock faible</Label>
            <Input
              type="number"
              min={0}
              value={stock.low_stock_threshold}
              onChange={(e) => setStock({ low_stock_threshold: Number(e.target.value) })}
            />
          </div>
        </SettingCard>

        <SettingCard
          title="Livraison"
          description="Frais de livraison et zones desservies."
          saving={savingKey === "delivery"}
          onSave={() =>
            save("delivery", {
              ...delivery,
              zones: zonesText
                .split(",")
                .map((z) => z.trim())
                .filter(Boolean),
            })
          }
        >
          <div>
            <Label>Livraison gratuite au-delà de (FCFA, 0 = jamais)</Label>
            <Input
              type="number"
              min={0}
              value={delivery.free_above}
              onChange={(e) => setDelivery({ ...delivery, free_above: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Frais de livraison par défaut (FCFA)</Label>
            <Input
              type="number"
              min={0}
              value={delivery.default_fee}
              onChange={(e) => setDelivery({ ...delivery, default_fee: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Zones desservies (séparées par des virgules)</Label>
            <Input value={zonesText} onChange={(e) => setZonesText(e.target.value)} />
          </div>
        </SettingCard>

        <SettingCard
          title="Conditions générales"
          description="Textes affichés aux clients pour chaque formule."
          saving={savingKey === "terms"}
          onSave={() => save("terms", terms)}
        >
          <div>
            <Label>Conditions générales de vente</Label>
            <Textarea
              rows={3}
              value={terms.general}
              onChange={(e) => setTerms({ ...terms, general: e.target.value })}
            />
          </div>
          <div>
            <Label>Conditions Flex</Label>
            <Textarea
              rows={3}
              value={terms.flex}
              onChange={(e) => setTerms({ ...terms, flex: e.target.value })}
            />
          </div>
          <div>
            <Label>Conditions Tontine</Label>
            <Textarea
              rows={3}
              value={terms.tontine}
              onChange={(e) => setTerms({ ...terms, tontine: e.target.value })}
            />
          </div>
        </SettingCard>
      </div>
    </div>
  );
}
