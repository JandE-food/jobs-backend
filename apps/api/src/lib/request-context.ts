import { FastifyReply, FastifyRequest } from "fastify";

import { demoUserId } from "./db.js";
import { verifyAuthToken } from "./auth.js";
import { getUserById } from "./db.js";
import { type AppUserRole } from "./users.js";

export async function getAuthenticatedUserFromRequest(request: FastifyRequest) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;

  if (token) {
    const payload = verifyAuthToken(token);

    if (payload) {
      const user = await getUserById(payload.sub);

      if (user && !user.deleted_at) {
        return user;
      }
    }
  }

  return null;
}

export async function getUserIdFromRequest(request: FastifyRequest) {
  const authenticatedUser = await getAuthenticatedUserFromRequest(request);

  if (authenticatedUser) {
    return Number(authenticatedUser.id);
  }

  const headerValue = request.headers["x-user-id"];
  const rawValue = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const parsed = Number(rawValue ?? demoUserId);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : demoUserId;
}

export async function requireUser(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = await getAuthenticatedUserFromRequest(request);

  if (!user) {
    reply.code(401).send({
      error: "Unauthorized",
      message: "Sign in to continue.",
    });
    return null;
  }

  return user;
}

export async function requireRole(
  request: FastifyRequest,
  reply: FastifyReply,
  allowedRoles: AppUserRole[],
) {
  const user = await requireUser(request, reply);

  if (!user) {
    return null;
  }

  if (!allowedRoles.includes(user.role as AppUserRole)) {
    reply.code(403).send({
      error: "Forbidden",
      message: "Your account does not have access to this resource.",
    });
    return null;
  }

  return user;
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = await getAuthenticatedUserFromRequest(request);

  if (user?.role === "admin") {
    return user;
  }

  const token = request.headers["x-admin-token"];
  const rawToken = Array.isArray(token) ? token[0] : token;
  const adminToken = process.env.ADMIN_TOKEN ?? "dev-admin-token";

  if (rawToken !== adminToken) {
    reply.code(403).send({
      error: "Forbidden",
      message: "Missing or invalid admin token.",
    });
    return;
  }

  return user ?? null;
}
