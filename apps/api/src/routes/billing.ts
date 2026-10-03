import { FastifyInstance } from "fastify";

import {
  isBillingProvider,
  getBillingProvider,
  isBillingPlan,
} from "../lib/billing.js";
import { createFlutterwaveCheckout } from "../lib/flutterwave.js";
import { createPaystackCheckout } from "../lib/paystack.js";
import { getUserIdFromRequest } from "../lib/request-context.js";
import { createStripeCheckout } from "../lib/stripe.js";
import { getSubscriptionEntitlements } from "../lib/subscriptions.js";

type CheckoutBody = {
  plan?: string;
  country?: string;
  provider?: string;
};

export async function registerBillingRoutes(app: FastifyInstance) {
  app.get("/billing/subscription", async (request) => {
    const userId = await getUserIdFromRequest(request);
    const entitlementSummary = await getSubscriptionEntitlements(userId);

    return {
      userId,
      subscription: entitlementSummary.subscription,
      entitlements: {
        active: entitlementSummary.active,
        monthlyEndorsements: entitlementSummary.monthlyEndorsements,
        endorsementsUsedThisMonth: entitlementSummary.endorsementsUsedThisMonth,
        remainingEndorsements: entitlementSummary.remainingEndorsements,
        premium: entitlementSummary.premium,
        audience: entitlementSummary.audience,
        tier: entitlementSummary.tier,
        planName: entitlementSummary.planName,
      },
    };
  });

  app.post<{ Body: CheckoutBody }>(
    "/billing/create-checkout",
    async (request, reply) => {
      const userId = await getUserIdFromRequest(request);
      const plan = request.body?.plan;
      const country = request.body?.country?.trim() || "UK";
      const requestedProvider = request.body?.provider;
      const providerOverride =
        requestedProvider && isBillingProvider(requestedProvider)
          ? requestedProvider
          : undefined;

      if (!plan || !isBillingPlan(plan)) {
        reply.code(400).send({
          error:
            "Invalid plan. Use user_basic, company_basic, user_premium, or company_premium.",
        });
        return;
      }

      const provider = getBillingProvider(country, providerOverride);

      if (provider === "stripe") {
        return createStripeCheckout({
          userId,
          plan,
          country,
        });
      }

      if (provider === "flutterwave") {
        return createFlutterwaveCheckout({
          userId,
          plan,
          country,
        });
      }

      return createPaystackCheckout({
        userId,
        plan,
        country,
      });
    },
  );
}
