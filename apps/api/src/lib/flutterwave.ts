import { BillingPlan, getPeriodEnd, getPlanConfig, normalizeCountry } from "./billing.js";
import { getUserById } from "./db.js";
import { upsertSubscription } from "./subscriptions.js";

type FlutterwavePayload = {
  event?: string;
  data?: {
    id?: number;
    status?: string;
    tx_ref?: string;
    currency?: string;
    amount?: number;
    meta?: {
      userId?: number | string;
      plan?: BillingPlan;
      country?: string;
      provider?: string;
    };
  };
};

function getFlutterwaveCurrency(country: string) {
  const normalized = normalizeCountry(country);

  switch (normalized) {
    case "ng":
    case "nigeria":
      return "NGN";
    case "gh":
    case "ghana":
      return "GHS";
    case "ke":
    case "kenya":
      return "KES";
    case "ug":
    case "uganda":
      return "UGX";
    case "tz":
    case "tanzania":
      return "TZS";
    case "rw":
    case "rwanda":
      return "RWF";
    case "za":
    case "south africa":
      return "ZAR";
    default:
      return "USD";
  }
}

async function verifyFlutterwaveTransaction(transactionId: number) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Flutterwave verify failed: ${message}`);
  }

  return (await response.json()) as {
    status?: string;
    data?: {
      status?: string;
      meta?: {
        userId?: number | string;
        plan?: BillingPlan;
      };
    };
  };
}

export async function createFlutterwaveCheckout(input: {
  userId: number;
  plan: Exclude<BillingPlan, "free">;
  country: string;
}) {
  const user = await getUserById(input.userId);
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  if (!user) {
    throw new Error("User not found.");
  }

  if (!secretKey) {
    await upsertSubscription({
      userId: input.userId,
      plan: input.plan,
      provider: "flutterwave",
      status: "active",
      currentPeriodEnd: getPeriodEnd(input.plan),
    });

    return {
      provider: "flutterwave" as const,
      mode: "mock" as const,
      checkoutUrl: `${appUrl}/billing/active?provider=flutterwave&plan=${input.plan}&mock=true`,
    };
  }

  const config = getPlanConfig(input.plan);
  const txRef = `bejeli-${input.userId}-${input.plan}-${Date.now()}`;
  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: config.amountMinor / 100,
      currency: getFlutterwaveCurrency(input.country),
      redirect_url: `${appUrl}/billing/active?provider=flutterwave`,
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: user.email,
      },
      customizations: {
        title: "BEJELI Recruiter Billing",
        description: `${config.name} subscription`,
      },
      meta: {
        userId: input.userId,
        plan: input.plan,
        country: input.country,
        provider: "flutterwave",
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Flutterwave checkout failed: ${message}`);
  }

  const payload = (await response.json()) as {
    data?: { link?: string };
  };

  return {
    provider: "flutterwave" as const,
    mode: "live" as const,
    checkoutUrl:
      payload.data?.link ??
      `${appUrl}/billing/active?provider=flutterwave`,
  };
}

export function verifyFlutterwaveSignature(signature?: string) {
  const webhookHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;

  if (!webhookHash) {
    return true;
  }

  if (!signature) {
    return false;
  }

  return signature === webhookHash;
}

export async function handleFlutterwaveWebhook(rawBody: string) {
  const payload = JSON.parse(rawBody) as FlutterwavePayload;
  const transactionId = Number(payload.data?.id);
  const verified =
    Number.isFinite(transactionId) && transactionId > 0
      ? await verifyFlutterwaveTransaction(transactionId)
      : null;

  const eventType = payload.event ?? "unknown";
  const paymentStatus = verified?.data?.status ?? payload.data?.status;
  const userId = Number(
    verified?.data?.meta?.userId ?? payload.data?.meta?.userId,
  );
  const plan = verified?.data?.meta?.plan ?? payload.data?.meta?.plan;

  if (
    eventType === "charge.completed" &&
    paymentStatus === "successful" &&
    userId &&
    plan &&
    plan !== "free"
  ) {
    await upsertSubscription({
      userId,
      plan,
      provider: "flutterwave",
      status: "active",
      currentPeriodEnd: getPeriodEnd(plan),
    });
  }

  return eventType;
}
