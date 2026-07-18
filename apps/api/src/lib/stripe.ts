import Stripe from "stripe";

import { BillingPlan, getPeriodEnd } from "./billing.js";
import { getUserById } from "./db.js";
import { upsertSubscription } from "./subscriptions.js";

function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    return null;
  }

  return new Stripe(apiKey);
}

function getStripePriceId(plan: BillingPlan) {
  const priceIds: Partial<Record<BillingPlan, string>> = {
    growth: process.env.STRIPE_PRICE_GROWTH,
    scale: process.env.STRIPE_PRICE_SCALE,
  };

  return priceIds[plan] ?? null;
}

export async function createStripeCheckout(input: {
  userId: number;
  plan: Exclude<BillingPlan, "free">;
  country: string;
}) {
  const user = await getUserById(input.userId);
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const stripe = getStripeClient();
  const priceId = getStripePriceId(input.plan);

  if (!user) {
    throw new Error("User not found.");
  }

  if (!stripe || !priceId) {
    await upsertSubscription({
      userId: input.userId,
      plan: input.plan,
      provider: "stripe",
      status: "active",
      currentPeriodEnd: getPeriodEnd(input.plan),
    });

    return {
      provider: "stripe" as const,
      mode: "mock" as const,
      checkoutUrl: `${appUrl}/billing/active?provider=stripe&plan=${input.plan}&mock=true`,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    success_url: `${appUrl}/billing/active?provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?cancelled=true`,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: String(input.userId),
      plan: input.plan,
      country: input.country,
      provider: "stripe",
    },
  });

  return {
    provider: "stripe" as const,
    mode: "live" as const,
    checkoutUrl: session.url ?? `${appUrl}/billing/active?provider=stripe`,
  };
}

export async function handleStripeWebhook(input: {
  rawBody: string;
  signature?: string;
}) {
  const stripe = getStripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (stripe && secret && input.signature) {
    event = stripe.webhooks.constructEvent(
      input.rawBody,
      input.signature,
      secret,
    );
  } else {
    event = JSON.parse(input.rawBody) as Stripe.Event;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};
    const userId = Number(metadata.userId);
    const plan = metadata.plan as BillingPlan | undefined;

    if (userId && plan && plan !== "free") {
      await upsertSubscription({
        userId,
        plan,
        provider: "stripe",
        status: "active",
        currentPeriodEnd: getPeriodEnd(plan),
      });
    }
  }

  return event.type;
}
