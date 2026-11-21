import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders, createStripeClient, getAppUrl, jsonResponse } from "../_shared/stripe.ts"

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405)

  try {
    const authorization = request.headers.get("Authorization")
    if (!authorization) return jsonResponse({ error: "Sign in to manage your subscription." }, 401)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Supabase billing is not configured.")
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return jsonResponse({ error: "Your session is invalid. Sign in again." }, 401)

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: subscription, error: subscriptionError } = await adminClient
      .from("billing_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) throw subscriptionError
    if (!subscription?.stripe_customer_id) {
      return jsonResponse({ error: "No active Stripe subscription was found for this account." }, 404)
    }

    const stripe = createStripeClient()
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${getAppUrl()}/dashboard`,
    })

    return jsonResponse({ url: portal.url })
  } catch (error) {
    console.error("Unable to create Stripe billing portal session:", error)
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unable to open billing settings.",
    }, 500)
  }
})
