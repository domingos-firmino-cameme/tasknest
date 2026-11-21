import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders, createStripeClient, getAppUrl, jsonResponse } from "../_shared/stripe.ts"

const plans = {
  pro: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY"),
  team: Deno.env.get("STRIPE_PRICE_TEAM_MONTHLY"),
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405)

  try {
    const authorization = request.headers.get("Authorization")
    if (!authorization) return jsonResponse({ error: "Sign in before choosing a plan." }, 401)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
    if (!supabaseUrl || !anonKey) throw new Error("Supabase authentication is not configured.")

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return jsonResponse({ error: "Your session is invalid. Sign in again." }, 401)
    if (!user.email) return jsonResponse({ error: "An email address is required for subscription checkout." }, 400)

    const { planId } = await request.json()
    if (planId !== "pro" && planId !== "team") {
      return jsonResponse({ error: "Choose a valid paid plan." }, 400)
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!serviceRoleKey) throw new Error("Supabase billing is not configured.")
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: activeSubscription, error: subscriptionError } = await adminClient
      .from("billing_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .limit(1)
      .maybeSingle()

    if (subscriptionError) throw subscriptionError
    if (activeSubscription) {
      return jsonResponse({ error: "You already have a subscription. Manage it in the billing portal." }, 409)
    }

    const priceId = plans[planId]
    if (!priceId?.startsWith("price_")) throw new Error(`Stripe price for the ${planId} plan is not configured.`)

    const stripe = createStripeClient()
    const appUrl = getAppUrl()
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { supabase_user_id: user.id, plan_id: planId },
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan_id: planId },
      },
      success_url: `${appUrl}/dashboard?billing=success`,
      cancel_url: `${appUrl}/dashboard?billing=cancelled`,
    })

    if (!session.url) throw new Error("Stripe did not return a checkout URL.")
    return jsonResponse({ url: session.url })
  } catch (error) {
    console.error("Unable to create Stripe checkout session:", error)
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unable to start checkout.",
    }, 500)
  }
})
