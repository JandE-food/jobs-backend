import { FastifyInstance } from "fastify";

import {
  createEndorsement,
  createEscrowBooking,
  createLiquidationRequest,
  getOperationsOverview,
  getRewardsLedger,
  listAvailability,
  listDiscoveryTalent,
  listEscrowBookings,
  listVerificationRecords,
  resolveAdminCase,
  saveAvailability,
  savePayoutRoute,
  upsertCompanyVerification,
  updateEscrowBooking,
  type AvailabilitySlotInput,
} from "../lib/operations.js";
import { requireRole, requireUser } from "../lib/request-context.js";

type AvailabilityBody = {
  slots?: AvailabilitySlotInput[];
};

type DiscoveryQuery = {
  persona?: string;
  location?: string;
  sector?: string;
  minRating?: string;
};

type EndorsementBody = {
  targetUserId?: number;
  note?: string;
};

type RedeemBody = {
  kind?: "discount" | "cash" | "payout";
  points?: number;
  destination?: string;
};

type PayoutRouteBody = {
  country?: string;
  routeType?: string;
  bankLabel?: string;
  accountLast4?: string;
};

type BookingBody = {
  workerUserId?: number;
  companyId?: number;
  title?: string;
  sector?: string;
  location?: string;
  scheduledFor?: string;
  amountMinor?: number;
  instantBook?: boolean;
  payoutRoute?: string;
  milestoneNote?: string;
};

type BookingStatusBody = {
  status?: "held" | "released" | "disputed" | "completed" | "cancelled";
  disputeReason?: string;
  milestoneNote?: string;
};

type VerificationBody = {
  companyId?: number;
  companyNumber?: string;
  directors?: string[];
  companiesHouseStatus?: string;
  hmrcStatus?: string;
  dataResidencyRegion?: string;
  rightToWorkRequired?: boolean;
  retentionPolicyDays?: number;
  riskNotes?: string;
};

type CaseBody = {
  status?: "open" | "reviewing" | "resolved" | "banned";
  resolutionNotes?: string;
};

export async function registerOperationsRoutes(app: FastifyInstance) {
  app.get("/workspace/availability", async (request, reply) => {
    const user = await requireUser(request, reply);

    if (!user) {
      return;
    }

    return {
      slots: await listAvailability(Number(user.id)),
    };
  });

  app.put<{ Body: AvailabilityBody }>("/workspace/availability", async (request, reply) => {
    const user = await requireUser(request, reply);

    if (!user) {
      return;
    }

    const slots = request.body?.slots ?? [];

    return {
      slots: await saveAvailability(Number(user.id), slots),
    };
  });

  app.get<{ Querystring: DiscoveryQuery }>("/discovery/talent", async (request, reply) => {
    const user = await requireUser(request, reply);

    if (!user) {
      return;
    }

    return {
      talent: await listDiscoveryTalent({
        persona: request.query?.persona,
        location: request.query?.location,
        sector: request.query?.sector,
        minRating: request.query?.minRating ? Number(request.query.minRating) : undefined,
      }),
    };
  });

  app.get("/rewards/ledger", async (request, reply) => {
    const user = await requireUser(request, reply);

    if (!user) {
      return;
    }

    return getRewardsLedger(Number(user.id));
  });

  app.post<{ Body: EndorsementBody }>("/rewards/endorsements", async (request, reply) => {
    const user = await requireUser(request, reply);

    if (!user) {
      return;
    }

    const targetUserId = Number(request.body?.targetUserId);

    if (!targetUserId || targetUserId === Number(user.id)) {
      reply.code(400).send({
        error: "A valid target user is required.",
      });
      return;
    }

    reply.code(201).send({
      endorsement: await createEndorsement({
        endorserUserId: Number(user.id),
        targetUserId,
        note: request.body?.note,
      }),
    });
  });

  app.post<{ Body: RedeemBody }>("/rewards/redeem", async (request, reply) => {
    const user = await requireUser(request, reply);

    if (!user) {
      return;
    }

    const kind = request.body?.kind;
    const points = Number(request.body?.points);

    if (!kind || !points) {
      reply.code(400).send({
        error: "Kind and points are required.",
      });
      return;
    }

    try {
      reply.code(201).send({
        request: await createLiquidationRequest({
          userId: Number(user.id),
          kind,
          points,
          destination: request.body?.destination,
        }),
      });
    } catch (error) {
      reply.code(400).send({
        error: error instanceof Error ? error.message : "Unable to redeem points.",
      });
    }
  });

  app.post<{ Body: PayoutRouteBody }>("/operations/payout-routes", async (request, reply) => {
    const user = await requireUser(request, reply);

    if (!user) {
      return;
    }

    if (!request.body?.bankLabel?.trim() || !request.body?.accountLast4?.trim()) {
      reply.code(400).send({
        error: "Bank label and last 4 digits are required.",
      });
      return;
    }

    reply.code(201).send({
      payoutRoute: await savePayoutRoute({
        userId: Number(user.id),
        country: request.body.country?.trim() || "UK",
        routeType: request.body.routeType?.trim() || "bank",
        bankLabel: request.body.bankLabel.trim(),
        accountLast4: request.body.accountLast4.trim(),
      }),
    });
  });

  app.get("/operations/bookings", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    return {
      bookings: await listEscrowBookings(user.role, Number(user.id)),
    };
  });

  app.post<{ Body: BookingBody }>("/operations/bookings", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    const workerUserId = Number(request.body?.workerUserId);
    const amountMinor = Number(request.body?.amountMinor);
    const title = request.body?.title?.trim();

    if (!workerUserId || !amountMinor || !title) {
      reply.code(400).send({
        error: "Worker, title, and amount are required.",
      });
      return;
    }

    reply.code(201).send({
      booking: await createEscrowBooking({
        recruiterUserId: Number(user.id),
        workerUserId,
        companyId: request.body?.companyId,
        title,
        sector: request.body?.sector,
        location: request.body?.location,
        scheduledFor: request.body?.scheduledFor,
        amountMinor,
        instantBook: request.body?.instantBook,
        payoutRoute: request.body?.payoutRoute,
        milestoneNote: request.body?.milestoneNote,
      }),
    });
  });

  app.patch<{ Params: { id: string }; Body: BookingStatusBody }>(
    "/operations/bookings/:id",
    async (request, reply) => {
      const user = await requireRole(request, reply, ["recruiter", "admin"]);

      if (!user) {
        return;
      }

      const bookingId = Number(request.params.id);
      const status = request.body?.status;

      if (!bookingId || !status) {
        reply.code(400).send({
          error: "Booking id and status are required.",
        });
        return;
      }

      return {
        booking: await updateEscrowBooking({
          bookingId,
          status,
          disputeReason: request.body?.disputeReason,
          milestoneNote: request.body?.milestoneNote,
        }),
      };
    },
  );

  app.get("/operations/verification-records", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    return {
      records: await listVerificationRecords(),
    };
  });

  app.post<{ Body: VerificationBody }>("/operations/verification-records", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    const companyId = Number(request.body?.companyId);

    if (!companyId) {
      reply.code(400).send({
        error: "Company id is required.",
      });
      return;
    }

    return {
      record: await upsertCompanyVerification({
        companyId,
        companyNumber: request.body?.companyNumber?.trim() || "",
        directors: request.body?.directors ?? [],
        companiesHouseStatus: request.body?.companiesHouseStatus?.trim() || "pending",
        hmrcStatus: request.body?.hmrcStatus?.trim() || "pending",
        dataResidencyRegion: request.body?.dataResidencyRegion?.trim() || "UK",
        rightToWorkRequired: Boolean(request.body?.rightToWorkRequired),
        retentionPolicyDays: Number(request.body?.retentionPolicyDays ?? 365),
        riskNotes: request.body?.riskNotes?.trim() || "",
      }),
    };
  });

  app.get("/operations/overview", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    return getOperationsOverview();
  });

  app.patch<{ Params: { id: string }; Body: CaseBody }>("/operations/cases/:id", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    const caseId = Number(request.params.id);
    const status = request.body?.status;

    if (!caseId || !status) {
      reply.code(400).send({
        error: "Case id and status are required.",
      });
      return;
    }

    return {
      case: await resolveAdminCase({
        caseId,
        status,
        resolutionNotes: request.body?.resolutionNotes?.trim() || "",
      }),
    };
  });
}
