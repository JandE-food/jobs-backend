import { FastifyInstance } from "fastify";

import { getCompanyBySlug, listCompanies, listJobs } from "../lib/recruiter.js";

export async function registerDirectoryRoutes(app: FastifyInstance) {
  app.get("/companies", async () => {
    return {
      companies: await listCompanies(),
    };
  });

  app.get<{ Params: { slug: string } }>("/companies/:slug", async (request, reply) => {
    const company = await getCompanyBySlug(request.params.slug);

    if (!company) {
      reply.code(404).send({
        error: "Company not found.",
      });
      return;
    }

    return {
      company,
    };
  });

  app.get("/jobs", async () => {
    return {
      jobs: await listJobs(),
    };
  });
}
