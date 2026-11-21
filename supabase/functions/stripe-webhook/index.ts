import Stripe from "https://esm.sh/stripe@17.7.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createStripeClient } from "../_shared/stripe.ts"

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed.", { status: 405 })

  const signature = request.headers.get("stripe-signature")
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")
  if (!signature || !webhookSecret) {
    return new Response("Stripe webhook is not configured.", { status: 400 })
  }

  let event
  try {
    const stripe = createStripeClient()
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    )
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error)
    return new Response("Invalid Stripe signature.", { status: 400 })
  }

  try {
    let subscription
    let checkoutSession

    if (event.type === "checkout.session.completed") {
      checkoutSession = event.data.object
      if (checkoutSession.mode !== "subscription" || !checkoutSession.subscription) {
        return new Response("Event ignored.", { status: 200 })
      }
      const stripe = createStripeClient()
      subscription = await stripe.subscriptions.retrieve(checkoutSession.subscription)
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      subscription = event.data.object
    } else {
      return new Response("Event ignored.", { status: 200 })
    }

    const userId = subscription.metadata.supabase_user_id || checkoutSession?.client_reference_id
    const planId = subscription.metadata.plan_id
    const customerId = typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id
    const priceId = subscription.items.data[0]?.price.id

    if (!userId || !planId || !priceId) {
      console.error("Subscription event is missing user, plan, or price metadata.")
      return new Response("Subscription metadata is incomplete.", { status: 400 })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase billing is not configured.")

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { error } = await adminClient.from("billing_subscriptions").upsert({
      stripe_subscription_id: subscription.id,
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      plan_id: planId,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }, { onConflict: "stripe_subscription_id" })

    if (error) throw error
    return new Response("Webhook processed.", { status: 200 })
  } catch (error) {
    console.error("Unable to process Stripe webhook:", error)
    return new Response("Webhook processing failed.", { status: 500 })
  }
})
