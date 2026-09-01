import crypto from "node:crypto";

type AuthTokenPayload = {
  sub: number;
  role: string;
  email: string;
  fullName: string;
  permissions?: string[];
  exp: number;
};

const authSecret = process.env.AUTH_TOKEN_SECRET ?? "dev-auth-token-secret";
const tokenLifetimeSeconds = Number(process.env.AUTH_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 7);

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function signTokenValue(value: string) {
  return base64UrlEncode(
    crypto.createHmac("sha256", authSecret).update(value).digest(),
  );
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [scheme, salt, derived] = passwordHash.split(":");

  if (scheme !== "scrypt" || !salt || !derived) {
    return false;
  }

  const candidate = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(derived, "hex");

  if (stored.length !== candidate.length) {
    return false;
  }

  return crypto.timingSafeEqual(stored, candidate);
}

export function signAuthToken(input: {
  userId: number;
  role: string;
  email: string;
  fullName: string;
  permissions?: string[];
}) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: input.userId,
      role: input.role,
      email: input.email,
      fullName: input.fullName,
      permissions: input.permissions,
      exp: Math.floor(Date.now() / 1000) + tokenLifetimeSeconds,
    } satisfies AuthTokenPayload),
  );
  const signature = signTokenValue(`${header}.${payload}`);

  return `${header}.${payload}.${signature}`;
}

export function verifyAuthToken(token: string) {
  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    return null;
  }

  const expectedSignature = signTokenValue(`${header}.${payload}`);
  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as AuthTokenPayload;

    if (!parsed.sub || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
