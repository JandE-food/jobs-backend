import { FastifyInstance } from "fastify";

import {
  createAdminRefund,
  getRefundSecondApprovalThresholdMinor,
  listAdminRefunds,
  recordAdminAudit,
  updateAdminRefund,
} from "../lib/admin.js";
import {
  isBillingProvider,
  getBillingProvider,
  isBillingPlan,
} from "../lib/billing.js";
import { createFlutterwaveCheckout } from "../lib/flutterwave.js";
import { createPaystackCheckout } from "../lib/paystack.js";
import {
  getAuthenticatedUserFromRequest,
  getUserIdFromRequest,
  requireAdmin,
} from "../lib/request-context.js";
import { createStripeCheckout } from "../lib/stripe.js";
import { getSubscriptionEntitlements } from "../lib/subscriptions.js";

type CheckoutBody = {
  plan?: string;
  country?: string;
  provider?: string;
};

type AdminRefundBody = {
  bookingId?: number;
  amountMinor?: number;
  reason?: string;
  internalNote?: string;
};

type AdminRefundStatusBody = {
  status?: "approved" | "rejected" | "processed";
  internalNote?: string;
};

export async function registerBillingRoutes(app: FastifyInstance) {
  app.get("/admin/billing/refunds", async (request, reply) => {
    const allowed = await requireAdmin(request, reply);

    if (allowed === undefined) {
      return;
    }

    return {
      secondApprovalThresholdMinor: getRefundSecondApprovalThresholdMinor(),
      refunds: await listAdminRefunds(),
    };
  });

  app.post<{ Body: AdminRefundBody }>("/admin/billing/refunds", async (request, reply) => {
    const allowed = await requireAdmin(request, reply);

    if (allowed === undefined) {
      return;
    }

    const admin = await getAuthenticatedUserFromRequest(request);

    const bookingId = Number(request.body?.bookingId);
    const amountMinor = Number(request.body?.amountMinor);
    const reason = request.body?.reason?.trim() || "";

    if (!bookingId || !amountMinor || !reason) {
      reply.code(400).send({
        error: "Booking, refund amount, and reason are required.",
      });
      return;
    }

    try {
      const refund = await createAdminRefund({
        bookingId,
        adminUserId: admin ? Number(admin.id) : null,
        amountMinor,
        reason,
        internalNote: request.body?.internalNote?.trim() || "",
      });

      if (!refund) {
        throw new Error("Unable to create refund request.");
      }

      await recordAdminAudit({
        actorId: admin ? Number(admin.id) : null,
        actorLabel: admin?.full_name ?? admin?.email ?? "Admin token",
        actionType: "refund.requested",
        entityType: "admin_refund",
        entityId: `${refund.id}`,
        reason,
        severity: refund.second_approval_required ? "critical" : "elevated",
        metadata: {
          bookingId,
          amountMinor,
          status: refund.status,
        },
      });

      reply.code(201).send({
        refund,
      });
    } catch (error) {
      reply.code(400).send({
        error: error instanceof Error ? error.message : "Unable to create refund request.",
      });
    }
  });

  app.patch<{ Params: { id: string }; Body: AdminRefundStatusBody }>(
    "/admin/billing/refunds/:id",
    async (request, reply) => {
      const allowed = await requireAdmin(request, reply);

      if (allowed === undefined) {
        return;
      }

      const admin = await getAuthenticatedUserFromRequest(request);

      const refundId = Number(request.params.id);
      const status = request.body?.status;

      if (!refundId || !status) {
        reply.code(400).send({
          error: "Refund id and status are required.",
        });
        return;
      }

      try {
        const refund = await updateAdminRefund({
          refundId,
          adminUserId: admin ? Number(admin.id) : null,
          status,
          internalNote: request.body?.internalNote?.trim() || "",
        });

        if (!refund) {
          throw new Error("Unable to update refund request.");
        }

        await recordAdminAudit({
          actorId: admin ? Number(admin.id) : null,
          actorLabel: admin?.full_name ?? admin?.email ?? "Admin token",
          actionType: `refund.${status}`,
          entityType: "admin_refund",
          entityId: `${refund.id}`,
          reason: request.body?.internalNote?.trim() || refund.reason,
          severity: status === "rejected" ? "elevated" : status === "processed" ? "critical" : "normal",
          metadata: {
            bookingId: refund.booking_id,
            amountMinor: refund.amount_minor,
            status,
          },
        });

        reply.send({
          refund,
        });
      } catch (error) {
        reply.code(400).send({
          error: error instanceof Error ? error.message : "Unable to update refund request.",
        });
      }
    },
  );

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
