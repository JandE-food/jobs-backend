import {
  BillingPlan,
  BillingProvider,
  getMonthlyEndorsementLimit,
  getPlanConfig,
  isPremiumPlan,
} from "./billing.js";
import { pool } from "./db.js";

export type StoredSubscription = {
  id: number;
  user_id: number;
  plan: BillingPlan;
  provider: BillingProvider;
  status: string;
  current_period_end: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

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

export function isSubscriptionActive(subscription: StoredSubscription | null) {
  if (!subscription) {
    return false;
  }

  if (subscription.status !== "active") {
    return false;
  }

  if (!subscription.current_period_end) {
    return true;
  }

  return new Date(subscription.current_period_end).getTime() > Date.now();
}

export async function countMonthlyEndorsementsGiven(userId: number) {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM endorsements
     WHERE endorser_user_id = $1
       AND created_at >= date_trunc('month', NOW())
       AND created_at < date_trunc('month', NOW()) + INTERVAL '1 month'`,
    [userId],
  );

  return Number(result.rows[0]?.count ?? 0);
}

export async function getSubscriptionEntitlements(userId: number) {
  const subscription = (await getSubscription(userId)) as StoredSubscription | null;
  const active = isSubscriptionActive(subscription);

  if (!subscription || !active) {
    return {
      subscription,
      active: false,
      monthlyEndorsements: 0,
      endorsementsUsedThisMonth: 0,
      remainingEndorsements: 0,
      premium: false,
      audience: null,
      tier: null,
      planName: null,
    };
  }

  const endorsementsUsedThisMonth = await countMonthlyEndorsementsGiven(userId);
  const config = getPlanConfig(subscription.plan);
  const monthlyEndorsements = getMonthlyEndorsementLimit(subscription.plan);

  return {
    subscription,
    active: true,
    monthlyEndorsements,
    endorsementsUsedThisMonth,
    remainingEndorsements: Math.max(0, monthlyEndorsements - endorsementsUsedThisMonth),
    premium: isPremiumPlan(subscription.plan),
    audience: config.audience,
    tier: config.tier,
    planName: config.name,
  };
}
