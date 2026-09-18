import { FastifyInstance } from "fastify";

import { hashPassword, signAuthToken, verifyPassword } from "../lib/auth.js";
import {
  getAuthenticatedUserFromRequest,
} from "../lib/request-context.js";
import {
  createUser,
  enableUserRole,
  getUserByEmail,
  isAppUserRole,
  switchUserRole,
  toSessionUser,
  updateSwitchPinHash,
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

type EnableRoleBody = {
  role?: string;
  switchPin?: string;
};

type SwitchRoleBody = {
  role?: string;
  pin?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const adminPermissions = ["create", "read", "update", "delete"];
const pinPattern = /^\d{4,8}$/;

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

  app.post<{ Body: EnableRoleBody }>("/auth/enable-role", async (request, reply) => {
    const user = await getAuthenticatedUserFromRequest(request);

    if (!user) {
      reply.code(401).send({
        error: "Unauthorized",
        message: "Sign in to add another account view.",
      });
      return;
    }

    const role = request.body?.role ?? "";
    const switchPin = request.body?.switchPin?.trim() ?? "";

    if (!isAppUserRole(role) || role === "admin") {
      reply.code(400).send({
        error: "Invalid role.",
        message: "Use professional or recruiter.",
      });
      return;
    }

    if (switchPin && !pinPattern.test(switchPin)) {
      reply.code(400).send({
        error: "Invalid switch pin.",
        message: "Use a 4 to 8 digit PIN or leave it empty.",
      });
      return;
    }

    let nextUser = await enableUserRole(Number(user.id), role);

    if (!nextUser) {
      reply.code(404).send({
        error: "Account not found.",
        message: "Unable to update this account.",
      });
      return;
    }

    if (switchPin) {
      nextUser = await updateSwitchPinHash(Number(user.id), hashPassword(switchPin));
    }

    if (!nextUser) {
      reply.code(500).send({
        error: "Unable to update account.",
        message: "Try again.",
      });
      return;
    }

    reply.send({
      ok: true,
      user: toSessionUser(nextUser),
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

  app.post<{ Body: SwitchRoleBody }>("/auth/switch-role", async (request, reply) => {
    const user = await getAuthenticatedUserFromRequest(request);

    if (!user) {
      reply.code(401).send({
        error: "Unauthorized",
        message: "Sign in to switch account view.",
      });
      return;
    }

    const role = request.body?.role ?? "";
    const pin = request.body?.pin?.trim() ?? "";

    if (!isAppUserRole(role) || role === "admin") {
      reply.code(400).send({
        error: "Invalid role.",
        message: "Use professional or recruiter.",
      });
      return;
    }

    const enabledRoles = Array.isArray(user.enabled_roles) ? user.enabled_roles : [user.role];

    if (!enabledRoles.includes(role)) {
      reply.code(409).send({
        error: "Role unavailable.",
        message: "Create that account view first.",
      });
      return;
    }

    if (user.switch_pin_hash) {
      if (!pin) {
        reply.code(400).send({
          error: "Switch pin required.",
          message: "Enter your switch PIN to continue.",
        });
        return;
      }

      if (!verifyPassword(pin, user.switch_pin_hash)) {
        reply.code(401).send({
          error: "Invalid switch pin.",
          message: "That switch PIN is incorrect.",
        });
        return;
      }
    }

    const nextUser = await switchUserRole(Number(user.id), role);

    if (!nextUser) {
      reply.code(500).send({
        error: "Unable to switch account.",
        message: "Try again.",
      });
      return;
    }

    reply.send({
      ok: true,
      user: toSessionUser(nextUser),
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
