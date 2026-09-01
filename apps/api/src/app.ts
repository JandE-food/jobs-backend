import cors from "@fastify/cors";
import Fastify from "fastify";

import { initializeDatabase } from "./lib/db.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerBillingRoutes } from "./routes/billing.js";
import { registerDirectoryRoutes } from "./routes/directory.js";
import { registerFeedRoutes } from "./routes/feed.js";
import { registerOperationsRoutes } from "./routes/operations.js";
import { registerPrivacyRoutes } from "./routes/privacy.js";
import { registerRecruiterRoutes } from "./routes/recruiter.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";

export function buildApp(options?: { initializeDb?: boolean }) {
  const app = Fastify({
    logger: true,
  });
  const shouldInitializeDb = options?.initializeDb ?? true;

  void app.register(cors, {
    origin: true,
  });

  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (request, body, done) => {
      const rawBody = typeof body === "string" ? body : body.toString("utf8");
      request.rawBody = rawBody;

      if (!rawBody) {
        done(null, {});
        return;
      }

      try {
        done(null, JSON.parse(rawBody));
      } catch (error) {
        done(error as Error, undefined);
      }
    },
  );

  if (shouldInitializeDb) {
    app.addHook("onReady", async () => {
      await initializeDatabase();
    });
  }

  app.get("/health", async (_request, reply) => {
    reply.type("text/plain").send("OK");
  });

  void registerBillingRoutes(app);
  void registerAuthRoutes(app);
  void registerDirectoryRoutes(app);
  void registerFeedRoutes(app);
  void registerOperationsRoutes(app);
  void registerWebhookRoutes(app);
  void registerPrivacyRoutes(app);
  void registerRecruiterRoutes(app);

  return app;
}
