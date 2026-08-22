import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const PAYMENT_METHODS = ["WAVE", "ORANGE_MONEY", "CARD", "CASH_ON_DELIVERY"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function reference(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

/** Simulation de passerelle: Wave / Orange Money / carte sont confirmés, le paiement à la livraison reste en attente. */
async function recordPayment(input: {
  userId: string;
  amount: number;
  method: PaymentMethod;
  orderId?: string | null;
  flexAccountId?: string | null;
  tontineId?: string | null;
  tontineMemberId?: string | null;
}) {
  const confirmed = input.method !== "CASH_ON_DELIVERY";
  const { data, error } = await supabaseAdmin
    .from("payments")
    .insert({
      user_id: input.userId,
      amount: input.amount,
      payment_method: input.method,
      external_reference: reference("PAY"),
      status: confirmed ? "SUCCESS" : "PENDING",
      order_id: input.orderId ?? null,
      flex_account_id: input.flexAccountId ?? null,
      tontine_id: input.tontineId ?? null,
      tontine_member_id: input.tontineMemberId ?? null,
      confirmed_at: confirmed ? new Date().toISOString() : null,
    })
    .select("id,status,amount,external_reference")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function loadProduct(productId: string) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id,price_cash,price_flex,price_tontine,stock_quantity,is_active,model")
    .eq("id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !data.is_active) throw new Error("Produit indisponible.");
  return data;
}

export async function placeCashOrder(input: {
  userId: string;
  productId: string;
  method: PaymentMethod;
  address: string;
  phone: string;
}) {
  const product = await loadProduct(input.productId);
  if (product.stock_quantity <= 0) throw new Error("Ce modèle est en rupture de stock.");

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      reference: reference("CMD"),
      user_id: input.userId,
      product_id: product.id,
      formula: "CASH",
      amount: product.price_cash,
      status: "PENDING",
    })
    .select("id,reference,amount")
    .single();
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    quantity: 1,
    unit_price: product.price_cash,
  });

  const payment = await recordPayment({
    userId: input.userId,
    amount: product.price_cash,
    method: input.method,
    orderId: order.id,
  });

  if (payment.status === "SUCCESS") {
    await supabaseAdmin
      .from("orders")
      .update({ status: "PAID" })
      .eq("id", order.id);
    await supabaseAdmin
      .from("products")
      .update({ stock_quantity: product.stock_quantity - 1 })
      .eq("id", product.id);
  }

  await supabaseAdmin.from("deliveries").insert({
    order_id: order.id,
    user_id: input.userId,
    address: input.address,
    phone: input.phone,
    status: "PENDING",
  });

  await supabaseAdmin.from("notifications").insert({
    user_id: input.userId,
    title: `Commande ${order.reference} enregistrée`,
    body: `Votre ${product.model} est réservé. Statut du paiement: ${payment.status}.`,
    channel: "IN_APP",
    audience: "USER",
  });

  return { orderId: order.id, reference: order.reference, paymentStatus: payment.status };
}

export async function openFlexAccount(input: { userId: string; productId: string }) {
  const product = await loadProduct(input.productId);
  const { data: existing } = await supabaseAdmin
    .from("flex_accounts")
    .select("id")
    .eq("user_id", input.userId)
    .eq("product_id", product.id)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (existing) return { flexAccountId: existing.id, created: false };

  const { data, error } = await supabaseAdmin
    .from("flex_accounts")
    .insert({
      user_id: input.userId,
      product_id: product.id,
      target_amount: product.price_flex,
      paid_amount: 0,
      status: "ACTIVE",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { flexAccountId: data.id, created: true };
}

export async function depositToFlex(input: {
  userId: string;
  flexAccountId: string;
  amount: number;
  method: PaymentMethod;
}) {
  const { data: account, error } = await supabaseAdmin
    .from("flex_accounts")
    .select("id,user_id,target_amount,paid_amount,status")
    .eq("id", input.flexAccountId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!account || account.user_id !== input.userId) throw new Error("Compte Flex introuvable.");
  if (account.status !== "ACTIVE") throw new Error("Ce compte Flex n'est plus actif.");

  const remaining = Number(account.target_amount) - Number(account.paid_amount);
  if (input.amount > remaining) throw new Error("Le montant dépasse le solde restant à payer.");

  const payment = await recordPayment({
    userId: input.userId,
    amount: input.amount,
    method: input.method === "CASH_ON_DELIVERY" ? "WAVE" : input.method,
    flexAccountId: account.id,
  });

  const { error: depositError } = await supabaseAdmin.from("flex_deposits").insert({
    flex_account_id: account.id,
    payment_id: payment.id,
    amount: input.amount,
  });
  if (depositError) throw new Error(depositError.message);

  return { paid: input.amount, remaining: remaining - input.amount };
}

export async function joinTontineRequest(input: { userId: string; tontineId: string }) {
  const { data: tontine, error } = await supabaseAdmin
    .from("tontines")
    .select("id,name,status,member_capacity,terms_version")
    .eq("id", input.tontineId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!tontine || !["OPEN", "ACTIVE"].includes(tontine.status)) {
    throw new Error("Cette tontine n'accepte plus d'adhésion.");
  }

  const { data: mine } = await supabaseAdmin
    .from("tontine_members")
    .select("id")
    .eq("tontine_id", tontine.id)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (mine) return { memberId: mine.id, created: false };

  const { count } = await supabaseAdmin
    .from("tontine_members")
    .select("id", { count: "exact", head: true })
    .eq("tontine_id", tontine.id)
    .in("status", ["PENDING", "APPROVED", "ACTIVE"]);
  if ((count ?? 0) >= tontine.member_capacity) throw new Error("Tontine complète.");

  const { data, error: insertError } = await supabaseAdmin
    .from("tontine_members")
    .insert({
      tontine_id: tontine.id,
      user_id: input.userId,
      status: "PENDING",
      terms_accepted_at: new Date().toISOString(),
      terms_version: tontine.terms_version,
    })
    .select("id")
    .single();
  if (insertError) throw new Error(insertError.message);

  await supabaseAdmin.from("notifications").insert({
    user_id: input.userId,
    title: `Demande d'adhésion envoyée`,
    body: `Votre demande pour la tontine « ${tontine.name} » est en cours de validation.`,
    channel: "IN_APP",
    audience: "USER",
    tontine_id: tontine.id,
  });

  return { memberId: data.id, created: true };
}

export async function payContribution(input: {
  userId: string;
  memberId: string;
  method: PaymentMethod;
}) {
  const { data: member, error } = await supabaseAdmin
    .from("tontine_members")
    .select("id,user_id,tontine_id,paid_amount,status,tontines(contribution_amount,name)")
    .eq("id", input.memberId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!member || member.user_id !== input.userId) throw new Error("Adhésion introuvable.");
  if (!["APPROVED", "ACTIVE"].includes(member.status)) {
    throw new Error("Votre adhésion doit être validée avant de cotiser.");
  }

  const amount = Number((member as any).tontines?.contribution_amount ?? 0);
  if (!amount) throw new Error("Montant de cotisation indisponible.");

  const payment = await recordPayment({
    userId: input.userId,
    amount,
    method: input.method === "CASH_ON_DELIVERY" ? "WAVE" : input.method,
    tontineId: member.tontine_id,
    tontineMemberId: member.id,
  });

  const today = new Date().toISOString().slice(0, 10);
  await supabaseAdmin.from("tontine_contributions").insert({
    tontine_id: member.tontine_id,
    member_id: member.id,
    amount,
    due_date: today,
    status: "PAID",
    payment_id: payment.id,
    reference: payment.external_reference,
    paid_at: new Date().toISOString(),
  });

  await supabaseAdmin
    .from("tontine_members")
    .update({ paid_amount: Number(member.paid_amount) + amount, status: "ACTIVE" })
    .eq("id", member.id);

  return { amount };
}
