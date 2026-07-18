import { FastifyReply, FastifyRequest } from "fastify";

import { demoUserId } from "./db.js";

export function getUserIdFromRequest(request: FastifyRequest) {
  const headerValue = request.headers["x-user-id"];
  const rawValue = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const parsed = Number(rawValue ?? demoUserId);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : demoUserId;
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
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
}
