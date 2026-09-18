import { pool } from "./db.js";

export type AppUserRole = "professional" | "recruiter" | "admin";

export type AppUser = {
  id: number;
  email: string;
  role: AppUserRole;
  enabled_roles: AppUserRole[];
  full_name: string | null;
  password_hash: string | null;
  switch_pin_hash: string | null;
  auth_provider: string;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  deleted_at: string | null;
};

export function isAppUserRole(value: string): value is AppUserRole {
  return value === "professional" || value === "recruiter" || value === "admin";
}

function normalizeRoles(value: unknown, fallbackRole: AppUserRole): AppUserRole[] {
  const rawRoles = Array.isArray(value) ? value : [];
  const uniqueRoles = rawRoles.filter(isAppUserRole);

  if (!uniqueRoles.length) {
    return [fallbackRole];
  }

  return Array.from(new Set(uniqueRoles));
}

function toDatabaseUser(row: {
  id: number;
  email: string;
  role: string;
  enabled_roles: unknown;
  full_name: string | null;
  password_hash: string | null;
  switch_pin_hash: string | null;
  auth_provider: string;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  deleted_at: string | null;
}): AppUser {
  const activeRole = isAppUserRole(row.role) ? row.role : "professional";

  return {
    ...row,
    role: activeRole,
    enabled_roles: normalizeRoles(row.enabled_roles, activeRole),
  };
}

export async function getUserByEmail(email: string) {
  const result = await pool.query(
    `SELECT id, email, role, enabled_roles, full_name, password_hash, switch_pin_hash, auth_provider, email_verified_at, last_login_at, created_at, deleted_at
     FROM users
     WHERE LOWER(email) = LOWER($1)`,
    [email],
  );

  return result.rows[0] ? toDatabaseUser(result.rows[0]) : null;
}

export async function createUser(input: {
  fullName: string;
  email: string;
  passwordHash: string;
  role: AppUserRole;
}) {
  const result = await pool.query(
    `INSERT INTO users (
      full_name,
      email,
      password_hash,
      role,
      enabled_roles,
      auth_provider,
      email_verified_at
     )
     VALUES ($1, LOWER($2), $3, $4, $5::jsonb, 'password', NOW())
     RETURNING id, email, role, enabled_roles, full_name, password_hash, switch_pin_hash, auth_provider, email_verified_at, last_login_at, created_at, deleted_at`,
    [input.fullName, input.email, input.passwordHash, input.role, JSON.stringify([input.role])],
  );

  await pool.query(
    `INSERT INTO profiles (user_id, headline, location, summary, skills, experience_years)
     VALUES ($1, '', '', '', '[]'::jsonb, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [result.rows[0].id],
  );

  return toDatabaseUser(result.rows[0]);
}

export async function updateLastLogin(userId: number) {
  await pool.query(
    `UPDATE users
     SET last_login_at = NOW()
     WHERE id = $1`,
    [userId],
  );
}

export async function enableUserRole(userId: number, role: AppUserRole) {
  const existingUser = await pool.query(
    `SELECT id, email, role, enabled_roles, full_name, password_hash, switch_pin_hash, auth_provider, email_verified_at, last_login_at, created_at, deleted_at
     FROM users
     WHERE id = $1`,
    [userId],
  );

  const user = existingUser.rows[0] ? toDatabaseUser(existingUser.rows[0]) : null;

  if (!user) {
    return null;
  }

  const nextRoles = Array.from(new Set([...user.enabled_roles, role]));
  const result = await pool.query(
    `UPDATE users
     SET role = $2,
         enabled_roles = $3::jsonb
     WHERE id = $1
     RETURNING id, email, role, enabled_roles, full_name, password_hash, switch_pin_hash, auth_provider, email_verified_at, last_login_at, created_at, deleted_at`,
    [userId, role, JSON.stringify(nextRoles)],
  );

  return toDatabaseUser(result.rows[0]);
}

export async function updateSwitchPinHash(userId: number, switchPinHash: string | null) {
  const result = await pool.query(
    `UPDATE users
     SET switch_pin_hash = $2
     WHERE id = $1
     RETURNING id, email, role, enabled_roles, full_name, password_hash, switch_pin_hash, auth_provider, email_verified_at, last_login_at, created_at, deleted_at`,
    [userId, switchPinHash],
  );

  return result.rows[0] ? toDatabaseUser(result.rows[0]) : null;
}

export async function switchUserRole(userId: number, role: AppUserRole) {
  const result = await pool.query(
    `UPDATE users
     SET role = $2
     WHERE id = $1
     RETURNING id, email, role, enabled_roles, full_name, password_hash, switch_pin_hash, auth_provider, email_verified_at, last_login_at, created_at, deleted_at`,
    [userId, role],
  );

  return result.rows[0] ? toDatabaseUser(result.rows[0]) : null;
}

export function toSessionUser(
  user: Pick<AppUser, "id" | "email" | "role" | "enabled_roles" | "full_name" | "switch_pin_hash">,
) {
  return {
    id: Number(user.id),
    email: user.email,
    role: user.role,
    availableRoles: user.enabled_roles,
    hasSwitchPin: Boolean(user.switch_pin_hash),
    fullName: user.full_name ?? user.email,
  };
}
