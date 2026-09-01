import { FastifyInstance } from "fastify";

import {
  handleFlutterwaveWebhook,
  verifyFlutterwaveSignature,
} from "../lib/flutterwave.js";
import { handlePaystackWebhook, verifyPaystackSignature } from "../lib/paystack.js";
import { handleStripeWebhook } from "../lib/stripe.js";

export async function registerWebhookRoutes(app: FastifyInstance) {
  app.post("/webhooks/stripe", async (request, reply) => {
    const signature = request.headers["stripe-signature"];
    const stripeSignature = Array.isArray(signature) ? signature[0] : signature;

    const eventType = await handleStripeWebhook({
      rawBody: request.rawBody ?? JSON.stringify(request.body ?? {}),
      signature: stripeSignature,
    });

    reply.send({
      received: true,
      eventType,
    });
  });

  app.post("/webhooks/paystack", async (request, reply) => {
    const signature = request.headers["x-paystack-signature"];
    const paystackSignature = Array.isArray(signature) ? signature[0] : signature;
    const rawBody = request.rawBody ?? JSON.stringify(request.body ?? {});

    if (!verifyPaystackSignature(rawBody, paystackSignature)) {
      reply.code(401).send({
        error: "Invalid Paystack signature.",
      });
      return;
    }

    const eventType = await handlePaystackWebhook(rawBody);

    reply.send({
      received: true,
      eventType,
    });
  });

  app.post("/webhooks/flutterwave", async (request, reply) => {
    const signature = request.headers["verif-hash"];
    const flutterwaveSignature = Array.isArray(signature)
      ? signature[0]
      : signature;

    if (!verifyFlutterwaveSignature(flutterwaveSignature)) {
      reply.code(401).send({
        error: "Invalid Flutterwave signature.",
      });
      return;
    }

    const rawBody = request.rawBody ?? JSON.stringify(request.body ?? {});
    const eventType = await handleFlutterwaveWebhook(rawBody);

    reply.send({
      received: true,
      eventType,
    });
  });
}
