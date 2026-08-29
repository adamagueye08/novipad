/**
 * Intégration PayTech (paiement en ligne Wave / Orange Money / carte bancaire).
 * Documentation officielle : https://docs.intech.sn/doc_paytech.php
 *
 * Variables d'environnement requises (à définir sur l'hébergeur, jamais commitées) :
 * - PAYTECH_API_KEY
 * - PAYTECH_API_SECRET
 * - PAYTECH_ENV        ("test" ou "prod" — reste "test" tant que le compte
 *                        PayTech n'est pas activé en production par leur équipe)
 * - PUBLIC_APP_URL      URL publique du site, ex: https://novipad.pages.dev
 *                        (sert à construire les URLs ipn_url/success_url/cancel_url)
 */

const PAYTECH_BASE_URL = "https://paytech.sn/api";

function getPaytechConfig() {
  const apiKey = process.env["PAYTECH_API_KEY"];
  const apiSecret = process.env["PAYTECH_API_SECRET"];
  const appUrl = process.env["PUBLIC_APP_URL"];
  const env = process.env["PAYTECH_ENV"] === "prod" ? "prod" : "test";
  if (!apiKey || !apiSecret || !appUrl) {
    throw new Error(
      "PayTech n'est pas configuré : définissez PAYTECH_API_KEY, PAYTECH_API_SECRET et PUBLIC_APP_URL dans les variables d'environnement.",
    );
  }
  return { apiKey, apiSecret, appUrl, env };
}

type PaytechRequestResponse = {
  success?: number;
  token?: string;
  redirect_url?: string;
  message?: string;
};

/** Crée une demande de paiement PayTech et renvoie l'URL de checkout vers laquelle rediriger le client. */
export async function createPaytechPayment(input: {
  refCommand: string;
  amount: number;
  itemName: string;
  commandName: string;
  customField?: Record<string, unknown>;
}) {
  const { apiKey, apiSecret, appUrl, env } = getPaytechConfig();

  const body = {
    item_name: input.itemName,
    item_price: input.amount,
    currency: "XOF",
    ref_command: input.refCommand,
    command_name: input.commandName,
    env,
    ipn_url: `${appUrl}/api/paytech/ipn`,
    success_url: `${appUrl}/paiement/succes?ref=${encodeURIComponent(input.refCommand)}`,
    cancel_url: `${appUrl}/paiement/annule?ref=${encodeURIComponent(input.refCommand)}`,
    custom_field: JSON.stringify(input.customField ?? {}),
  };

  const response = await fetch(`${PAYTECH_BASE_URL}/payment/request-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      API_KEY: apiKey,
      API_SECRET: apiSecret,
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json().catch(() => null)) as PaytechRequestResponse | null;
  if (!json || json.success !== 1 || !json.redirect_url) {
    throw new Error(json?.message ?? "Échec de la création du paiement PayTech.");
  }

  return { token: json.token ?? null, redirectUrl: json.redirect_url };
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type PaytechIpnFields = {
  type_event?: string;
  ref_command?: string;
  item_price?: string;
  final_item_price?: string;
  payment_method?: string;
  client_phone?: string;
  custom_field?: string;
  api_key_sha256?: string;
  api_secret_sha256?: string;
  hmac_compute?: string;
};

/**
 * Vérifie qu'une notification IPN provient bien de PayTech.
 * Méthode HMAC-SHA256 en priorité (recommandée par PayTech), repli sur la
 * comparaison des clés API hachées en SHA256 si hmac_compute est absent.
 */
export async function verifyPaytechIpn(fields: PaytechIpnFields): Promise<boolean> {
  const { apiKey, apiSecret } = getPaytechConfig();

  if (fields.hmac_compute) {
    const amount = fields.final_item_price ?? fields.item_price ?? "";
    const message = `${amount}|${fields.ref_command ?? ""}|${apiKey}`;
    const expected = await hmacSha256Hex(message, apiSecret);
    return expected === fields.hmac_compute;
  }

  if (fields.api_key_sha256 && fields.api_secret_sha256) {
    const [expectedKey, expectedSecret] = await Promise.all([
      sha256Hex(apiKey),
      sha256Hex(apiSecret),
    ]);
    return expectedKey === fields.api_key_sha256 && expectedSecret === fields.api_secret_sha256;
  }

  return false;
}
