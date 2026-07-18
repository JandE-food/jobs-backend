import cors from "@fastify/cors";
import Fastify from "fastify";

import { initializeDatabase } from "./lib/db.js";
import { registerBillingRoutes } from "./routes/billing.js";
import { registerPrivacyRoutes } from "./routes/privacy.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  void app.register(cors, {
    origin: true,
  });

  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (request, body, done) => {
      request.rawBody = body;

      if (!body) {
        done(null, {});
        return;
      }

      try {
        done(null, JSON.parse(body));
      } catch (error) {
        done(error as Error, undefined);
      }
    },
  );

  app.addHook("onReady", async () => {
    await initializeDatabase();
  });

  app.get("/health", async (_request, reply) => {
    reply.type("text/plain").send("OK");
  });

  void registerBillingRoutes(app);
  void registerWebhookRoutes(app);
  void registerPrivacyRoutes(app);

  return app;
}
