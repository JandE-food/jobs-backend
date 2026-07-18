import crypto from "node:crypto";

import { BillingPlan, getPeriodEnd, getPlanConfig } from "./billing.js";
import { getUserById } from "./db.js";
import { upsertSubscription } from "./subscriptions.js";

export async function createPaystackCheckout(input: {
  userId: number;
  plan: Exclude<BillingPlan, "free">;
  country: string;
}) {
  const user = await getUserById(input.userId);
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const planCode =
    input.plan === "growth"
      ? process.env.PAYSTACK_PLAN_CODE_GROWTH
      : process.env.PAYSTACK_PLAN_CODE_SCALE;

  if (!user) {
    throw new Error("User not found.");
  }

  if (!secretKey) {
    await upsertSubscription({
      userId: input.userId,
      plan: input.plan,
      provider: "paystack",
      status: "active",
      currentPeriodEnd: getPeriodEnd(input.plan),
    });

    return {
      provider: "paystack" as const,
      mode: "mock" as const,
      checkoutUrl: `${appUrl}/billing/active?provider=paystack&plan=${input.plan}&mock=true`,
    };
  }

  const config = getPlanConfig(input.plan);
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: config.amountMinor * 100,
      callback_url: `${appUrl}/billing/active?provider=paystack`,
      plan: planCode ?? undefined,
      metadata: {
        userId: input.userId,
        plan: input.plan,
        country: input.country,
        provider: "paystack",
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Paystack checkout failed: ${message}`);
  }

  const payload = (await response.json()) as {
    data?: { authorization_url?: string };
  };

  return {
    provider: "paystack" as const,
    mode: "live" as const,
    checkoutUrl:
      payload.data?.authorization_url ??
      `${appUrl}/billing/active?provider=paystack`,
  };
}

export function verifyPaystackSignature(rawBody: string, signature?: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey || !signature) {
    return true;
  }

  const digest = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  return digest === signature;
}

export async function handlePaystackWebhook(rawBody: string) {
  const payload = JSON.parse(rawBody) as {
    event?: string;
    data?: {
      metadata?: {
        userId?: number | string;
        plan?: BillingPlan;
      };
    };
  };

  if (payload.event === "charge.success") {
    const userId = Number(payload.data?.metadata?.userId);
    const plan = payload.data?.metadata?.plan;

    if (userId && plan && plan !== "free") {
      await upsertSubscription({
        userId,
        plan,
        provider: "paystack",
        status: "active",
        currentPeriodEnd: getPeriodEnd(plan),
      });
    }
  }

  return payload.event ?? "unknown";
}
