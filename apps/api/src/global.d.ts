declare module "fastify" {
  interface FastifyRequest {
    rawBody?: string;
  }
}

declare module "pg";

export {};
