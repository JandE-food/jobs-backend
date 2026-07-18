import { FastifyInstance } from "fastify";

import {
  BillingPlan,
  getBillingProvider,
  getPeriodEnd,
  isBillingPlan,
} from "../lib/billing.js";
import { createPaystackCheckout } from "../lib/paystack.js";
import { getUserIdFromRequest } from "../lib/request-context.js";
import { createStripeCheckout } from "../lib/stripe.js";
import { getSubscription, upsertSubscription } from "../lib/subscriptions.js";

type CheckoutBody = {
  plan?: string;
  country?: string;
};

export async function registerBillingRoutes(app: FastifyInstance) {
  app.get("/billing/subscription", async (request) => {
    const userId = getUserIdFromRequest(request);
    const subscription = await getSubscription(userId);

    return {
      userId,
      subscription,
    };
  });

  app.post<{ Body: CheckoutBody }>(
    "/billing/create-checkout",
    async (request, reply) => {
      const userId = getUserIdFromRequest(request);
      const plan = request.body?.plan;
      const country = request.body?.country?.trim() || "UK";

      if (!plan || !isBillingPlan(plan)) {
        reply.code(400).send({
          error: "Invalid plan. Use free, growth, or scale.",
        });
        return;
      }

      if (plan === "free") {
        const subscription = await upsertSubscription({
          userId,
          plan,
          provider: "stripe",
          status: "active",
          currentPeriodEnd: getPeriodEnd(plan),
        });

        return {
          provider: "stripe",
          mode: "internal",
          plan,
          subscription,
          checkoutUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/billing/active?plan=${plan}&provider=stripe`,
        };
      }

      const provider = getBillingProvider(country);
      const planForCheckout = plan as Exclude<BillingPlan, "free">;

      if (provider === "stripe") {
        return createStripeCheckout({
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
