/**
 * ============================================================================
 * POINT D'ENTRÉE RÉSEAU DE L'APPLICATION (Cloudflare Worker)
 * ============================================================================
 * Ce fichier n'est PAS un fichier "normal" de l'application React — c'est le
 * tout premier code exécuté quand une requête HTTP arrive sur le serveur,
 * AVANT même que le routeur (TanStack Router) ou React ne s'en mêlent.
 *
 * 📚 CONCEPT CLOUD — "Serverless" :
 * Sur un serveur classique (VPS), un process Node.js tourne en permanence,
 * écoute un port, et traite les requêtes une par une. Ici, il n'y a AUCUN
 * process qui tourne en permanence : Cloudflare exécute la fonction
 * `fetch(request)` ci-dessous à la demande, pour CHAQUE requête, sur l'un de
 * ses centaines de centres de données dans le monde (le plus proche du
 * visiteur). Pas de serveur à gérer, pas de mise à jour à faire, aucune
 * facturation quand personne ne visite le site.
 *
 * 📚 CONCEPT CYBERSÉCURITÉ — pourquoi le webhook PayTech est traité ICI :
 * Le reste de l'app communique avec le serveur via `createServerFn`
 * (TanStack Start), qui est protégé par un jeton CSRF (Cross-Site Request
 * Forgery) — un jeton secret que seul le navigateur du client légitime
 * possède, pour empêcher un site tiers d'appeler nos fonctions serveur à
 * l'insu de l'utilisateur. Mais PayTech, lui, appelle notre serveur
 * directement depuis SES serveurs (pas depuis un navigateur) : il n'a pas ce
 * jeton et ne peut pas en avoir. Il faut donc une porte d'entrée séparée,
 * SANS protection CSRF — mais avec une AUTRE protection à la place (voir
 * verifyPaytechIpn dans paytech.server.ts) : la vérification de signature
 * HMAC, qui prouve que la requête vient bien de PayTech et n'a pas été
 * modifiée en chemin.
 * ============================================================================
 */

import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { verifyPaytechIpn, type PaytechIpnFields } from "./lib/paytech.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

/**
 * Webhook PayTech (IPN = Instant Payment Notification) — traité ici, en amont
 * du routeur applicatif, car PayTech envoie une requête POST serveur-à-serveur
 * sans jeton CSRF : elle ne peut pas passer par le mécanisme createServerFn
 * (protégé par CSRF).
 *
 * 📚 CONCEPT CYBERSÉCURITÉ — ne JAMAIS faire confiance à une redirection :
 * Après un paiement, PayTech redirige le NAVIGATEUR du client vers
 * success_url. On pourrait être tenté de considérer ça comme "le paiement a
 * réussi". C'EST UNE FAILLE DE SÉCURITÉ : n'importe qui peut taper l'URL de
 * succès dans son navigateur sans avoir payé un centime — une redirection
 * n'est qu'une suggestion visuelle, jamais une preuve. La SEULE preuve
 * fiable est cette notification serveur-à-serveur (IPN), signée
 * cryptographiquement, que PayTech envoie en coulisses. C'est pourquoi
 * confirmPaytechPayment() n'est appelée QUE depuis ici, jamais depuis les
 * pages /paiement/succes ou /paiement/annule.
 */
async function handlePaytechIpn(request: Request): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let fields: PaytechIpnFields;
  try {
    const form = await request.formData();
    fields = Object.fromEntries(form.entries()) as unknown as PaytechIpnFields;
  } catch (error) {
    console.error("PayTech IPN: corps de requête illisible", error);
    return new Response("Bad Request", { status: 400 });
  }

  // Étape 1 — Authentifier l'expéditeur AVANT de faire quoi que ce soit
  // d'autre. On vérifie la signature HMAC envoyée par PayTech ; si elle ne
  // correspond pas (requête forgée, corrompue, ou rejouée avec de mauvaises
  // clés), on rejette immédiatement — aucune donnée n'est jamais traitée
  // sans authentification préalable.
  let authentic = false;
  try {
    authentic = await verifyPaytechIpn(fields);
  } catch (error) {
    console.error("PayTech IPN: erreur de vérification de signature", error);
    return new Response("Internal Server Error", { status: 500 });
  }
  if (!authentic) {
    console.error("PayTech IPN: signature invalide, notification rejetée");
    return new Response("Forbidden", { status: 403 });
  }

  // Étape 2 — Traiter la notification. confirmPaytechPayment() est conçue
  // pour être IDEMPOTENTE (voir son commentaire dans checkout.server.ts) :
  // PayTech peut renvoyer la même notification plusieurs fois (perte réseau,
  // timeout...), il ne faut jamais compter un paiement deux fois.
  try {
    const { confirmPaytechPayment } = await import("./lib/checkout.server");
    await confirmPaytechPayment({
      refCommand: fields.ref_command ?? "",
      succeeded: fields.type_event === "sale_complete",
      paymentMethod: fields.payment_method,
    });
  } catch (error) {
    console.error("PayTech IPN: erreur lors du traitement", error);
    return new Response("Internal Server Error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/paytech/ipn") {
        return await handlePaytechIpn(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
