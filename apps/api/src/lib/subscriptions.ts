import { BillingPlan, BillingProvider } from "./billing.js";
import { pool } from "./db.js";

export async function upsertSubscription(input: {
  userId: number;
  plan: BillingPlan;
  provider: BillingProvider;
  status: string;
  currentPeriodEnd: Date | null;
}) {
  const result = await pool.query(
    `INSERT INTO subscriptions (
        user_id,
        plan,
        provider,
        status,
        current_period_end,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        plan = EXCLUDED.plan,
        provider = EXCLUDED.provider,
        status = EXCLUDED.status,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW()
      RETURNING id, user_id, plan, provider, status, current_period_end, created_at, updated_at`,
    [
      input.userId,
      input.plan,
      input.provider,
      input.status,
      input.currentPeriodEnd,
    ],
  );

  return result.rows[0];
}

export async function getSubscription(userId: number) {
  const result = await pool.query(
    `SELECT id, user_id, plan, provider, status, current_period_end, created_at, updated_at
     FROM subscriptions
     WHERE user_id = $1`,
    [userId],
  );

  return result.rows[0] ?? null;
}
