import Stripe from "https://esm.sh/stripe@17.7.0?target=deno"

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

export function createStripeClient() {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY")
  if (!secretKey?.startsWith("sk_test_")) {
    throw new Error("A Stripe test-mode secret key (sk_test_) is required.")
  }

  return new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient(),
  })
}

export function getAppUrl() {
  const appUrl = Deno.env.get("APP_URL")
  if (!appUrl) throw new Error("APP_URL is not configured.")

  const url = new URL(appUrl)
  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1"
  if (url.protocol !== "https:" && !(isLocalhost && url.protocol === "http:")) {
    throw new Error("APP_URL must use HTTPS except for localhost development.")
  }

  return url.origin
}
