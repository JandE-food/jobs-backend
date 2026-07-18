import { pool } from "./db.js";

export async function requestDeletion(userId: number) {
  const result = await pool.query(
    `INSERT INTO deletion_requests (user_id, status)
     VALUES ($1, 'requested')
     RETURNING id, user_id, status, created_at, completed_at`,
    [userId],
  );

  return result.rows[0];
}

export async function exportUserData(userId: number) {
  const [userResult, subscriptionResult, deletionResult] = await Promise.all([
    pool.query(
      `SELECT id, email, role, created_at, deleted_at
       FROM users
       WHERE id = $1`,
      [userId],
    ),
    pool.query(
      `SELECT id, plan, provider, status, current_period_end, created_at, updated_at
       FROM subscriptions
       WHERE user_id = $1`,
      [userId],
    ),
    pool.query(
      `SELECT id, status, created_at, completed_at
       FROM deletion_requests
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    ),
  ]);

  return {
    user: userResult.rows[0] ?? null,
    subscriptions: subscriptionResult.rows,
    deletionRequests: deletionResult.rows,
    notes: [
      "Profiles, resumes, and applications are not present in this repository yet.",
      "This export currently includes only the tables implemented in the codebase.",
    ],
  };
}

export async function completeDeletion(userId: number) {
  await pool.query(
    `UPDATE users
     SET email = $2,
         deleted_at = NOW()
     WHERE id = $1`,
    [userId, `deleted+${userId}@example.invalid`],
  );

  await pool.query(
    `UPDATE subscriptions
     SET status = 'canceled',
         updated_at = NOW()
     WHERE user_id = $1`,
    [userId],
  );

  await pool.query(
    `UPDATE deletion_requests
     SET status = 'completed',
         completed_at = NOW()
     WHERE user_id = $1
       AND status = 'requested'`,
    [userId],
  );

  return exportUserData(userId);
}
