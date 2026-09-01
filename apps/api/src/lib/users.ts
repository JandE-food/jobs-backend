import { pool } from "./db.js";

export type AppUserRole = "professional" | "recruiter" | "admin";

export type AppUser = {
  id: number;
  email: string;
  role: AppUserRole;
  full_name: string | null;
  password_hash: string | null;
  auth_provider: string;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  deleted_at: string | null;
};

export function isAppUserRole(value: string): value is AppUserRole {
  return value === "professional" || value === "recruiter" || value === "admin";
}

export async function getUserByEmail(email: string) {
  const result = await pool.query<AppUser>(
    `SELECT id, email, role, full_name, password_hash, auth_provider, email_verified_at, last_login_at, created_at, deleted_at
     FROM users
     WHERE LOWER(email) = LOWER($1)`,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function createUser(input: {
  fullName: string;
  email: string;
  passwordHash: string;
  role: AppUserRole;
}) {
  const result = await pool.query<AppUser>(
    `INSERT INTO users (
      full_name,
      email,
      password_hash,
      role,
      auth_provider,
      email_verified_at
     )
     VALUES ($1, LOWER($2), $3, $4, 'password', NOW())
     RETURNING id, email, role, full_name, password_hash, auth_provider, email_verified_at, last_login_at, created_at, deleted_at`,
    [input.fullName, input.email, input.passwordHash, input.role],
  );

  await pool.query(
    `INSERT INTO profiles (user_id, headline, location, summary, skills, experience_years)
     VALUES ($1, '', '', '', '[]'::jsonb, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [result.rows[0].id],
  );

  return result.rows[0];
}

export async function updateLastLogin(userId: number) {
  await pool.query(
    `UPDATE users
     SET last_login_at = NOW()
     WHERE id = $1`,
    [userId],
  );
}

export function toSessionUser(user: Pick<AppUser, "id" | "email" | "role" | "full_name">) {
  return {
    id: Number(user.id),
    email: user.email,
    role: user.role,
    fullName: user.full_name ?? user.email,
  };
}
