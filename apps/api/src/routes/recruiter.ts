import { FastifyInstance } from "fastify";

import {
  addCandidateToShortlist,
  createCompany,
  createJob,
  createShortlist,
  deleteCompany,
  deleteJob,
  getShortlistById,
  getRecruiterDashboard,
  listCompanies,
  listShortlists,
  removeCandidateFromShortlist,
  searchCandidates,
  updateCompany,
  updateJob,
} from "../lib/recruiter.js";
import { requireRole, requireUser } from "../lib/request-context.js";

type CandidateQuery = {
  query?: string;
  skills?: string;
  location?: string;
  certification?: string;
};

type ShortlistBody = {
  name?: string;
};

type ShortlistItemBody = {
  candidateUserId?: number;
  note?: string;
};

type CompanyBody = {
  name?: string;
  slug?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  description?: string;
  adHeadline?: string;
  adCopy?: string;
};

type JobBody = {
  companyId?: number;
  title?: string;
  description?: string;
  requirements?: string;
  location?: string;
  salaryRange?: string;
  status?: string;
  featured?: boolean;
};

export async function registerRecruiterRoutes(app: FastifyInstance) {
  app.get("/recruiter/dashboard", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    return getRecruiterDashboard(Number(user.id));
  });

  app.get<{ Querystring: CandidateQuery }>(
    "/recruiter/candidates",
    async (request, reply) => {
      const user = await requireRole(request, reply, ["recruiter", "admin"]);

      if (!user) {
        return;
      }

      return {
        candidates: await searchCandidates({
          query: request.query?.query,
          skills: request.query?.skills,
          location: request.query?.location,
          certification: request.query?.certification,
        }),
      };
    },
  );

  app.get("/recruiter/shortlists", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    return {
      shortlists: await listShortlists(Number(user.id)),
    };
  });

  app.get<{ Params: { id: string } }>(
    "/recruiter/shortlists/:id",
    async (request, reply) => {
      const user = await requireRole(request, reply, ["recruiter", "admin"]);

      if (!user) {
        return;
      }

      const shortlistId = Number(request.params.id);

      if (!shortlistId) {
        reply.code(400).send({
          error: "Shortlist id is required.",
        });
        return;
      }

      const shortlist = await getShortlistById(Number(user.id), shortlistId);

      if (!shortlist) {
        reply.code(404).send({
          error: "Shortlist not found.",
        });
        return;
      }

      return { shortlist };
    },
  );

  app.post<{ Body: ShortlistBody }>(
    "/recruiter/shortlists",
    async (request, reply) => {
      const user = await requireRole(request, reply, ["recruiter", "admin"]);

      if (!user) {
        return;
      }

      const name = request.body?.name?.trim();

      if (!name) {
        reply.code(400).send({
          error: "Invalid shortlist name.",
        });
        return;
      }

      reply.code(201).send({
        shortlist: await createShortlist(Number(user.id), name),
      });
    },
  );

  app.post<{ Params: { id: string }; Body: ShortlistItemBody }>(
    "/recruiter/shortlists/:id/items",
    async (request, reply) => {
      const user = await requireRole(request, reply, ["recruiter", "admin"]);

      if (!user) {
        return;
      }

      const shortlistId = Number(request.params.id);
      const candidateUserId = Number(request.body?.candidateUserId);

      if (!shortlistId || !candidateUserId) {
        reply.code(400).send({
          error: "Shortlist id and candidate user id are required.",
        });
        return;
      }

      reply.code(201).send({
        item: await addCandidateToShortlist({
          shortlistId,
          candidateUserId,
          note: request.body?.note,
        }),
      });
    },
  );

  app.delete<{ Params: { id: string; candidateId: string } }>(
    "/recruiter/shortlists/:id/items/:candidateId",
    async (request, reply) => {
      const user = await requireRole(request, reply, ["recruiter", "admin"]);

      if (!user) {
        return;
      }

      const shortlistId = Number(request.params.id);
      const candidateId = Number(request.params.candidateId);

      if (!shortlistId || !candidateId) {
        reply.code(400).send({
          error: "Shortlist id and candidate id are required.",
        });
        return;
      }

      await removeCandidateFromShortlist(shortlistId, candidateId);
      reply.send({ ok: true });
    },
  );

  app.get("/recruiter/companies", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    return {
      companies: await listCompanies(Number(user.id)),
    };
  });

  app.post<{ Body: CompanyBody }>("/companies", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    const name = request.body?.name?.trim();
    const slug = request.body?.slug?.trim();

    if (!name || !slug) {
      reply.code(400).send({
        error: "Company name and slug are required.",
      });
      return;
    }

    const existingCompanies = await listCompanies(Number(user.id));

    if (existingCompanies.length > 0) {
      reply.code(409).send({
        error:
          "Recruiter accounts can only own one company. Delete the current company before creating another one.",
      });
      return;
    }

    reply.code(201).send({
      company: await createCompany({
        createdBy: Number(user.id),
        name,
        slug,
        website: request.body?.website,
        industry: request.body?.industry,
        size: request.body?.size,
        location: request.body?.location,
        description: request.body?.description,
        adHeadline: request.body?.adHeadline,
        adCopy: request.body?.adCopy,
      }),
    });
  });

  app.put<{ Params: { id: string }; Body: CompanyBody }>(
    "/companies/:id",
    async (request, reply) => {
      const user = await requireRole(request, reply, ["recruiter", "admin"]);

      if (!user) {
        return;
      }

      const companyId = Number(request.params.id);
      const name = request.body?.name?.trim();
      const slug = request.body?.slug?.trim();

      if (!companyId || !name || !slug) {
        reply.code(400).send({
          error: "Company id, name, and slug are required.",
        });
        return;
      }

      const company = await updateCompany({
        companyId,
        createdBy: Number(user.id),
        name,
        slug,
        website: request.body?.website,
        industry: request.body?.industry,
        size: request.body?.size,
        location: request.body?.location,
        description: request.body?.description,
        adHeadline: request.body?.adHeadline,
        adCopy: request.body?.adCopy,
      });

      if (!company) {
        reply.code(404).send({
          error: "Company not found.",
        });
        return;
      }

      reply.send({ company });
    },
  );

  app.delete<{ Params: { id: string } }>("/companies/:id", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    const companyId = Number(request.params.id);

    if (!companyId) {
      reply.code(400).send({
        error: "Company id is required.",
      });
      return;
    }

    const deleted = await deleteCompany({
      companyId,
      createdBy: Number(user.id),
    });

    if (!deleted) {
      reply.code(404).send({
        error: "Company not found.",
      });
      return;
    }

    reply.code(204).send();
  });

  app.post<{ Body: JobBody }>("/jobs", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    const companyId = Number(request.body?.companyId);
    const title = request.body?.title?.trim();

    if (!companyId || !title) {
      reply.code(400).send({
        error: "Company id and title are required.",
      });
      return;
    }

    reply.code(201).send({
      job: await createJob({
        companyId,
        createdBy: Number(user.id),
        title,
        description: request.body?.description,
        requirements: request.body?.requirements,
        location: request.body?.location,
        salaryRange: request.body?.salaryRange,
        status: request.body?.status,
        featured: request.body?.featured,
      }),
    });
  });

  app.get("/recruiter/jobs", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    return {
      jobs: await listJobs(Number(user.id)),
    };
  });

  app.put<{ Params: { id: string }; Body: JobBody }>(
    "/jobs/:id",
    async (request, reply) => {
      const user = await requireRole(request, reply, ["recruiter", "admin"]);

      if (!user) {
        return;
      }

      const jobId = Number(request.params.id);
      const companyId = Number(request.body?.companyId);
      const title = request.body?.title?.trim();

      if (!jobId || !companyId || !title) {
        reply.code(400).send({
          error: "Job id, company id, and title are required.",
        });
        return;
      }

      const job = await updateJob({
        jobId,
        companyId,
        createdBy: Number(user.id),
        title,
        description: request.body?.description,
        requirements: request.body?.requirements,
        location: request.body?.location,
        salaryRange: request.body?.salaryRange,
        status: request.body?.status,
        featured: request.body?.featured,
      });

      if (!job) {
        reply.code(404).send({
          error: "Job not found.",
        });
        return;
      }

      reply.send({ job });
    },
  );

  app.delete<{ Params: { id: string } }>("/jobs/:id", async (request, reply) => {
    const user = await requireRole(request, reply, ["recruiter", "admin"]);

    if (!user) {
      return;
    }

    const jobId = Number(request.params.id);

    if (!jobId) {
      reply.code(400).send({
        error: "Job id is required.",
      });
      return;
    }

    const deleted = await deleteJob({
      jobId,
      createdBy: Number(user.id),
    });

    if (!deleted) {
      reply.code(404).send({
        error: "Job not found.",
      });
      return;
    }

    reply.code(204).send();
  });

  app.get("/session/ping", async (request, reply) => {
    const user = await requireUser(request, reply);

    if (!user) {
      return;
    }

    return {
      ok: true,
      userId: user.id,
      role: user.role,
    };
  });
}
