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
 * Webhook PayTech (IPN) — traité ici, en amont du routeur applicatif, car
 * PayTech envoie une requête POST serveur-à-serveur sans jeton CSRF : elle ne
 * peut pas passer par le mécanisme createServerFn (protégé par CSRF).
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
