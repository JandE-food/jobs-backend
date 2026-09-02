import { pool } from "./db.js";

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export type AvailabilitySlotInput = {
  dayOfWeek: number;
  slot: "morning" | "afternoon" | "evening" | "night";
  isAvailable: boolean;
};

export async function listAvailability(userId: number) {
  const result = await pool.query(
    `SELECT day_of_week, slot, is_available
     FROM availability_slots
     WHERE user_id = $1
     ORDER BY day_of_week ASC, slot ASC`,
    [userId],
  );

  return result.rows.map((row: any) => ({
    dayOfWeek: Number(row.day_of_week),
    slot: row.slot as AvailabilitySlotInput["slot"],
    isAvailable: Boolean(row.is_available),
  }));
}

export async function saveAvailability(
  userId: number,
  slots: AvailabilitySlotInput[],
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM availability_slots WHERE user_id = $1`, [userId]);

    for (const slot of slots) {
      await client.query(
        `INSERT INTO availability_slots (user_id, day_of_week, slot, is_available)
         VALUES ($1, $2, $3, $4)`,
        [userId, slot.dayOfWeek, slot.slot, slot.isAvailable],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return listAvailability(userId);
}

type DiscoveryFilters = {
  persona?: string;
  location?: string;
  sector?: string;
  minRating?: number;
};

export async function listDiscoveryTalent(filters: DiscoveryFilters) {
  const values: Array<string | number> = [];
  const queryParts = [`u.role = 'professional'`, `u.deleted_at IS NULL`];

  if (filters.persona?.trim()) {
    values.push(filters.persona.trim().toLowerCase());
    queryParts.push(`LOWER(p.persona_mode) = $${values.length}`);
  }

  if (filters.location?.trim()) {
    values.push(`%${filters.location.trim().toLowerCase()}%`);
    queryParts.push(`LOWER(p.location) LIKE $${values.length}`);
  }

  if (filters.sector?.trim()) {
    values.push(`%${filters.sector.trim().toLowerCase()}%`);
    queryParts.push(
      `(LOWER(p.sector) LIKE $${values.length}
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(p.skills) AS skill
          WHERE LOWER(skill) LIKE $${values.length}
        ))`,
    );
  }

  const result = await pool.query(
    `SELECT
      u.id,
      COALESCE(u.full_name, u.email) AS full_name,
      p.headline,
      p.location,
      p.summary,
      p.skills,
      p.education,
      p.experience_years,
      p.persona_mode,
      p.sector,
      p.hourly_rate,
      COALESCE(endorsement_totals.points, 0)::int AS endorsement_points,
      COALESCE(endorsement_totals.endorsements, 0)::int AS endorsement_count,
      EXISTS (
        SELECT 1
        FROM availability_slots availability
        WHERE availability.user_id = u.id
          AND availability.is_available = TRUE
      ) AS instant_bookable
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     LEFT JOIN (
       SELECT
         target_user_id,
         SUM(points_awarded)::int AS points,
         COUNT(*)::int AS endorsements
       FROM endorsements
       GROUP BY target_user_id
     ) AS endorsement_totals ON endorsement_totals.target_user_id = u.id
     WHERE ${queryParts.join(" AND ")}
     ORDER BY COALESCE(endorsement_totals.points, 0) DESC, p.experience_years DESC, u.id ASC`,
    values,
  );

  return result.rows
    .map((row: any) => {
      const rating =
        Math.round(
          Math.min(
            5,
            3 +
              Number(row.endorsement_points ?? 0) / 10 +
              Number(row.experience_years ?? 0) / 10,
          ) * 10,
        ) / 10;

      return {
        id: Number(row.id),
        full_name: row.full_name,
        headline: row.headline,
        location: row.location,
        summary: row.summary,
        skills: asArray(row.skills),
        education: asArray(row.education),
        experience_years: Number(row.experience_years ?? 0),
        persona_mode: row.persona_mode,
        sector: row.sector,
        hourly_rate: row.hourly_rate,
        endorsement_points: Number(row.endorsement_points ?? 0),
        endorsement_count: Number(row.endorsement_count ?? 0),
        instant_bookable: Boolean(row.instant_bookable),
        rating,
      };
    })
    .filter((item: { rating: number }) =>
      typeof filters.minRating === "number" ? item.rating >= filters.minRating : true,
    );
}

export async function createEndorsement(input: {
  endorserUserId: number;
  targetUserId: number;
  note?: string;
}) {
  const result = await pool.query(
    `INSERT INTO endorsements (endorser_user_id, target_user_id, points_awarded, note)
     VALUES ($1, $2, 5, $3)
     RETURNING id, endorser_user_id, target_user_id, points_awarded, note, created_at`,
    [input.endorserUserId, input.targetUserId, input.note ?? ""],
  );

  return result.rows[0];
}

export async function getRewardsLedger(userId: number) {
  const [balanceResult, receivedResult, requestResult] = await Promise.all([
    pool.query(
      `SELECT
        COALESCE((
          SELECT SUM(points_awarded)::int
          FROM endorsements
          WHERE target_user_id = $1
        ), 0) AS earned_points,
        COALESCE((
          SELECT SUM(points)::int
          FROM liquidation_requests
          WHERE user_id = $1
            AND status IN ('pending', 'approved', 'paid')
        ), 0) AS spent_points`,
      [userId],
    ),
    pool.query(
      `SELECT
        e.id,
        e.points_awarded,
        e.note,
        e.created_at,
        COALESCE(u.full_name, u.email) AS endorser_name
       FROM endorsements e
       JOIN users u ON u.id = e.endorser_user_id
       WHERE e.target_user_id = $1
       ORDER BY e.created_at DESC`,
      [userId],
    ),
    pool.query(
      `SELECT id, kind, points, value_minor, destination, status, created_at
       FROM liquidation_requests
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    ),
  ]);

  const earnedPoints = Number(balanceResult.rows[0]?.earned_points ?? 0);
  const spentPoints = Number(balanceResult.rows[0]?.spent_points ?? 0);

  return {
    balance: {
      earnedPoints,
      spentPoints,
      availablePoints: Math.max(0, earnedPoints - spentPoints),
    },
    endorsements: receivedResult.rows,
    liquidationRequests: requestResult.rows,
  };
}

export async function createLiquidationRequest(input: {
  userId: number;
  kind: "discount" | "cash" | "payout";
  points: number;
  destination?: string;
}) {
  const ledger = await getRewardsLedger(input.userId);

  if (input.points > ledger.balance.availablePoints) {
    throw new Error("Not enough available points to redeem.");
  }

  const result = await pool.query(
    `INSERT INTO liquidation_requests (user_id, kind, points, value_minor, destination, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING id, user_id, kind, points, value_minor, destination, status, created_at`,
    [
      input.userId,
      input.kind,
      input.points,
      input.points * 100,
      input.destination ?? "",
    ],
  );

  return result.rows[0];
}

export async function savePayoutRoute(input: {
  userId: number;
  country: string;
  routeType: string;
  bankLabel: string;
  accountLast4: string;
}) {
  const result = await pool.query(
    `INSERT INTO payout_routes (user_id, country, route_type, bank_label, account_last4, status)
     VALUES ($1, $2, $3, $4, $5, 'ready')
     RETURNING id, user_id, country, route_type, bank_label, account_last4, status, created_at, updated_at`,
    [
      input.userId,
      input.country,
      input.routeType,
      input.bankLabel,
      input.accountLast4,
    ],
  );

  return result.rows[0];
}

export async function listVerificationRecords() {
  const result = await pool.query(
    `SELECT
      c.id AS company_id,
      c.name,
      c.slug,
      c.location,
      c.industry,
      c.verification_status,
      v.company_number,
      v.directors,
      v.companies_house_status,
      v.hmrc_status,
      v.data_residency_region,
      v.right_to_work_required,
      v.retention_policy_days,
      v.risk_notes,
      v.updated_at
     FROM companies c
     LEFT JOIN company_verifications v ON v.company_id = c.id
     ORDER BY c.updated_at DESC, c.created_at DESC`,
  );

  return result.rows.map((row: any) => ({
    ...row,
    company_id: Number(row.company_id),
    directors: asArray(row.directors),
    right_to_work_required: Boolean(row.right_to_work_required),
  }));
}

export async function upsertCompanyVerification(input: {
  companyId: number;
  companyNumber: string;
  directors: string[];
  companiesHouseStatus: string;
  hmrcStatus: string;
  dataResidencyRegion: string;
  rightToWorkRequired: boolean;
  retentionPolicyDays: number;
  riskNotes: string;
}) {
  await pool.query(
    `UPDATE companies
     SET verification_status = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [input.companyId, input.companiesHouseStatus === "verified" ? "verified" : "pending"],
  );

  const result = await pool.query(
    `INSERT INTO company_verifications (
      company_id, company_number, directors, companies_house_status, hmrc_status, data_residency_region, right_to_work_required, retention_policy_days, risk_notes
     )
     VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (company_id) DO UPDATE SET
      company_number = EXCLUDED.company_number,
      directors = EXCLUDED.directors,
      companies_house_status = EXCLUDED.companies_house_status,
      hmrc_status = EXCLUDED.hmrc_status,
      data_residency_region = EXCLUDED.data_residency_region,
      right_to_work_required = EXCLUDED.right_to_work_required,
      retention_policy_days = EXCLUDED.retention_policy_days,
      risk_notes = EXCLUDED.risk_notes,
      updated_at = NOW()
     RETURNING company_id, company_number, directors, companies_house_status, hmrc_status, data_residency_region, right_to_work_required, retention_policy_days, risk_notes, updated_at`,
    [
      input.companyId,
      input.companyNumber,
      JSON.stringify(input.directors),
      input.companiesHouseStatus,
      input.hmrcStatus,
      input.dataResidencyRegion,
      input.rightToWorkRequired,
      input.retentionPolicyDays,
      input.riskNotes,
    ],
  );

  return {
    ...result.rows[0],
    directors: asArray(result.rows[0]?.directors),
    right_to_work_required: Boolean(result.rows[0]?.right_to_work_required),
  };
}

export async function listEscrowBookings(role: string, requesterUserId: number) {
  const values: Array<number> = [];
  const whereParts = [`1 = 1`];

  if (role !== "admin") {
    values.push(requesterUserId);
    whereParts.push(`b.recruiter_user_id = $${values.length}`);
  }

  const result = await pool.query(
    `SELECT
      b.id,
      b.title,
      b.sector,
      b.location,
      b.scheduled_for,
      b.amount_minor,
      b.platform_fee_minor,
      b.worker_amount_minor,
      b.status,
      b.instant_book,
      b.payout_route,
      b.milestone_note,
      b.dispute_reason,
      b.created_at,
      COALESCE(worker.full_name, worker.email) AS worker_name,
      COALESCE(recruiter.full_name, recruiter.email) AS recruiter_name,
      c.name AS company_name
     FROM escrow_bookings b
     JOIN users worker ON worker.id = b.worker_user_id
     JOIN users recruiter ON recruiter.id = b.recruiter_user_id
     LEFT JOIN companies c ON c.id = b.company_id
     WHERE ${whereParts.join(" AND ")}
     ORDER BY b.updated_at DESC, b.created_at DESC`,
    values,
  );

  return result.rows.map((row: any) => ({
    ...row,
    id: Number(row.id),
    amount_minor: Number(row.amount_minor),
    platform_fee_minor: Number(row.platform_fee_minor),
    worker_amount_minor: Number(row.worker_amount_minor),
    instant_book: Boolean(row.instant_book),
  }));
}

export async function createEscrowBooking(input: {
  recruiterUserId: number;
  workerUserId: number;
  companyId?: number;
  title: string;
  sector?: string;
  location?: string;
  scheduledFor?: string;
  amountMinor: number;
  instantBook?: boolean;
  payoutRoute?: string;
  milestoneNote?: string;
}) {
  const platformFeeMinor = Math.round(input.amountMinor * 0.12);
  const workerAmountMinor = input.amountMinor - platformFeeMinor;

  const result = await pool.query(
    `INSERT INTO escrow_bookings (
      recruiter_user_id, worker_user_id, company_id, title, sector, location, scheduled_for, amount_minor, platform_fee_minor, worker_amount_minor, status, instant_book, payout_route, milestone_note
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'held', $11, $12, $13)
     RETURNING id, recruiter_user_id, worker_user_id, company_id, title, sector, location, scheduled_for, amount_minor, platform_fee_minor, worker_amount_minor, status, instant_book, payout_route, milestone_note, dispute_reason, created_at, updated_at`,
    [
      input.recruiterUserId,
      input.workerUserId,
      input.companyId ?? null,
      input.title,
      input.sector ?? "",
      input.location ?? "",
      input.scheduledFor ?? null,
      input.amountMinor,
      platformFeeMinor,
      workerAmountMinor,
      input.instantBook ?? false,
      input.payoutRoute ?? "",
      input.milestoneNote ?? "",
    ],
  );

  return result.rows[0];
}

export async function updateEscrowBooking(input: {
  bookingId: number;
  status: "held" | "released" | "disputed" | "completed" | "cancelled";
  disputeReason?: string;
  milestoneNote?: string;
}) {
  const result = await pool.query(
    `UPDATE escrow_bookings
     SET status = $2,
         dispute_reason = $3,
         milestone_note = $4,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, status, dispute_reason, milestone_note, updated_at`,
    [
      input.bookingId,
      input.status,
      input.disputeReason ?? "",
      input.milestoneNote ?? "",
    ],
  );

  if (input.status === "disputed") {
    await pool.query(
      `INSERT INTO admin_cases (booking_id, type, status, reason, resolution_notes)
       SELECT $1, 'dispute', 'open', $2, ''
       WHERE NOT EXISTS (
         SELECT 1
         FROM admin_cases
         WHERE booking_id = $1
           AND type = 'dispute'
           AND status IN ('open', 'reviewing')
       )`,
      [input.bookingId, input.disputeReason ?? "Dispute raised from booking workflow."],
    );
  }

  return result.rows[0];
}

export async function listAdminCases() {
  const result = await pool.query(
    `SELECT
      ac.id,
      ac.booking_id,
      ac.company_id,
      ac.type,
      ac.status,
      ac.reason,
      ac.resolution_notes,
      ac.created_at,
      booking.title AS booking_title,
      company.name AS company_name
     FROM admin_cases ac
     LEFT JOIN escrow_bookings booking ON booking.id = ac.booking_id
     LEFT JOIN companies company ON company.id = ac.company_id
     ORDER BY ac.updated_at DESC, ac.created_at DESC`,
  );

  return result.rows;
}

export async function resolveAdminCase(input: {
  caseId: number;
  status: "open" | "reviewing" | "resolved" | "banned";
  resolutionNotes: string;
}) {
  const result = await pool.query(
    `UPDATE admin_cases
     SET status = $2,
         resolution_notes = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, status, resolution_notes, updated_at`,
    [input.caseId, input.status, input.resolutionNotes],
  );

  return result.rows[0];
}

export async function getOperationsOverview() {
  const [
    bookingStats,
    pointStats,
    requestStats,
    verificationStats,
    subscriptionStats,
    bookings,
    cases,
    verifications,
  ] = await Promise.all([
    pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'held')::int AS held_count,
        COUNT(*) FILTER (WHERE status = 'disputed')::int AS disputed_count,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_count
       FROM escrow_bookings`,
    ),
    pool.query(
      `SELECT COALESCE(SUM(points_awarded), 0)::int AS total_points
       FROM endorsements`,
    ),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_redemptions
       FROM liquidation_requests`,
    ),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE companies_house_status <> 'verified' OR hmrc_status <> 'verified')::int AS reviews_needed
       FROM company_verifications`,
    ),
    pool.query(
      `SELECT plan, COUNT(*)::int AS total
       FROM subscriptions
       GROUP BY plan`,
    ),
    listEscrowBookings("admin", 0),
    listAdminCases(),
    listVerificationRecords(),
  ]);

  return {
    stats: {
      heldEscrow: Number(bookingStats.rows[0]?.held_count ?? 0),
      disputedEscrow: Number(bookingStats.rows[0]?.disputed_count ?? 0),
      completedEscrow: Number(bookingStats.rows[0]?.completed_count ?? 0),
      totalPoints: Number(pointStats.rows[0]?.total_points ?? 0),
      pendingRedemptions: Number(requestStats.rows[0]?.pending_redemptions ?? 0),
      verificationReviews: Number(verificationStats.rows[0]?.reviews_needed ?? 0),
    },
    subscriptionMix: subscriptionStats.rows.map((row: any) => ({
      plan: row.plan,
      total: Number(row.total),
    })),
    bookings: bookings.slice(0, 6),
    cases: cases.slice(0, 6),
    verifications: verifications.slice(0, 6),
  };
}
