import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createPaytechPayment } from "@/lib/paytech.server";

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

  await supabaseAdmin.from("deliveries").insert({
    order_id: order.id,
    user_id: input.userId,
    address: input.address,
    phone: input.phone,
    status: "PENDING",
  });

  // Paiement à la livraison : pas de passerelle en ligne, la commande reste
  // PENDING jusqu'à l'encaissement physique par le livreur.
  if (input.method === "CASH_ON_DELIVERY") {
    const payment = await recordPayment({
      userId: input.userId,
      amount: product.price_cash,
      method: input.method,
      orderId: order.id,
    });

    await supabaseAdmin.from("notifications").insert({
      user_id: input.userId,
      title: `Commande ${order.reference} enregistrée`,
      body: `Votre ${product.model} est réservé. Vous payez à la livraison.`,
      channel: "IN_APP",
      audience: "USER",
    });

    return {
      orderId: order.id,
      reference: order.reference,
      paymentStatus: payment.status,
      redirectUrl: null as string | null,
    };
  }

  // Wave / Orange Money / carte : on passe par PayTech. La commande reste
  // PENDING jusqu'à la confirmation reçue via l'IPN (webhook serveur à
  // serveur) — le paiement n'est jamais considéré réussi sur la seule foi
  // de la redirection du navigateur.
  const { data: paymentRow, error: paymentError } = await supabaseAdmin
    .from("payments")
    .insert({
      user_id: input.userId,
      amount: product.price_cash,
      payment_method: input.method,
      external_reference: reference("PAY"),
      status: "PENDING",
      order_id: order.id,
    })
    .select("id,external_reference")
    .single();
  if (paymentError) throw new Error(paymentError.message);

  const { redirectUrl } = await createPaytechPayment({
    refCommand: paymentRow.external_reference!,
    amount: product.price_cash,
    itemName: product.model,
    commandName: `Commande ${order.reference} — ${product.model}`,
    customField: { orderId: order.id, paymentId: paymentRow.id },
  });

  return {
    orderId: order.id,
    reference: order.reference,
    paymentStatus: "PENDING" as const,
    redirectUrl,
  };
}

/**
 * Commande passée depuis le panier (plusieurs produits, une seule adresse
 * de livraison et un seul paiement pour le total). Réutilise exactement le
 * même mécanisme que placeCashOrder (COD ou PayTech), généralisé à
 * plusieurs lignes `order_items` au lieu d'une seule — la commande garde
 * `product_id` pointant vers le premier article, pour rester compatible
 * avec l'affichage existant (admin/dashboard) qui montre "un" produit par
 * commande ; le détail complet reste consultable via `order_items`.
 */
export async function placeCartOrder(input: {
  userId: string;
  items: { productId: string; quantity: number }[];
  method: PaymentMethod;
  address: string;
  phone: string;
}) {
  if (!input.items.length) throw new Error("Le panier est vide.");

  const products = await Promise.all(
    input.items.map(async (item) => {
      const product = await loadProduct(item.productId);
      if (product.stock_quantity < item.quantity) {
        throw new Error(
          `Stock insuffisant pour ${product.model} (${product.stock_quantity} disponible(s)).`,
        );
      }
      return { ...product, quantity: item.quantity };
    }),
  );
  const firstProduct = products[0];
  if (!firstProduct) throw new Error("Le panier est vide.");

  const amount = products.reduce((sum, p) => sum + p.price_cash * p.quantity, 0);
  const itemsLabel = products.map((p) => `${p.model} x${p.quantity}`).join(", ");

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      reference: reference("CMD"),
      user_id: input.userId,
      product_id: firstProduct.id,
      formula: "CASH",
      amount,
      status: "PENDING",
    })
    .select("id,reference,amount")
    .single();
  if (error) throw new Error(error.message);

  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
    products.map((p) => ({
      order_id: order.id,
      product_id: p.id,
      quantity: p.quantity,
      unit_price: p.price_cash,
    })),
  );
  if (itemsError) throw new Error(itemsError.message);

  await supabaseAdmin.from("deliveries").insert({
    order_id: order.id,
    user_id: input.userId,
    address: input.address,
    phone: input.phone,
    status: "PENDING",
  });

  if (input.method === "CASH_ON_DELIVERY") {
    const payment = await recordPayment({
      userId: input.userId,
      amount,
      method: input.method,
      orderId: order.id,
    });

    await supabaseAdmin.from("notifications").insert({
      user_id: input.userId,
      title: `Commande ${order.reference} enregistrée`,
      body: `Votre commande (${itemsLabel}) est réservée. Vous payez à la livraison.`,
      channel: "IN_APP",
      audience: "USER",
    });

    return {
      orderId: order.id,
      reference: order.reference,
      paymentStatus: payment.status,
      redirectUrl: null as string | null,
    };
  }

  const { data: paymentRow, error: paymentError } = await supabaseAdmin
    .from("payments")
    .insert({
      user_id: input.userId,
      amount,
      payment_method: input.method,
      external_reference: reference("PAY"),
      status: "PENDING",
      order_id: order.id,
    })
    .select("id,external_reference")
    .single();
  if (paymentError) throw new Error(paymentError.message);

  const { redirectUrl } = await createPaytechPayment({
    refCommand: paymentRow.external_reference!,
    amount,
    itemName: itemsLabel,
    commandName: `Commande ${order.reference} — ${itemsLabel}`,
    customField: { orderId: order.id, paymentId: paymentRow.id },
  });

  return {
    orderId: order.id,
    reference: order.reference,
    paymentStatus: "PENDING" as const,
    redirectUrl,
  };
}

export async function openFlexAccount(input: {
  userId: string;
  productId: string;
  address: string;
  phone: string;
}) {
  const product = await loadProduct(input.productId);
  const { data: existing } = await supabaseAdmin
    .from("flex_accounts")
    .select("id")
    .eq("user_id", input.userId)
    .eq("product_id", product.id)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (existing) {
    // On garde l'adresse à jour au cas où le client la corrige.
    await supabaseAdmin
      .from("flex_accounts")
      .update({ delivery_address: input.address, delivery_phone: input.phone })
      .eq("id", existing.id);
    return { flexAccountId: existing.id, created: false };
  }

  const { data, error } = await supabaseAdmin
    .from("flex_accounts")
    .insert({
      user_id: input.userId,
      product_id: product.id,
      target_amount: product.price_flex,
      paid_amount: 0,
      status: "ACTIVE",
      delivery_address: input.address,
      delivery_phone: input.phone,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("notifications").insert({
    user_id: input.userId,
    title: "Compte Flex ouvert",
    body: `Votre compte Flex pour ${product.model} est actif. Objectif : ${product.price_flex} FCFA.`,
    channel: "IN_APP",
    audience: "USER",
  });

  return { flexAccountId: data.id, created: true };
}

/**
 * Une fois le compte Flex complété (déclenché par le trigger SQL
 * recompute_flex_balance qui passe le statut à COMPLETED), on crée
 * automatiquement la commande et la livraison correspondantes — le client
 * ne doit rien refaire manuellement. Idempotent : si une commande existe
 * déjà pour ce compte Flex, on ne la recrée pas.
 */
async function finalizeFlexAccountIfCompleted(flexAccountId: string) {
  const { data: account, error } = await supabaseAdmin
    .from("flex_accounts")
    .select("id,user_id,product_id,target_amount,status,delivery_address,delivery_phone")
    .eq("id", flexAccountId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!account || account.status !== "COMPLETED" || !account.product_id) return null;

  const { data: existingOrder } = await supabaseAdmin
    .from("orders")
    .select("id,reference")
    .eq("flex_account_id", account.id)
    .maybeSingle();
  if (existingOrder) return existingOrder;

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id,model,stock_quantity")
    .eq("id", account.product_id)
    .maybeSingle();
  if (productError) throw new Error(productError.message);
  if (!product) return null;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      reference: reference("CMD"),
      user_id: account.user_id,
      product_id: product.id,
      flex_account_id: account.id,
      formula: "FLEX",
      amount: account.target_amount,
      status: "PAID",
    })
    .select("id,reference")
    .single();
  if (orderError) throw new Error(orderError.message);

  await supabaseAdmin.from("order_items").insert({
    order_id: order.id,
    product_id: product.id,
    quantity: 1,
    unit_price: account.target_amount,
  });

  await supabaseAdmin
    .from("products")
    .update({ stock_quantity: Math.max(0, product.stock_quantity - 1) })
    .eq("id", product.id);

  await supabaseAdmin.from("deliveries").insert({
    order_id: order.id,
    user_id: account.user_id,
    address: account.delivery_address ?? "",
    phone: account.delivery_phone ?? "",
    status: "PENDING",
  });

  await supabaseAdmin.from("notifications").insert({
    user_id: account.user_id,
    title: "Épargne Flex complétée 🎉",
    body: `Votre ${product.model} est entièrement payé. Commande ${order.reference} créée, livraison en préparation.`,
    channel: "IN_APP",
    audience: "USER",
  });

  return order;
}

export async function depositToFlex(input: {
  userId: string;
  flexAccountId: string;
  amount: number;
  method: PaymentMethod;
}) {
  const { data: account, error } = await supabaseAdmin
    .from("flex_accounts")
    .select("id,user_id,target_amount,paid_amount,status,products(model)")
    .eq("id", input.flexAccountId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!account || account.user_id !== input.userId) throw new Error("Compte Flex introuvable.");
  if (account.status !== "ACTIVE") throw new Error("Ce compte Flex n'est plus actif.");

  const remaining = Number(account.target_amount) - Number(account.paid_amount);
  if (input.amount > remaining) throw new Error("Le montant dépasse le solde restant à payer.");
  if (input.amount <= 0) throw new Error("Le montant doit être supérieur à 0.");

  // Le dépôt n'est enregistré (flex_deposits) qu'une fois le paiement confirmé
  // par le webhook PayTech — jamais avant, pour ne jamais faire progresser
  // l'épargne d'un client sur la seule foi d'une redirection navigateur.
  const { data: paymentRow, error: paymentError } = await supabaseAdmin
    .from("payments")
    .insert({
      user_id: input.userId,
      amount: input.amount,
      payment_method: input.method,
      external_reference: reference("PAY"),
      status: "PENDING",
      flex_account_id: account.id,
    })
    .select("id,external_reference")
    .single();
  if (paymentError) throw new Error(paymentError.message);

  const productModel =
    (account as { products?: { model?: string } | null }).products?.model ?? "iPad";

  const { redirectUrl } = await createPaytechPayment({
    refCommand: paymentRow.external_reference!,
    amount: input.amount,
    itemName: `Dépôt Flex — ${productModel}`,
    commandName: `Versement Flex de ${input.amount} FCFA`,
    customField: { flexAccountId: account.id, paymentId: paymentRow.id },
  });

  return { redirectUrl };
}

export async function getFlexSettings() {
  const { data } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", "flex")
    .maybeSingle();
  const value = (data?.value ?? {}) as { min_deposit?: number; cancellation_fee_percent?: number };
  return {
    minDeposit: Number(value.min_deposit ?? 5000),
    cancellationFeePercent: Number(value.cancellation_fee_percent ?? 10),
  };
}

export async function requestFlexCancellation(input: {
  userId: string;
  flexAccountId: string;
  reason?: string | undefined;
  keepAsCredit: boolean;
}) {
  const { data: account, error } = await supabaseAdmin
    .from("flex_accounts")
    .select("id,user_id,paid_amount,status")
    .eq("id", input.flexAccountId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!account || account.user_id !== input.userId) throw new Error("Compte Flex introuvable.");
  if (account.status !== "ACTIVE") {
    throw new Error("Seul un compte Flex actif peut faire l'objet d'une demande d'annulation.");
  }

  const { data: pending } = await supabaseAdmin
    .from("flex_cancellations")
    .select("id")
    .eq("flex_account_id", account.id)
    .eq("status", "PENDING")
    .maybeSingle();
  if (pending) return { requestId: pending.id, created: false };

  const paidAmount = Number(account.paid_amount);
  const { cancellationFeePercent } = await getFlexSettings();

  // Garder le montant en crédit boutique évite un remboursement en cash
  // (et ses frais de transfert Wave/Orange Money) : aucun frais dans ce cas.
  // Un remboursement en espèces retient les frais d'annulation configurés.
  const feeAmount = input.keepAsCredit
    ? 0
    : Math.round((paidAmount * cancellationFeePercent) / 100);
  const refundableAmount = paidAmount - feeAmount;

  const { data, error: insertError } = await supabaseAdmin
    .from("flex_cancellations")
    .insert({
      flex_account_id: account.id,
      user_id: input.userId,
      reason: input.reason ?? null,
      paid_amount: paidAmount,
      refundable_amount: refundableAmount,
      fee_amount: feeAmount,
      keep_as_credit: input.keepAsCredit,
      status: "PENDING",
    })
    .select("id")
    .single();
  if (insertError) throw new Error(insertError.message);

  await supabaseAdmin.from("notifications").insert({
    user_id: input.userId,
    title: "Demande d'annulation Flex envoyée",
    body: input.keepAsCredit
      ? `Votre demande est en cours d'examen. ${refundableAmount} FCFA seront conservés en crédit, sans frais.`
      : `Votre demande est en cours d'examen. Montant remboursable estimé : ${refundableAmount} FCFA (frais de ${cancellationFeePercent}% déduits).`,
    channel: "IN_APP",
    audience: "USER",
  });

  return { requestId: data.id, created: true };
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

  const tontine = (member as { tontines?: { contribution_amount?: number; name?: string } | null })
    .tontines;
  const amount = Number(tontine?.contribution_amount ?? 0);
  if (!amount) throw new Error("Montant de cotisation indisponible.");

  const { data: paymentRow, error: paymentError } = await supabaseAdmin
    .from("payments")
    .insert({
      user_id: input.userId,
      amount,
      payment_method: input.method,
      external_reference: reference("PAY"),
      status: "PENDING",
      tontine_id: member.tontine_id,
      tontine_member_id: member.id,
    })
    .select("id,external_reference")
    .single();
  if (paymentError) throw new Error(paymentError.message);

  const { redirectUrl } = await createPaytechPayment({
    refCommand: paymentRow.external_reference!,
    amount,
    itemName: `Cotisation — ${tontine?.name ?? "Tontine"}`,
    commandName: `Cotisation tontine ${tontine?.name ?? ""}`.trim(),
    customField: { tontineMemberId: member.id, paymentId: paymentRow.id },
  });

  return { redirectUrl };
}

// ---------------------------------------------------------------------------
// PayTech : confirmation d'un paiement via IPN (webhook serveur à serveur)
// ---------------------------------------------------------------------------

/**
 * Appelée uniquement depuis le handler IPN (src/server.ts), après vérification
 * de la signature PayTech.
 *
 * 📚 CONCEPT DEVOPS/FIABILITÉ — Idempotence :
 * Une opération est "idempotente" quand l'exécuter plusieurs fois produit
 * exactement le même résultat que l'exécuter une seule fois. C'est essentiel
 * pour un webhook, car le réseau n'est jamais fiable à 100% : PayTech peut
 * renvoyer la MÊME notification plusieurs fois (timeout de notre côté, retry
 * automatique chez eux, etc.). Sans idempotence, un client qui verse 10 000
 * FCFA pourrait se voir crédité deux fois si la notification arrive en double.
 * La ligne `if (payment.status !== "PENDING") return { alreadyProcessed:
 * true }` juste en dessous est LA protection contre ce scénario : dès que le
 * paiement est passé à SUCCESS une première fois, toute notification
 * ultérieure pour la même référence est ignorée sans effet de bord.
 */
export async function confirmPaytechPayment(input: {
  refCommand: string;
  succeeded: boolean;
  paymentMethod?: string | undefined;
}) {
  const { data: payment, error } = await supabaseAdmin
    .from("payments")
    .select("id,status,amount,order_id,flex_account_id,tontine_id,tontine_member_id,user_id")
    .eq("external_reference", input.refCommand)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!payment) {
    // Référence inconnue : on répond quand même 200 à PayTech (rien à
    // retraiter côté nous), mais on log pour investigation.
    console.error(`PayTech IPN: paiement introuvable pour ref_command=${input.refCommand}`);
    return { handled: false };
  }
  if (payment.status !== "PENDING") {
    // Déjà traité (notification dupliquée) — no-op. Voir le commentaire
    // "Idempotence" ci-dessus : c'est la ligne qui protège contre le
    // double-comptage d'un paiement notifié plusieurs fois par PayTech.
    return { handled: true, alreadyProcessed: true };
  }

  const newStatus = input.succeeded ? "SUCCESS" : "FAILED";
  const updatePayload: {
    status: "SUCCESS" | "FAILED";
    confirmed_at: string | null;
    payment_method?: string;
  } = {
    status: newStatus,
    confirmed_at: input.succeeded ? new Date().toISOString() : null,
  };
  if (input.paymentMethod) updatePayload.payment_method = input.paymentMethod;

  await supabaseAdmin.from("payments").update(updatePayload).eq("id", payment.id);

  if (!input.succeeded) {
    if (payment.order_id) {
      await supabaseAdmin.from("orders").update({ status: "CANCELLED" }).eq("id", payment.order_id);
    }
    await supabaseAdmin.from("notifications").insert({
      user_id: payment.user_id,
      title: "Paiement échoué",
      body: "Votre paiement n'a pas pu être confirmé. Vous pouvez réessayer depuis votre espace.",
      channel: "IN_APP",
      audience: "USER",
    });
    return { handled: true };
  }

  // --- Commande Cash payée avec succès ---
  if (payment.order_id) {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,reference,status,product_id")
      .eq("id", payment.order_id)
      .maybeSingle();
    if (!order || order.status !== "PENDING") return { handled: true };

    await supabaseAdmin.from("orders").update({ status: "PAID" }).eq("id", order.id);

    // Décrémente le stock de CHAQUE ligne de la commande (order_items),
    // pas seulement du product_id "principal" — généralisation nécessaire
    // depuis l'introduction du panier multi-produits (placeCartOrder) ;
    // se comporte identiquement à avant pour les commandes mono-produit,
    // qui n'ont toujours qu'une seule ligne order_items (quantity: 1).
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("product_id,quantity")
      .eq("order_id", order.id);
    for (const item of items ?? []) {
      if (!item.product_id) continue;
      const { data: product } = await supabaseAdmin
        .from("products")
        .select("id,stock_quantity")
        .eq("id", item.product_id)
        .maybeSingle();
      if (product) {
        await supabaseAdmin
          .from("products")
          .update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) })
          .eq("id", product.id);
      }
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: payment.user_id,
      title: `Paiement confirmé — commande ${order.reference}`,
      body: "Votre paiement a été reçu. Votre commande est en préparation.",
      channel: "IN_APP",
      audience: "USER",
    });
    return { handled: true };
  }

  // --- Versement Flex payé avec succès ---
  if (payment.flex_account_id) {
    const { data: account } = await supabaseAdmin
      .from("flex_accounts")
      .select("id,target_amount,paid_amount")
      .eq("id", payment.flex_account_id)
      .maybeSingle();
    if (!account) return { handled: true };

    // Idempotence : si ce paiement a déjà généré un dépôt (notification
    // dupliquée arrivée après coup), on ne double-compte pas.
    const { data: existingDeposit } = await supabaseAdmin
      .from("flex_deposits")
      .select("id")
      .eq("payment_id", payment.id)
      .maybeSingle();
    if (!existingDeposit) {
      await supabaseAdmin.from("flex_deposits").insert({
        flex_account_id: account.id,
        payment_id: payment.id,
        amount: payment.amount,
      });
    }

    const remaining = Math.max(
      0,
      Number(account.target_amount) - Number(account.paid_amount) - Number(payment.amount),
    );
    await supabaseAdmin.from("notifications").insert({
      user_id: payment.user_id,
      title: "Versement Flex confirmé",
      body: `Dépôt de ${payment.amount} FCFA reçu. Solde restant : ${remaining} FCFA.`,
      channel: "IN_APP",
      audience: "USER",
    });

    await finalizeFlexAccountIfCompleted(account.id);
    return { handled: true };
  }

  // --- Cotisation Tontine payée avec succès ---
  if (payment.tontine_member_id && payment.tontine_id) {
    const tontineId = payment.tontine_id;
    const { data: member } = await supabaseAdmin
      .from("tontine_members")
      .select("id,paid_amount,tontines(name)")
      .eq("id", payment.tontine_member_id)
      .maybeSingle();
    if (!member) return { handled: true };

    const { data: existingContribution } = await supabaseAdmin
      .from("tontine_contributions")
      .select("id")
      .eq("payment_id", payment.id)
      .maybeSingle();
    if (!existingContribution) {
      const today = new Date().toISOString().slice(0, 10);
      await supabaseAdmin.from("tontine_contributions").insert({
        tontine_id: tontineId,
        member_id: member.id,
        amount: payment.amount,
        due_date: today,
        status: "PAID",
        payment_id: payment.id,
        reference: input.refCommand,
        paid_at: new Date().toISOString(),
      });
      await supabaseAdmin
        .from("tontine_members")
        .update({
          paid_amount: Number(member.paid_amount) + Number(payment.amount),
          status: "ACTIVE",
        })
        .eq("id", member.id);
    }

    const tontineName =
      (member as { tontines?: { name?: string } | null }).tontines?.name ?? "la tontine";
    await supabaseAdmin.from("notifications").insert({
      user_id: payment.user_id,
      title: "Cotisation confirmée",
      body: `Votre cotisation de ${payment.amount} FCFA pour « ${tontineName} » est enregistrée.`,
      channel: "IN_APP",
      audience: "USER",
    });
    return { handled: true };
  }

  return { handled: true };
}
