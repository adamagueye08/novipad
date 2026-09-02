import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type Client = SupabaseClient<Database>;

/** Vérifie côté serveur, avec le client RLS de l'appelant, qu'il fait partie du staff. */
export async function ensureStaff(client: Client, userId: string) {
  const { data, error } = await client.rpc("is_staff", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Accès refusé: réservé à l'équipe interne.");
  return true;
}

export async function ensureRole(client: Client, userId: string, role: AppRole) {
  const { data, error } = await client.rpc("has_role", { _user_id: userId, _role: role });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function logAudit(input: {
  actorId: string;
  action: string;
  entityType?: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    old_value: (input.oldValue ?? null) as never,
    new_value: (input.newValue ?? null) as never,
  });
}

export async function getMyRoles(client: Client, userId: string) {
  const { data, error } = await client.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.role as AppRole);
}

export async function getOverview() {
  const [orders, payments, flex, members, products, users] = await Promise.all([
    supabaseAdmin.from("orders").select("id,status,amount,formula,created_at"),
    supabaseAdmin.from("payments").select("id,status,amount,created_at,payment_method"),
    supabaseAdmin.from("flex_accounts").select("id,status,paid_amount,target_amount"),
    supabaseAdmin.from("tontine_members").select("id,status"),
    supabaseAdmin.from("products").select("id,model,stock_quantity,low_stock_threshold,is_active"),
    supabaseAdmin.from("profiles").select("id,created_at,status"),
  ]);

  const orderRows = orders.data ?? [];
  const paymentRows = payments.data ?? [];
  const flexRows = flex.data ?? [];
  const memberRows = members.data ?? [];
  const productRows = products.data ?? [];

  const revenue = paymentRows
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const byMonth = new Map<string, number>();
  for (const p of paymentRows) {
    if (p.status !== "SUCCESS") continue;
    const key = String(p.created_at).slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(p.amount));
  }

  const formulaSplit = { CASH: 0, FLEX: 0, TONTINE: 0 } as Record<string, number>;
  for (const o of orderRows) formulaSplit[o.formula] = (formulaSplit[o.formula] ?? 0) + 1;

  return {
    revenue,
    pendingPayments: paymentRows.filter((p) => p.status === "PENDING").length,
    ordersTotal: orderRows.length,
    ordersPending: orderRows.filter((o) =>
      ["PENDING", "PAID", "CONFIRMED", "PREPARING"].includes(o.status),
    ).length,
    flexActive: flexRows.filter((f) => f.status === "ACTIVE").length,
    flexSaved: flexRows.reduce((s, f) => s + Number(f.paid_amount), 0),
    membersPending: memberRows.filter((m) => m.status === "PENDING").length,
    membersActive: memberRows.filter((m) => ["APPROVED", "ACTIVE"].includes(m.status)).length,
    clients: (users.data ?? []).length,
    stockTotal: productRows.reduce((s, p) => s + Number(p.stock_quantity), 0),
    lowStock: productRows
      .filter((p) => Number(p.stock_quantity) <= Number(p.low_stock_threshold))
      .map((p) => ({ id: p.id, model: p.model, stock: Number(p.stock_quantity) })),
    revenueByMonth: [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount })),
    formulaSplit,
  };
}

export async function listOrders() {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id,reference,status,formula,amount,created_at,user_id,products(model),profiles:user_id(first_name,last_name,phone,email),deliveries(id,status,address,phone,courier_id,couriers(id,full_name,phone))",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateOrderStatus(input: {
  actorId: string;
  orderId: string;
  status: Database["public"]["Enums"]["order_status"];
}) {
  const { data: before } = await supabaseAdmin
    .from("orders")
    .select("id,status,user_id,reference")
    .eq("id", input.orderId)
    .maybeSingle();
  if (!before) throw new Error("Commande introuvable.");

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: input.status })
    .eq("id", input.orderId);
  if (error) throw new Error(error.message);

  const deliveryStatus =
    input.status === "PREPARING"
      ? "PREPARING"
      : input.status === "SHIPPED"
        ? "SHIPPED"
        : input.status === "DELIVERED" || input.status === "COMPLETED"
          ? "DELIVERED"
          : null;
  if (deliveryStatus) {
    await supabaseAdmin
      .from("deliveries")
      .update({ status: deliveryStatus })
      .eq("order_id", input.orderId);
  }

  await supabaseAdmin.from("notifications").insert({
    user_id: before.user_id,
    title: `Commande ${before.reference} mise à jour`,
    body: `Nouveau statut: ${input.status}.`,
    channel: "IN_APP",
    audience: "USER",
  });

  await logAudit({
    actorId: input.actorId,
    action: "order.status_update",
    entityType: "orders",
    entityId: input.orderId,
    oldValue: { status: before.status },
    newValue: { status: input.status },
  });
  return { ok: true };
}

// --- LIVREURS -------------------------------------------------------------
// Les livreurs n'ont pas de compte (pas d'auto-inscription pour l'instant) :
// ce sont de simples fiches créées par l'équipe interne, assignées ensuite à
// une livraison. Voir supabase/migrations/20260902090000_couriers_and_delivery_assignment.sql
// pour le schéma et la policy RLS qui n'expose un livreur au client QUE si
// son id est celui assigné à une de ses propres livraisons.

export async function listCouriers() {
  const { data, error } = await supabaseAdmin
    .from("couriers")
    .select("id,full_name,phone,vehicle,zone,is_active,notes,created_at")
    .order("full_name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCourier(input: {
  actorId: string;
  fullName: string;
  phone: string;
  vehicle?: string | null | undefined;
  zone?: string | null | undefined;
  notes?: string | null | undefined;
}) {
  const { data, error } = await supabaseAdmin
    .from("couriers")
    .insert({
      full_name: input.fullName,
      phone: input.phone,
      vehicle: input.vehicle || null,
      zone: input.zone || null,
      notes: input.notes || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: input.actorId,
    action: "courier.create",
    entityType: "couriers",
    entityId: data.id,
    newValue: { full_name: input.fullName, phone: input.phone },
  });
  return { ok: true, id: data.id };
}

export async function updateCourier(input: {
  actorId: string;
  courierId: string;
  fullName: string;
  phone: string;
  vehicle?: string | null | undefined;
  zone?: string | null | undefined;
  notes?: string | null | undefined;
  isActive: boolean;
}) {
  const { error } = await supabaseAdmin
    .from("couriers")
    .update({
      full_name: input.fullName,
      phone: input.phone,
      vehicle: input.vehicle || null,
      zone: input.zone || null,
      notes: input.notes || null,
      is_active: input.isActive,
    })
    .eq("id", input.courierId);
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: input.actorId,
    action: "courier.update",
    entityType: "couriers",
    entityId: input.courierId,
    newValue: { full_name: input.fullName, is_active: input.isActive },
  });
  return { ok: true };
}

export async function deleteCourier(input: { actorId: string; courierId: string }) {
  // On ne supprime jamais vraiment un livreur ayant déjà été assigné (il
  // reste référencé par `deliveries.courier_id`, ON DELETE SET NULL) : une
  // désactivation (`isActive: false`) est presque toujours préférable pour
  // garder l'historique des livraisons passées lisible. La suppression est
  // proposée pour les fiches créées par erreur.
  const { error } = await supabaseAdmin.from("couriers").delete().eq("id", input.courierId);
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: input.actorId,
    action: "courier.delete",
    entityType: "couriers",
    entityId: input.courierId,
  });
  return { ok: true };
}

export async function assignCourier(input: {
  actorId: string;
  deliveryId: string;
  courierId: string | null;
}) {
  const { data: delivery } = await supabaseAdmin
    .from("deliveries")
    .select("id,user_id,order_id,status")
    .eq("id", input.deliveryId)
    .maybeSingle();
  if (!delivery) throw new Error("Livraison introuvable.");

  const { error } = await supabaseAdmin
    .from("deliveries")
    .update({
      courier_id: input.courierId,
      courier_assigned_at: input.courierId ? new Date().toISOString() : null,
      // Assigner un livreur fait passer la livraison "en route" si elle en
      // était encore au statut par défaut ; on ne rétrograde jamais un
      // statut plus avancé (ex: déjà DELIVERED) en réassignant.
      ...(input.courierId && (delivery.status === "PENDING" || delivery.status === "PREPARING")
        ? { status: "OUT_FOR_DELIVERY" as const }
        : {}),
    })
    .eq("id", input.deliveryId);
  if (error) throw new Error(error.message);

  if (input.courierId) {
    const { data: courier } = await supabaseAdmin
      .from("couriers")
      .select("full_name,phone")
      .eq("id", input.courierId)
      .maybeSingle();
    await supabaseAdmin.from("notifications").insert({
      user_id: delivery.user_id,
      title: "Un livreur vous a été assigné",
      body: courier
        ? `${courier.full_name} (${courier.phone}) s'occupe de votre livraison. Vous pouvez le contacter directement.`
        : "Un livreur a été assigné à votre commande.",
      channel: "IN_APP",
      audience: "USER",
    });
  }

  await logAudit({
    actorId: input.actorId,
    action: "delivery.assign_courier",
    entityType: "deliveries",
    entityId: input.deliveryId,
    newValue: { courier_id: input.courierId },
  });
  return { ok: true };
}

export async function listPayments() {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select(
      "id,amount,status,payment_method,external_reference,created_at,confirmed_at,user_id,order_id,flex_account_id,tontine_id,profiles:user_id(first_name,last_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function decidePayment(input: {
  actorId: string;
  paymentId: string;
  status: Database["public"]["Enums"]["payment_status"];
}) {
  const { data: before } = await supabaseAdmin
    .from("payments")
    .select("id,status,order_id,user_id,amount")
    .eq("id", input.paymentId)
    .maybeSingle();
  if (!before) throw new Error("Paiement introuvable.");

  const { error } = await supabaseAdmin
    .from("payments")
    .update({
      status: input.status,
      confirmed_at: input.status === "SUCCESS" ? new Date().toISOString() : null,
    })
    .eq("id", input.paymentId);
  if (error) throw new Error(error.message);

  if (input.status === "SUCCESS" && before.order_id) {
    await supabaseAdmin.from("orders").update({ status: "PAID" }).eq("id", before.order_id);
  }

  await logAudit({
    actorId: input.actorId,
    action: "payment.status_update",
    entityType: "payments",
    entityId: input.paymentId,
    oldValue: { status: before.status },
    newValue: { status: input.status },
  });
  return { ok: true };
}

const PRODUCT_ADMIN_FIELDS =
  "id,slug,model,category,generation,storage,color,connectivity,condition,description,images,features,specs,warranty_months,price_cash,price_flex,price_tontine,purchase_cost_usd,shipping_cost_usd,stock_quantity,low_stock_threshold,is_active,is_demo,created_at,updated_at";

export async function listProductsAdmin() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(PRODUCT_ADMIN_FIELDS)
    .order("model", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

type ProductSpec = { label: string; value: string };

type ProductPatch = {
  model?: string | undefined;
  slug?: string | undefined;
  category?: string | undefined;
  generation?: string | null | undefined;
  storage?: string | null | undefined;
  color?: string | null | undefined;
  connectivity?: string | null | undefined;
  condition?: string | null | undefined;
  description?: string | null | undefined;
  images?: string[] | undefined;
  specs?: ProductSpec[] | undefined;
  warranty_months?: number | undefined;
  purchase_cost_usd?: number | undefined;
  shipping_cost_usd?: number | undefined;
  price_cash?: number | undefined;
  price_flex?: number | undefined;
  price_tontine?: number | undefined;
  stock_quantity?: number | undefined;
  low_stock_threshold?: number | undefined;
  is_active?: boolean | undefined;
};

type NewProduct = ProductPatch & { model: string; slug: string; category: string };

const PRICE_FIELDS = ["price_cash", "price_flex", "price_tontine"] as const;

async function recordPriceHistory(input: {
  productId: string;
  actorId: string;
  before: Record<string, unknown>;
  patch: ProductPatch;
}) {
  const rows = PRICE_FIELDS.filter(
    (field) =>
      typeof input.patch[field] === "number" &&
      Number(input.patch[field]) !== Number(input.before[field]),
  ).map((field) => ({
    product_id: input.productId,
    field,
    old_value: Number(input.before[field] ?? 0),
    new_value: Number(input.patch[field]),
    changed_by: input.actorId,
  }));
  if (rows.length > 0) {
    await supabaseAdmin.from("price_history").insert(rows);
  }
}

export async function createProduct(input: { actorId: string; product: NewProduct }) {
  if (!input.product.model || !input.product.slug) {
    throw new Error("Le modèle et le slug sont obligatoires.");
  }
  const { data, error } = await supabaseAdmin
    .from("products")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(input.product as any)
    .select(PRODUCT_ADMIN_FIELDS)
    .single();
  if (error) throw new Error(error.message);

  if (input.product.stock_quantity && input.product.stock_quantity > 0) {
    await supabaseAdmin.from("inventory_movements").insert({
      product_id: data.id,
      movement_type: "RESTOCK",
      quantity: input.product.stock_quantity,
      note: "Stock initial à la création",
      created_by: input.actorId,
    });
  }

  await logAudit({
    actorId: input.actorId,
    action: "product.create",
    entityType: "products",
    entityId: data.id,
    oldValue: null,
    newValue: input.product,
  });
  return data;
}

export async function updateProduct(input: {
  actorId: string;
  productId: string;
  patch: ProductPatch;
}) {
  const { data: before } = await supabaseAdmin
    .from("products")
    .select(PRODUCT_ADMIN_FIELDS)
    .eq("id", input.productId)
    .maybeSingle();
  if (!before) throw new Error("Produit introuvable.");

  const { error } = await supabaseAdmin
    .from("products")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(input.patch as any)
    .eq("id", input.productId);
  if (error) throw new Error(error.message);

  if (
    typeof input.patch.stock_quantity === "number" &&
    input.patch.stock_quantity !== Number(before.stock_quantity)
  ) {
    await supabaseAdmin.from("inventory_movements").insert({
      product_id: input.productId,
      movement_type: "ADJUSTMENT",
      quantity: input.patch.stock_quantity - Number(before.stock_quantity),
      note: "Ajustement back-office",
      created_by: input.actorId,
    });
  }

  await recordPriceHistory({
    productId: input.productId,
    actorId: input.actorId,
    before,
    patch: input.patch,
  });

  await logAudit({
    actorId: input.actorId,
    action: "product.update",
    entityType: "products",
    entityId: input.productId,
    oldValue: before,
    newValue: input.patch,
  });
  return { ok: true };
}

export async function listUsersAdmin() {
  const [profiles, roles] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id,first_name,last_name,phone,email,status,created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    supabaseAdmin.from("user_roles").select("user_id,role"),
  ]);
  if (profiles.error) throw new Error(profiles.error.message);
  const roleMap = new Map<string, AppRole[]>();
  for (const r of roles.data ?? []) {
    roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role as AppRole]);
  }
  return (profiles.data ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
}

export async function setUserRole(input: { actorId: string; userId: string; role: AppRole }) {
  await supabaseAdmin.from("user_roles").delete().eq("user_id", input.userId);
  const { error } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: input.userId, role: input.role });
  if (error) throw new Error(error.message);
  await logAudit({
    actorId: input.actorId,
    action: "user.role_set",
    entityType: "user_roles",
    entityId: input.userId,
    newValue: { role: input.role },
  });
  return { ok: true };
}

export async function setUserStatus(input: {
  actorId: string;
  userId: string;
  status: Database["public"]["Enums"]["account_status"];
}) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ status: input.status })
    .eq("id", input.userId);
  if (error) throw new Error(error.message);
  await logAudit({
    actorId: input.actorId,
    action: "user.status_set",
    entityType: "profiles",
    entityId: input.userId,
    newValue: { status: input.status },
  });
  return { ok: true };
}

export async function listTontinesAdmin() {
  const { data, error } = await supabaseAdmin
    .from("tontines")
    .select(
      "id,name,status,price,contribution_amount,frequency,duration_months,member_capacity,ipads_available,start_date,tontine_members(id,status,paid_amount,created_at,user_id,profiles:user_id(first_name,last_name,phone))",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function decideMembership(input: {
  actorId: string;
  memberId: string;
  decision: "APPROVED" | "REMOVED" | "SUSPENDED" | "ACTIVE";
}) {
  const { data: member } = await supabaseAdmin
    .from("tontine_members")
    .select("id,status,user_id,tontine_id,tontines(name)")
    .eq("id", input.memberId)
    .maybeSingle();
  if (!member) throw new Error("Adhésion introuvable.");

  const { error } = await supabaseAdmin
    .from("tontine_members")
    .update({ status: input.decision })
    .eq("id", input.memberId);
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("notifications").insert({
    user_id: member.user_id,
    title: `Adhésion tontine ${input.decision === "REMOVED" ? "refusée" : "mise à jour"}`,
    body: `Tontine « ${(member as { tontines?: { name?: string } }).tontines?.name ?? ""} » — statut: ${input.decision}.`,
    channel: "IN_APP",
    audience: "USER",
    tontine_id: member.tontine_id,
  });

  await logAudit({
    actorId: input.actorId,
    action: "tontine.member_decision",
    entityType: "tontine_members",
    entityId: input.memberId,
    oldValue: { status: member.status },
    newValue: { status: input.decision },
  });
  return { ok: true };
}

export async function updateTontineStatus(input: {
  actorId: string;
  tontineId: string;
  status: Database["public"]["Enums"]["tontine_status"];
}) {
  const { error } = await supabaseAdmin
    .from("tontines")
    .update({ status: input.status })
    .eq("id", input.tontineId);
  if (error) throw new Error(error.message);
  await logAudit({
    actorId: input.actorId,
    action: "tontine.status_update",
    entityType: "tontines",
    entityId: input.tontineId,
    newValue: { status: input.status },
  });
  return { ok: true };
}

export async function listAuditLogs() {
  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("id,action,entity_type,entity_id,created_at,actor_id,new_value")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Flex : demandes d'annulation
// ---------------------------------------------------------------------------

export async function listFlexCancellations(status: "PENDING" | "ALL" = "PENDING") {
  let query = supabaseAdmin
    .from("flex_cancellations")
    .select(
      "id,status,reason,paid_amount,fee_amount,refundable_amount,keep_as_credit,created_at,decided_at,flex_account_id,user_id,flex_accounts(products(model)),profiles:user_id(first_name,last_name,phone)",
    )
    .order("created_at", { ascending: false });
  if (status !== "ALL") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function decideFlexCancellation(input: {
  actorId: string;
  requestId: string;
  decision: "APPROVED" | "REJECTED";
}) {
  const { data: request, error } = await supabaseAdmin
    .from("flex_cancellations")
    .select("id,status,user_id,flex_account_id,fee_amount,refundable_amount,keep_as_credit")
    .eq("id", input.requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!request) throw new Error("Demande introuvable.");
  if (request.status !== "PENDING") throw new Error("Cette demande a déjà été traitée.");

  const { error: updateError } = await supabaseAdmin
    .from("flex_cancellations")
    .update({
      status: input.decision,
      decided_at: new Date().toISOString(),
      decided_by: input.actorId,
    })
    .eq("id", input.requestId);
  if (updateError) throw new Error(updateError.message);

  if (input.decision === "APPROVED") {
    await supabaseAdmin
      .from("flex_accounts")
      .update({ status: "CANCELLED" })
      .eq("id", request.flex_account_id);
  }

  await supabaseAdmin.from("notifications").insert({
    user_id: request.user_id,
    title: input.decision === "APPROVED" ? "Annulation Flex approuvée" : "Annulation Flex refusée",
    body:
      input.decision === "APPROVED"
        ? request.keep_as_credit
          ? `Votre compte Flex est annulé. ${request.refundable_amount} FCFA sont conservés en crédit boutique.`
          : `Votre compte Flex est annulé. Remboursement de ${request.refundable_amount} FCFA en cours de traitement.`
        : "Votre demande d'annulation n'a pas été retenue. Votre compte Flex reste actif.",
    channel: "IN_APP",
    audience: "USER",
  });

  await logAudit({
    actorId: input.actorId,
    action: `flex_cancellation.${input.decision.toLowerCase()}`,
    entityType: "flex_cancellations",
    entityId: input.requestId,
    oldValue: { status: "PENDING" },
    newValue: { status: input.decision },
  });

  return { ok: true };
}

/** À utiliser une fois le virement Wave/Orange Money réellement envoyé au client. */
export async function markFlexCancellationRefunded(input: { actorId: string; requestId: string }) {
  const { data: request, error } = await supabaseAdmin
    .from("flex_cancellations")
    .select("id,status,user_id,refundable_amount,keep_as_credit")
    .eq("id", input.requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!request) throw new Error("Demande introuvable.");
  if (request.status !== "APPROVED") {
    throw new Error("Seule une demande approuvée peut être marquée comme remboursée.");
  }
  if (request.keep_as_credit) {
    throw new Error("Ce montant est conservé en crédit, pas de remboursement à effectuer.");
  }

  const { error: updateError } = await supabaseAdmin
    .from("flex_cancellations")
    .update({ status: "REFUNDED" })
    .eq("id", input.requestId);
  if (updateError) throw new Error(updateError.message);

  await supabaseAdmin.from("notifications").insert({
    user_id: request.user_id,
    title: "Remboursement effectué",
    body: `${request.refundable_amount} FCFA vous ont été envoyés.`,
    channel: "IN_APP",
    audience: "USER",
  });

  await logAudit({
    actorId: input.actorId,
    action: "flex_cancellation.refunded",
    entityType: "flex_cancellations",
    entityId: input.requestId,
    oldValue: { status: "APPROVED" },
    newValue: { status: "REFUNDED" },
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Paramètres (table settings, clé/valeur JSON)
// ---------------------------------------------------------------------------

export async function listSettings() {
  const { data, error } = await supabaseAdmin.from("settings").select("key,value,updated_at");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateSetting(input: { actorId: string; key: string; value: object }) {
  const { data: before } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", input.key)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("settings")
    .update({ value: input.value as never })
    .eq("key", input.key);
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: input.actorId,
    action: "settings.update",
    entityType: "settings",
    entityId: input.key,
    oldValue: before?.value ?? null,
    newValue: input.value,
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Stories (vitrine boutique, publiées par le staff uniquement)
// ---------------------------------------------------------------------------

export async function listStoriesAdmin() {
  const { data, error } = await supabaseAdmin
    .from("stories")
    .select(
      "id,title,media_url,media_type,product_id,is_active,created_at,expires_at,products(model)",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createStory(input: {
  actorId: string;
  title?: string | null | undefined;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  productId?: string | null | undefined;
  durationHours: number;
}) {
  const expiresAt = new Date(Date.now() + input.durationHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("stories")
    .insert({
      title: input.title ?? null,
      media_url: input.mediaUrl,
      media_type: input.mediaType,
      product_id: input.productId ?? null,
      created_by: input.actorId,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: input.actorId,
    action: "story.create",
    entityType: "stories",
    entityId: data.id,
    newValue: { ...input, expiresAt },
  });

  return { id: data.id };
}

export async function setStoryActive(input: {
  actorId: string;
  storyId: string;
  isActive: boolean;
}) {
  const { error } = await supabaseAdmin
    .from("stories")
    .update({ is_active: input.isActive })
    .eq("id", input.storyId);
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: input.actorId,
    action: input.isActive ? "story.show" : "story.hide",
    entityType: "stories",
    entityId: input.storyId,
  });

  return { ok: true };
}

export async function deleteStory(input: { actorId: string; storyId: string }) {
  const { error } = await supabaseAdmin.from("stories").delete().eq("id", input.storyId);
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: input.actorId,
    action: "story.delete",
    entityType: "stories",
    entityId: input.storyId,
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Message direct à un client (staff → client, via la table notifications)
// ---------------------------------------------------------------------------

export async function sendClientMessage(input: {
  actorId: string;
  userId: string;
  title: string;
  body: string;
}) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: input.userId,
    title: input.title,
    body: input.body,
    channel: "IN_APP",
    audience: "USER",
  });
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: input.actorId,
    action: "message.send",
    entityType: "notifications",
    entityId: input.userId,
    newValue: { title: input.title, body: input.body },
  });

  return { ok: true };
}
