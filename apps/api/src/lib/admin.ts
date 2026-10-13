import { pool } from "./db.js";

export type AdminAuditSeverity = "normal" | "elevated" | "critical";

export type AdminAuditLogRecord = {
  id: number;
  actor_id: number | null;
  actor_label: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  reason: string;
  severity: AdminAuditSeverity;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminRefundRecord = {
  id: number;
  booking_id: number;
  requested_by_admin_user_id: number | null;
  amount_minor: number;
  currency: string;
  provider: string;
  status: "pending_approval" | "approved" | "rejected" | "processed";
  reason: string;
  internal_note: string;
  second_approval_required: boolean;
  second_approved_by_admin_user_id: number | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  booking_title: string;
  company_name: string | null;
  worker_name: string;
  requester_label: string;
  approver_label: string | null;
};

const secondApprovalThresholdMinor = Number(
  process.env.ADMIN_REFUND_SECOND_APPROVAL_MINOR ?? 50000,
);

function normalizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function recordAdminAudit(input: {
  actorId?: number | null;
  actorLabel: string;
  actionType: string;
  entityType: string;
  entityId: string;
  reason: string;
  severity?: AdminAuditSeverity;
  metadata?: Record<string, unknown>;
}) {
  const result = await pool.query<AdminAuditLogRecord>(
    `INSERT INTO admin_audit_logs (
      actor_id,
      actor_label,
      action_type,
      entity_type,
      entity_id,
      reason,
      severity,
      metadata
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     RETURNING id, actor_id, actor_label, action_type, entity_type, entity_id, reason, severity, metadata, created_at`,
    [
      input.actorId ?? null,
      input.actorLabel,
      input.actionType,
      input.entityType,
      input.entityId,
      input.reason,
      input.severity ?? "normal",
      JSON.stringify(input.metadata ?? {}),
    ],
  );

  return {
    ...result.rows[0],
    metadata: normalizeMetadata(result.rows[0]?.metadata),
  };
}

export async function listAdminAuditLogs(limit = 100) {
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const result = await pool.query<AdminAuditLogRecord>(
    `SELECT id, actor_id, actor_label, action_type, entity_type, entity_id, reason, severity, metadata, created_at
     FROM admin_audit_logs
     ORDER BY created_at DESC, id DESC
     LIMIT $1`,
    [safeLimit],
  );

  return result.rows.map((row) => ({
    ...row,
    id: Number(row.id),
    actor_id: row.actor_id ? Number(row.actor_id) : null,
    metadata: normalizeMetadata(row.metadata),
  }));
}

export async function listAdminRefunds() {
  const result = await pool.query(
    `SELECT
       refunds.id,
       refunds.booking_id,
       refunds.requested_by_admin_user_id,
       refunds.amount_minor,
       refunds.currency,
       refunds.provider,
       refunds.status,
       refunds.reason,
       refunds.internal_note,
       refunds.second_approval_required,
       refunds.second_approved_by_admin_user_id,
       refunds.created_at,
       refunds.updated_at,
       refunds.processed_at,
       booking.title AS booking_title,
       company.name AS company_name,
       COALESCE(worker.full_name, worker.email) AS worker_name,
       COALESCE(requester.full_name, requester.email) AS requester_label,
       COALESCE(approver.full_name, approver.email) AS approver_label
     FROM admin_refunds refunds
     JOIN escrow_bookings booking ON booking.id = refunds.booking_id
     JOIN users worker ON worker.id = booking.worker_user_id
     LEFT JOIN companies company ON company.id = booking.company_id
     LEFT JOIN users requester ON requester.id = refunds.requested_by_admin_user_id
     LEFT JOIN users approver ON approver.id = refunds.second_approved_by_admin_user_id
     ORDER BY refunds.updated_at DESC, refunds.created_at DESC, refunds.id DESC`,
  );

  return result.rows.map((row: any) => ({
    ...row,
    id: Number(row.id),
    booking_id: Number(row.booking_id),
    requested_by_admin_user_id: row.requested_by_admin_user_id
      ? Number(row.requested_by_admin_user_id)
      : null,
    amount_minor: Number(row.amount_minor),
    second_approval_required: Boolean(row.second_approval_required),
    second_approved_by_admin_user_id: row.second_approved_by_admin_user_id
      ? Number(row.second_approved_by_admin_user_id)
      : null,
  })) as AdminRefundRecord[];
}

export async function createAdminRefund(input: {
  bookingId: number;
  adminUserId: number | null;
  amountMinor: number;
  reason: string;
  internalNote?: string;
}) {
  const bookingResult = await pool.query<{
    id: number;
    amount_minor: number;
    status: string;
  }>(
    `SELECT id, amount_minor, status
     FROM escrow_bookings
     WHERE id = $1`,
    [input.bookingId],
  );

  const booking = bookingResult.rows[0];

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (input.amountMinor <= 0 || input.amountMinor > Number(booking.amount_minor)) {
    throw new Error("Refund amount must be greater than 0 and no more than the booking total.");
  }

  const status =
    input.amountMinor >= secondApprovalThresholdMinor ? "pending_approval" : "approved";

  const result = await pool.query(
    `INSERT INTO admin_refunds (
      booking_id,
      requested_by_admin_user_id,
      amount_minor,
      currency,
      provider,
      status,
      reason,
      internal_note,
      second_approval_required
     )
     VALUES ($1, $2, $3, 'GBP', 'manual', $4, $5, $6, $7)
     RETURNING id`,
    [
      input.bookingId,
      input.adminUserId,
      input.amountMinor,
      status,
      input.reason,
      input.internalNote ?? "",
      input.amountMinor >= secondApprovalThresholdMinor,
    ],
  );

  const refunds = await listAdminRefunds();
  return refunds.find((item) => item.id === Number(result.rows[0]?.id)) ?? null;
}

export async function updateAdminRefund(input: {
  refundId: number;
  adminUserId: number | null;
  status: "approved" | "rejected" | "processed";
  internalNote?: string;
}) {
  const currentResult = await pool.query<{
    id: number;
    status: string;
    second_approval_required: boolean;
    requested_by_admin_user_id: number | null;
    booking_id: number;
    amount_minor: number;
    reason: string;
  }>(
    `SELECT id, status, second_approval_required, requested_by_admin_user_id, booking_id, amount_minor, reason
     FROM admin_refunds
     WHERE id = $1`,
    [input.refundId],
  );

  const current = currentResult.rows[0];

  if (!current) {
    throw new Error("Refund request not found.");
  }

  if (input.status === "approved" && current.second_approval_required) {
    if (
      input.adminUserId &&
      current.requested_by_admin_user_id &&
      input.adminUserId === Number(current.requested_by_admin_user_id)
    ) {
      throw new Error("A different admin must approve this refund.");
    }
  }

  const result = await pool.query(
    `UPDATE admin_refunds
     SET status = $2,
         internal_note = CASE
           WHEN $3 <> '' THEN $3
           ELSE internal_note
         END,
         second_approved_by_admin_user_id = CASE
           WHEN $2 = 'approved' AND second_approval_required = TRUE THEN $4
           ELSE second_approved_by_admin_user_id
         END,
         processed_at = CASE
           WHEN $2 = 'processed' THEN NOW()
           ELSE processed_at
         END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, booking_id`,
    [
      input.refundId,
      input.status,
      input.internalNote?.trim() ?? "",
      input.adminUserId ?? null,
    ],
  );

  const bookingId = Number(result.rows[0]?.booking_id ?? 0);

  if (input.status === "processed" && bookingId) {
    await pool.query(
      `UPDATE escrow_bookings
       SET status = CASE
         WHEN status = 'completed' THEN 'completed'
         ELSE 'cancelled'
       END,
       dispute_reason = CASE
         WHEN dispute_reason <> '' THEN dispute_reason
         ELSE 'Refund processed from admin finance workflow.'
       END,
       updated_at = NOW()
       WHERE id = $1`,
      [bookingId],
    );
  }

  const refunds = await listAdminRefunds();
  return refunds.find((item) => item.id === input.refundId) ?? null;
}

export function getRefundSecondApprovalThresholdMinor() {
  return secondApprovalThresholdMinor;
}
