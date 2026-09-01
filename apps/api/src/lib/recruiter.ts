import { pool } from "./db.js";

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeSearchTokens(value?: string) {
  return (value ?? "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

type CandidateRow = {
  id: number;
  full_name: string;
  email: string;
  role?: string;
  headline: string;
  location: string;
  summary: string;
  skills: unknown;
  education: unknown;
  experience_years: number;
  note?: string;
  added_at?: string;
};

export async function getRecruiterDashboard(recruiterUserId: number) {
  const [companyCount, jobCount, shortlistCount, candidateCount, jobsResult, shortlistsResult] =
    await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM companies
         WHERE created_by = $1`,
        [recruiterUserId],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM jobs
         WHERE created_by = $1`,
        [recruiterUserId],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM shortlists
         WHERE recruiter_user_id = $1`,
        [recruiterUserId],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM profiles p
         JOIN users u ON u.id = p.user_id
         WHERE u.role = 'professional' AND u.deleted_at IS NULL`,
        [],
      ),
      pool.query(
        `SELECT j.id, j.title, j.status, j.featured, j.location, j.salary_range, c.name AS company_name
         FROM jobs j
         JOIN companies c ON c.id = j.company_id
         WHERE j.created_by = $1
         ORDER BY j.updated_at DESC, j.created_at DESC
         LIMIT 5`,
        [recruiterUserId],
      ),
      pool.query(
        `SELECT s.id, s.name, COUNT(si.id)::int AS candidate_count
         FROM shortlists s
         LEFT JOIN shortlist_items si ON si.shortlist_id = s.id
         WHERE s.recruiter_user_id = $1
         GROUP BY s.id
         ORDER BY s.updated_at DESC, s.created_at DESC
         LIMIT 5`,
        [recruiterUserId],
      ),
    ]);

  return {
    stats: {
      companies: companyCount.rows[0]?.count ?? 0,
      jobs: jobCount.rows[0]?.count ?? 0,
      shortlists: shortlistCount.rows[0]?.count ?? 0,
      candidates: candidateCount.rows[0]?.count ?? 0,
    },
    recentJobs: jobsResult.rows,
    shortlists: shortlistsResult.rows,
  };
}

export async function searchCandidates(input: {
  query?: string;
  skills?: string;
  location?: string;
  certification?: string;
}) {
  const queryParts = ["u.role = 'professional'", "u.deleted_at IS NULL"];
  const values: string[] = [];

  if (input.query?.trim()) {
    values.push(`%${input.query.trim().toLowerCase()}%`);
    queryParts.push(
      `(
        LOWER(COALESCE(u.full_name, '')) LIKE $${values.length}
        OR LOWER(p.headline) LIKE $${values.length}
        OR LOWER(p.summary) LIKE $${values.length}
        OR LOWER(p.location) LIKE $${values.length}
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(p.skills) AS skill
          WHERE LOWER(skill) LIKE $${values.length}
        )
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(p.education) AS education
          WHERE LOWER(education) LIKE $${values.length}
        )
      )`,
    );
  }

  if (input.location?.trim()) {
    values.push(`%${input.location.trim().toLowerCase()}%`);
    queryParts.push(`LOWER(p.location) LIKE $${values.length}`);
  }

  for (const skill of normalizeSearchTokens(input.skills)) {
    values.push(skill);
    queryParts.push(
      `EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(p.skills) AS skill
        WHERE LOWER(skill) LIKE '%' || $${values.length} || '%'
      )`,
    );
  }

  for (const certification of normalizeSearchTokens(input.certification)) {
    values.push(certification);
    queryParts.push(
      `EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(p.education) AS education
        WHERE LOWER(education) LIKE '%' || $${values.length} || '%'
      )`,
    );
  }

  const result = await pool.query(
    `SELECT
      u.id,
      COALESCE(u.full_name, u.email) AS full_name,
      u.email,
      u.role,
      p.headline,
      p.location,
      p.summary,
      p.skills,
      p.education,
      p.experience_years
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     WHERE ${queryParts.join(" AND ")}
     ORDER BY p.experience_years DESC, u.created_at DESC`,
    values,
  );

  return result.rows.map((row: CandidateRow) => ({
    ...row,
    skills: asArray(row.skills),
    education: asArray(row.education),
  }));
}

export async function listShortlists(recruiterUserId: number) {
  const result = await pool.query(
    `SELECT
      s.id,
      s.name,
      s.created_at,
      COUNT(si.id)::int AS candidate_count
     FROM shortlists s
     LEFT JOIN shortlist_items si ON si.shortlist_id = s.id
     WHERE s.recruiter_user_id = $1
     GROUP BY s.id
     ORDER BY s.updated_at DESC, s.created_at DESC`,
    [recruiterUserId],
  );

  return result.rows;
}

export async function getShortlistById(
  recruiterUserId: number,
  shortlistId: number,
) {
  const shortlistResult = await pool.query(
    `SELECT
      s.id,
      s.name,
      s.created_at,
      COUNT(si.id)::int AS candidate_count
     FROM shortlists s
     LEFT JOIN shortlist_items si ON si.shortlist_id = s.id
     WHERE s.recruiter_user_id = $1 AND s.id = $2
     GROUP BY s.id`,
    [recruiterUserId, shortlistId],
  );

  const shortlist = shortlistResult.rows[0];

  if (!shortlist) {
    return null;
  }

  const candidatesResult = await pool.query(
    `SELECT
      u.id,
      COALESCE(u.full_name, u.email) AS full_name,
      u.email,
      p.headline,
      p.location,
      p.summary,
      p.skills,
      p.education,
      p.experience_years,
      si.note,
      si.created_at AS added_at
     FROM shortlist_items si
     JOIN users u ON u.id = si.candidate_user_id
     JOIN profiles p ON p.user_id = u.id
     WHERE si.shortlist_id = $1
     ORDER BY si.created_at DESC, p.experience_years DESC`,
    [shortlistId],
  );

  return {
    ...shortlist,
    candidates: candidatesResult.rows.map((row: CandidateRow) => ({
      ...row,
      skills: asArray(row.skills),
      education: asArray(row.education),
    })),
  };
}

export async function createShortlist(recruiterUserId: number, name: string) {
  const result = await pool.query(
    `INSERT INTO shortlists (recruiter_user_id, name)
     VALUES ($1, $2)
     RETURNING id, recruiter_user_id, name, created_at, updated_at`,
    [recruiterUserId, name],
  );

  return result.rows[0];
}

export async function addCandidateToShortlist(input: {
  shortlistId: number;
  candidateUserId: number;
  note?: string;
}) {
  const result = await pool.query(
    `INSERT INTO shortlist_items (shortlist_id, candidate_user_id, note)
     VALUES ($1, $2, $3)
     ON CONFLICT (shortlist_id, candidate_user_id) DO UPDATE SET note = EXCLUDED.note
     RETURNING id, shortlist_id, candidate_user_id, note, created_at`,
    [input.shortlistId, input.candidateUserId, input.note ?? ""],
  );

  return result.rows[0];
}

export async function removeCandidateFromShortlist(
  shortlistId: number,
  candidateUserId: number,
) {
  await pool.query(
    `DELETE FROM shortlist_items
     WHERE shortlist_id = $1 AND candidate_user_id = $2`,
    [shortlistId, candidateUserId],
  );
}

export async function listCompanies(recruiterUserId?: number) {
  const values = recruiterUserId ? [recruiterUserId] : [];
  const ownershipClause = recruiterUserId ? `WHERE c.created_by = $1` : "";
  const result = await pool.query(
    `SELECT
      c.id,
      c.name,
      c.slug,
      c.website,
      c.industry,
      c.size,
      c.location,
      c.description,
      c.verification_status,
      c.ad_headline,
      c.ad_copy,
      v.company_number,
      v.companies_house_status,
      v.hmrc_status,
      v.data_residency_region,
      v.right_to_work_required,
      v.retention_policy_days,
      COUNT(j.id)::int AS job_count,
      COUNT(*) FILTER (WHERE j.status = 'queued')::int AS queued_jobs
     FROM companies c
     LEFT JOIN jobs j ON j.company_id = c.id
     LEFT JOIN company_verifications v ON v.company_id = c.id
     ${ownershipClause}
     GROUP BY
      c.id,
      v.company_number,
      v.companies_house_status,
      v.hmrc_status,
      v.data_residency_region,
      v.right_to_work_required,
      v.retention_policy_days
     ORDER BY c.verification_status = 'verified' DESC, c.updated_at DESC, c.created_at DESC`,
    values,
  );

  return result.rows;
}

export async function getCompanyBySlug(slug: string) {
  const companyResult = await pool.query(
    `SELECT
      c.id,
      c.name,
      c.slug,
      c.website,
      c.industry,
      c.size,
      c.location,
      c.description,
      c.verification_status,
      c.ad_headline,
      c.ad_copy,
      v.company_number,
      v.directors,
      v.companies_house_status,
      v.hmrc_status,
      v.data_residency_region,
      v.right_to_work_required,
      v.retention_policy_days,
      v.risk_notes
     FROM companies c
     LEFT JOIN company_verifications v ON v.company_id = c.id
     WHERE c.slug = $1`,
    [slug],
  );

  const company = companyResult.rows[0];

  if (!company) {
    return null;
  }

  const jobsResult = await pool.query(
    `SELECT id, title, description, requirements, location, salary_range, status, featured, created_at
     FROM jobs
     WHERE company_id = $1
     ORDER BY featured DESC, updated_at DESC, created_at DESC`,
    [company.id],
  );

  return {
    ...company,
    directors: asArray(company.directors),
    jobs: jobsResult.rows,
  };
}

export async function createCompany(input: {
  createdBy: number;
  name: string;
  slug: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  description?: string;
  adHeadline?: string;
  adCopy?: string;
}) {
  const result = await pool.query(
    `INSERT INTO companies (
      name, slug, website, industry, size, location, description, verification_status, ad_headline, ad_copy, created_by
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10)
     RETURNING id, name, slug, website, industry, size, location, description, verification_status, ad_headline, ad_copy, created_by, created_at, updated_at`,
    [
      input.name,
      input.slug,
      input.website ?? "",
      input.industry ?? "",
      input.size ?? "",
      input.location ?? "",
      input.description ?? "",
      input.adHeadline ?? "",
      input.adCopy ?? "",
      input.createdBy,
    ],
  );

  return result.rows[0];
}

export async function updateCompany(input: {
  companyId: number;
  createdBy: number;
  name: string;
  slug: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  description?: string;
  adHeadline?: string;
  adCopy?: string;
}) {
  const result = await pool.query(
    `UPDATE companies
     SET
      name = $1,
      slug = $2,
      website = $3,
      industry = $4,
      size = $5,
      location = $6,
      description = $7,
      ad_headline = $8,
      ad_copy = $9,
      updated_at = NOW()
     WHERE id = $10 AND created_by = $11
     RETURNING id, name, slug, website, industry, size, location, description, verification_status, ad_headline, ad_copy, created_by, created_at, updated_at`,
    [
      input.name,
      input.slug,
      input.website ?? "",
      input.industry ?? "",
      input.size ?? "",
      input.location ?? "",
      input.description ?? "",
      input.adHeadline ?? "",
      input.adCopy ?? "",
      input.companyId,
      input.createdBy,
    ],
  );

  return result.rows[0] ?? null;
}

export async function deleteCompany(input: {
  companyId: number;
  createdBy: number;
}) {
  const result = await pool.query(
    `DELETE FROM companies
     WHERE id = $1 AND created_by = $2
     RETURNING id`,
    [input.companyId, input.createdBy],
  );

  return result.rowCount > 0;
}

export async function listJobs(recruiterUserId?: number) {
  const values = recruiterUserId ? [recruiterUserId] : [];
  const ownershipClause = recruiterUserId ? `WHERE j.created_by = $1` : "";
  const result = await pool.query(
    `SELECT
      j.id,
      j.company_id,
      j.title,
      j.description,
      j.requirements,
      j.location,
      j.salary_range,
      j.status,
      j.featured,
      j.created_at,
      c.name AS company_name,
      c.slug AS company_slug,
      c.verification_status AS company_verification_status
     FROM jobs j
     JOIN companies c ON c.id = j.company_id
     ${ownershipClause}
     ORDER BY j.featured DESC, j.updated_at DESC, j.created_at DESC`,
    values,
  );

  return result.rows;
}

export async function updateJob(input: {
  jobId: number;
  companyId: number;
  createdBy: number;
  title: string;
  description?: string;
  requirements?: string;
  location?: string;
  salaryRange?: string;
  status?: string;
  featured?: boolean;
}) {
  const result = await pool.query(
    `UPDATE jobs
     SET
      company_id = $1,
      title = $2,
      description = $3,
      requirements = $4,
      location = $5,
      salary_range = $6,
      status = $7,
      featured = $8,
      updated_at = NOW()
     WHERE id = $9 AND created_by = $10
     RETURNING id, company_id, title, description, requirements, location, salary_range, status, featured, created_by, created_at, updated_at`,
    [
      input.companyId,
      input.title,
      input.description ?? "",
      input.requirements ?? "",
      input.location ?? "",
      input.salaryRange ?? "",
      input.status ?? "queued",
      input.featured ?? false,
      input.jobId,
      input.createdBy,
    ],
  );

  return result.rows[0] ?? null;
}

export async function deleteJob(input: {
  jobId: number;
  createdBy: number;
}) {
  const result = await pool.query(
    `DELETE FROM jobs
     WHERE id = $1 AND created_by = $2
     RETURNING id`,
    [input.jobId, input.createdBy],
  );

  return result.rowCount > 0;
}

export async function createJob(input: {
  companyId: number;
  createdBy: number;
  title: string;
  description?: string;
  requirements?: string;
  location?: string;
  salaryRange?: string;
  status?: string;
  featured?: boolean;
}) {
  const result = await pool.query(
    `INSERT INTO jobs (
      company_id, title, description, requirements, location, salary_range, status, featured, created_by
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, company_id, title, description, requirements, location, salary_range, status, featured, created_by, created_at, updated_at`,
    [
      input.companyId,
      input.title,
      input.description ?? "",
      input.requirements ?? "",
      input.location ?? "",
      input.salaryRange ?? "",
      input.status ?? "queued",
      input.featured ?? false,
      input.createdBy,
    ],
  );

  return result.rows[0];
}
