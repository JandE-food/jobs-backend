import { FastifyInstance } from "fastify";

import {
  BillingPlan,
  isBillingProvider,
  getBillingProvider,
  getPeriodEnd,
  isBillingPlan,
} from "../lib/billing.js";
import { createFlutterwaveCheckout } from "../lib/flutterwave.js";
import { createPaystackCheckout } from "../lib/paystack.js";
import { getUserIdFromRequest } from "../lib/request-context.js";
import { createStripeCheckout } from "../lib/stripe.js";
import { getSubscription, upsertSubscription } from "../lib/subscriptions.js";

type CheckoutBody = {
  plan?: string;
  country?: string;
  provider?: string;
};

export async function registerBillingRoutes(app: FastifyInstance) {
  app.get("/billing/subscription", async (request) => {
    const userId = await getUserIdFromRequest(request);
    const subscription = await getSubscription(userId);

    return {
      userId,
      subscription,
    };
  });

  app.post<{ Body: CheckoutBody }>(
    "/billing/create-checkout",
    async (request, reply) => {
      const userId = await getUserIdFromRequest(request);
      const plan = request.body?.plan;
      const country = request.body?.country?.trim() || "UK";
      const requestedProvider = request.body?.provider;
      const providerOverride = isBillingProvider(requestedProvider ?? "")
        ? requestedProvider
        : undefined;

      if (!plan || !isBillingPlan(plan)) {
        reply.code(400).send({
          error: "Invalid plan. Use free, growth, scale, or enterprise.",
        });
        return;
      }

      if (plan === "free") {
        const provider = getBillingProvider(country, providerOverride);
        const subscription = await upsertSubscription({
          userId,
          plan,
          provider,
          status: "active",
          currentPeriodEnd: getPeriodEnd(plan),
        });

        return {
          provider,
          mode: "internal",
          plan,
          subscription,
          checkoutUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/billing/active?plan=${plan}&provider=${provider}`,
        };
      }

      const provider = getBillingProvider(country, providerOverride);
      const planForCheckout = plan as Exclude<BillingPlan, "free">;

      if (provider === "stripe") {
        return createStripeCheckout({
          userId,
          plan: planForCheckout,
          country,
        });
      }

      if (provider === "flutterwave") {
        return createFlutterwaveCheckout({
          userId,
          plan: planForCheckout,
          country,
        });
      }

      return createPaystackCheckout({
        userId,
        plan: planForCheckout,
        country,
      });
    },
  );
}
