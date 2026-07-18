import { FastifyInstance } from "fastify";

import { completeDeletion, exportUserData, requestDeletion } from "../lib/privacy.js";
import { getUserIdFromRequest, requireAdmin } from "../lib/request-context.js";

export async function registerPrivacyRoutes(app: FastifyInstance) {
  app.post("/privacy/request-deletion", async (request) => {
    const userId = getUserIdFromRequest(request);
    const deletionRequest = await requestDeletion(userId);

    return {
      message: "Deletion request created.",
      deletionRequest,
    };
  });

  app.get("/privacy/export", async (request) => {
    const userId = getUserIdFromRequest(request);

    return exportUserData(userId);
  });

  app.post(
    "/admin/privacy/delete/:user_id",
    {
      preHandler: requireAdmin,
    },
    async (request, reply) => {
      const userId = Number(
        (request.params as { user_id?: string }).user_id ?? "0",
      );

      if (!Number.isFinite(userId) || userId <= 0) {
        reply.code(400).send({
          error: "Invalid user id.",
        });
        return;
      }

      const result = await completeDeletion(userId);

      return {
        message: "User data anonymized and subscription access canceled.",
        result,
      };
    },
  );
}
