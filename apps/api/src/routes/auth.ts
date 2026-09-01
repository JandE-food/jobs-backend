import { FastifyInstance } from "fastify";

import { hashPassword, signAuthToken, verifyPassword } from "../lib/auth.js";
import {
  getAuthenticatedUserFromRequest,
} from "../lib/request-context.js";
import {
  createUser,
  getUserByEmail,
  isAppUserRole,
  toSessionUser,
  updateLastLogin,
} from "../lib/users.js";

type SignupBody = {
  fullName?: string;
  email?: string;
  password?: string;
  role?: string;
};

type LoginBody = {
  email?: string;
  password?: string;
};

type AdminTokenBody = {
  email?: string;
  username?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const adminPermissions = ["create", "read", "update", "delete"];

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get("/auth/me", async (request, reply) => {
    const user = await getAuthenticatedUserFromRequest(request);

    if (!user) {
      reply.code(401).send({
        error: "Unauthorized",
        message: "No active session.",
      });
      return;
    }

    return {
      user: toSessionUser(user),
    };
  });

  app.post<{ Body: SignupBody }>("/auth/signup", async (request, reply) => {
    const fullName = request.body?.fullName?.trim() ?? "";
    const email = request.body?.email?.trim().toLowerCase() ?? "";
    const password = request.body?.password ?? "";
    const role = request.body?.role ?? "professional";

    if (!fullName || !emailPattern.test(email) || password.length < 8) {
      reply.code(400).send({
        error: "Invalid signup payload.",
        message:
          "Provide a full name, valid email address, and password with at least 8 characters.",
      });
      return;
    }

    if (!isAppUserRole(role)) {
      reply.code(400).send({
        error: "Invalid role.",
        message: "Use professional, recruiter, or admin.",
      });
      return;
    }

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      reply.code(409).send({
        error: "Account already exists.",
        message: "Use a different email address or sign in instead.",
      });
      return;
    }

    const user = await createUser({
      fullName,
      email,
      passwordHash: hashPassword(password),
      role,
    });

    const sessionUser = toSessionUser(user);
    const token = signAuthToken({
      userId: sessionUser.id,
      role: sessionUser.role,
      email: sessionUser.email,
      fullName: sessionUser.fullName,
    });

    reply.code(201).send({
      token,
      user: sessionUser,
    });
  });

  app.post<{ Body: LoginBody }>("/auth/login", async (request, reply) => {
    const email = request.body?.email?.trim().toLowerCase() ?? "";
    const password = request.body?.password ?? "";

    if (!emailPattern.test(email) || !password) {
      reply.code(400).send({
        error: "Invalid login payload.",
        message: "Provide a valid email address and password.",
      });
      return;
    }

    const user = await getUserByEmail(email);

    if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
      reply.code(401).send({
        error: "Invalid credentials.",
        message: "Email or password is incorrect.",
      });
      return;
    }

    await updateLastLogin(user.id);
    const sessionUser = toSessionUser(user);
    const token = signAuthToken({
      userId: sessionUser.id,
      role: sessionUser.role,
      email: sessionUser.email,
      fullName: sessionUser.fullName,
    });

    reply.send({
      token,
      user: sessionUser,
    });
  });

  app.post<{ Body: AdminTokenBody }>("/auth/admin-token", async (request, reply) => {
    const identifier =
      request.body?.email?.trim().toLowerCase() ||
      request.body?.username?.trim().toLowerCase() ||
      "";
    const password = request.body?.password ?? "";

    if (!emailPattern.test(identifier) || !password) {
      reply.code(400).send({
        success: false,
        message: "Provide the admin email address and password.",
      });
      return;
    }

    const user = await getUserByEmail(identifier);

    if (
      !user ||
      user.role !== "admin" ||
      !user.password_hash ||
      !verifyPassword(password, user.password_hash)
    ) {
      reply.code(401).send({
        success: false,
        message: "Invalid admin credentials.",
      });
      return;
    }

    await updateLastLogin(user.id);
    const sessionUser = toSessionUser(user);
    const token = signAuthToken({
      userId: sessionUser.id,
      role: sessionUser.role,
      email: sessionUser.email,
      fullName: sessionUser.fullName,
      permissions: adminPermissions,
    });

    reply.send({
      success: true,
      message: "Admin token generated successfully.",
      token,
      user: sessionUser,
      permissions: adminPermissions,
    });
  });

  app.post("/auth/logout", async () => {
    return {
      ok: true,
    };
  });
}
