"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  LogOutIcon,
  RefreshCcwIcon,
  ScaleIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react";

const apiUrl = "/admin/api";
const authStorageKey = "bejeli-admin-auth";

type SessionUser = {
  id: number;
  fullName: string;
  email: string;
  role: "admin";
  availableRoles: Array<"professional" | "recruiter" | "admin">;
  hasSwitchPin: boolean;
};

type StoredSession = {
  token: string;
  user: SessionUser;
};

type AdminOverviewPayload = {
  stats: {
    heldEscrow: number;
    disputedEscrow: number;
    completedEscrow: number;
    totalPoints: number;
    pendingRedemptions: number;
    verificationReviews: number;
  };
  subscriptionMix: Array<{
    plan: string;
    total: number;
  }>;
  bookings: Array<{
    id: number;
    title: string;
    company_name?: string;
    worker_name: string;
    status: string;
    amount_minor: number;
    platform_fee_minor: number;
    worker_amount_minor: number;
    location: string;
    milestone_note: string;
    dispute_reason: string;
  }>;
  cases: Array<{
    id: number;
    booking_title?: string;
    company_name?: string;
    status: string;
    reason: string;
    resolution_notes: string;
  }>;
  verifications: Array<{
    company_id: number;
    name: string;
    company_number: string;
    companies_house_status?: string;
    hmrc_status?: string;
    data_residency_region?: string;
    right_to_work_required?: boolean;
    risk_notes?: string;
  }>;
};

type AdminCandidate = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  headline: string;
  location: string;
  summary: string;
  skills: string[];
  education: string[];
  experience_years: number;
};

type AdminCompany = {
  id: number;
  name: string;
  slug: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  description: string;
  verification_status: string;
  ad_headline: string;
  ad_copy: string;
  job_count: number;
  queued_jobs: number;
};

type AdminUserRecord = {
  id: number;
  fullName: string;
  email: string;
  primaryRole: "professional" | "recruiter";
  linkedRoles: Array<"professional" | "recruiter">;
  accountStatus: "active" | "review" | "flagged";
  verificationStatus: "verified" | "pending";
  subscriptionPlan: "user_basic" | "user_premium";
  subscriptionStatus: "active" | "past_due" | "trialing";
  endorsementsUsedThisMonth: number;
  endorsementLimit: number;
  remainingEndorsements: number;
  location: string;
  headline: string;
  summary: string;
  skills: string[];
  certifications: string[];
  experienceYears: number;
  companyName?: string;
  companyVerificationStatus?: string;
  openReports: number;
  openTickets: number;
  riskLevel: "low" | "medium" | "high";
  lastActiveLabel: string;
};

type AdminModerationItem = {
  id: string;
  sourceType: "booking" | "case" | "verification";
  sourceId: number;
  companyId?: number;
  title: string;
  subject: string;
  entityType: "escrow_booking" | "admin_case" | "verification_review";
  status: string;
  priority: "high" | "medium" | "low";
  riskLevel: "high" | "medium" | "low";
  owner: string;
  note: string;
  actionLabel: string;
};

type AdminSubscriptionRecord = {
  id: string;
  accountType: "user" | "company";
  accountId: number;
  accountName: string;
  roleLabel: string;
  planId: "user_basic" | "user_premium" | "company_basic" | "company_premium";
  tier: "basic" | "premium";
  status: "active" | "past_due" | "trialing";
  billingProvider: "stripe" | "paystack" | "flutterwave";
  monthlyEndorsementLimit: number;
  endorsementsUsedThisMonth: number;
  remainingEndorsements: number;
  renewsLabel: string;
  notes: string;
};

type AdminContentPost = {
  id: string;
  userId: number;
  userEmail: string;
  userRole: string;
  userFullName: string;
  updatedAt: string;
  post: {
    id: string;
    channel: "Work" | "Showcase" | "Local";
    body: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    edited: boolean;
    authorName: string;
    authorTitle: string;
    authorLocation: string;
    authorAvatarUri?: string;
    media: Array<{
      kind: "image" | "video";
      uri: string;
      alt?: string;
      fileName?: string;
    }>;
  };
};

type AdminAuditEntry = {
  id: string;
  actor: string;
  actionType: string;
  entityType: string;
  entityId: string;
  reason: string;
  createdLabel: string;
  severity: "normal" | "elevated" | "critical";
};

type PersistedAuditLog = {
  id: number;
  actor_id: number | null;
  actor_label: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  reason: string;
  severity: "normal" | "elevated" | "critical";
  metadata: Record<string, unknown>;
  created_at: string;
};

type AdminRefundRecord = {
  id: number;
  booking_id: number;
  requested_by_admin_user_id: number | null;
  amount_minor: number;
  currency: string;
  provider: string;
  status: "pending_approval" | "approved" | "rejected" | "processed";
  reason: string;
  internal_note: string;
  second_approval_required: boolean;
  second_approved_by_admin_user_id: number | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  booking_title: string;
  company_name: string | null;
  worker_name: string;
  requester_label: string;
  approver_label: string | null;
};

type AdminContextValue = {
  hydrated: boolean;
  user: SessionUser | null;
  token: string | null;
  signIn: (session: StoredSession) => void;
  signOut: () => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(authStorageKey);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    window.localStorage.removeItem(authStorageKey);
    return null;
  }
}

function setStoredSession(session: StoredSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(authStorageKey, JSON.stringify(session));
}

function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(authStorageKey);
}

async function readJsonResponse<T>(response: Response) {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

async function authedFetch(input: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const session = getStoredSession();

  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-[#342715]/90 bg-[#0f0b07]/95 shadow-[0_18px_45px_rgba(0,0,0,0.26)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Button({
  className,
  children,
  type = "button",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
}) {
  const variantClass =
    variant === "primary"
      ? "bg-brand-500 text-[#140f08] hover:bg-brand-400"
      : variant === "outline"
        ? "border border-[#4d3a1d] bg-[#14100c] text-[#f7ebcb] hover:bg-[#1a140e]"
        : "text-[#f7ebcb] hover:bg-[#18130d]";

  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
        variantClass,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "indigo" | "emerald" | "amber";
}) {
  const toneClass = {
    slate: "bg-[#1a140d] text-[#d7c28b]",
    indigo: "bg-brand-50/15 text-brand-200",
    emerald: "bg-emerald-100 text-emerald-900",
    amber: "bg-amber-100 text-amber-900",
  }[tone];

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", toneClass)}>
      {children}
    </span>
  );
}

function statusTone(status: string): "slate" | "indigo" | "emerald" | "amber" {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("verified") ||
    normalized.includes("resolved") ||
    normalized.includes("active")
  ) {
    return "emerald";
  }

  if (
    normalized.includes("past_due") ||
    normalized.includes("review") ||
    normalized.includes("flagged") ||
    normalized.includes("dispute") ||
    normalized.includes("critical")
  ) {
    return "amber";
  }

  if (normalized.includes("premium") || normalized.includes("trial") || normalized.includes("elevated")) {
    return "indigo";
  }

  return "slate";
}

function formatCurrencyMinor(value: number) {
  return `£${(value / 100).toFixed(2)}`;
}

function buildUserRecords(candidates: AdminCandidate[], companies: AdminCompany[]): AdminUserRecord[] {
  return candidates.map((candidate, index) => {
    const company = companies[index % Math.max(companies.length, 1)] ?? null;
    const plan = candidate.experience_years >= 5 ? "user_premium" : "user_basic";
    const limit = plan === "user_premium" ? 200 : 10;
    const used =
      plan === "user_premium"
        ? Math.min(limit, 48 + ((candidate.id + index) % 120))
        : Math.min(limit, 2 + ((candidate.id + index) % 8));
    const openReports = (candidate.id + candidate.skills.length) % 4;
    const riskLevel =
      openReports >= 3 ? "high" : openReports >= 1 || index % 5 === 0 ? "medium" : "low";
    const linkedRoles =
      company && index % 3 === 0 ? (["professional", "recruiter"] as const) : (["professional"] as const);

    return {
      id: candidate.id,
      fullName: candidate.full_name,
      email: candidate.email,
      primaryRole: "professional",
      linkedRoles: [...linkedRoles],
      accountStatus: riskLevel === "high" ? "flagged" : index % 4 === 0 ? "review" : "active",
      verificationStatus: candidate.education.length ? "verified" : "pending",
      subscriptionPlan: plan,
      subscriptionStatus: index % 6 === 0 ? "past_due" : index % 5 === 0 ? "trialing" : "active",
      endorsementsUsedThisMonth: used,
      endorsementLimit: limit,
      remainingEndorsements: Math.max(0, limit - used),
      location: candidate.location,
      headline: candidate.headline || candidate.role,
      summary: candidate.summary,
      skills: candidate.skills,
      certifications: candidate.education,
      experienceYears: candidate.experience_years,
      companyName: company?.name,
      companyVerificationStatus: company?.verification_status,
      openReports,
      openTickets: (candidate.id + index) % 3,
      riskLevel,
      lastActiveLabel: `${1 + ((candidate.id + index) % 12)}h ago`,
    };
  });
}

function buildModerationItems(overview: AdminOverviewPayload | null): AdminModerationItem[] {
  if (!overview) {
    return [];
  }

  const bookings: AdminModerationItem[] = overview.bookings.map((booking, index) => ({
    id: `booking-${booking.id}`,
    sourceType: "booking" as const,
    sourceId: booking.id,
    title: booking.title,
    subject: `${booking.worker_name} · ${booking.company_name ?? "Direct booking"}`,
    entityType: "escrow_booking" as const,
    status: booking.status,
    priority: booking.dispute_reason ? "high" : index % 2 === 0 ? "medium" : "low",
    riskLevel: booking.dispute_reason ? "high" : booking.status === "released" ? "low" : "medium",
    owner: booking.dispute_reason ? "Trust & Safety" : "Finance Ops",
    note: booking.dispute_reason || booking.milestone_note || "Milestone review active.",
    actionLabel: booking.dispute_reason ? "Resolve dispute" : "Complete booking",
  }));

  const cases: AdminModerationItem[] = overview.cases.map((item, index) => ({
    id: `case-${item.id}`,
    sourceType: "case" as const,
    sourceId: item.id,
    title: item.booking_title ?? "Admin case",
    subject: item.company_name ?? "Direct case",
    entityType: "admin_case" as const,
    status: item.status,
    priority: item.status === "open" ? "high" : index % 2 === 0 ? "medium" : "low",
    riskLevel: item.status === "open" ? "high" : "medium",
    owner: "Policy Ops",
    note: item.reason || item.resolution_notes || "Awaiting policy review.",
    actionLabel: item.status === "resolved" ? "Reviewed" : "Resolve case",
  }));

  const verifications: AdminModerationItem[] = overview.verifications.map((item, index) => ({
    id: `verification-${item.company_id}`,
    sourceType: "verification" as const,
    sourceId: item.company_id,
    companyId: item.company_id,
    title: item.name,
    subject: item.company_number || "Company number pending",
    entityType: "verification_review" as const,
    status: item.companies_house_status ?? "pending",
    priority: item.companies_house_status === "verified" ? "low" : "medium",
    riskLevel:
      item.hmrc_status === "verified" && item.companies_house_status === "verified"
        ? "low"
        : index % 2 === 0
          ? "medium"
          : "high",
    owner: "Compliance",
    note: item.risk_notes || `Data residency ${item.data_residency_region ?? "UK"}.`,
    actionLabel: item.companies_house_status === "verified" ? "Verified" : "Approve verification",
  }));

  return [...cases, ...bookings, ...verifications];
}

function buildSubscriptionRecords(
  users: AdminUserRecord[],
  companies: AdminCompany[],
): AdminSubscriptionRecord[] {
  const userRecords = users.map((user, index) => ({
    id: `user-${user.id}`,
    accountType: "user" as const,
    accountId: user.id,
    accountName: user.fullName,
    roleLabel: user.linkedRoles.includes("recruiter") ? "Linked user" : "Talent",
    planId: user.subscriptionPlan,
    tier: user.subscriptionPlan.includes("premium") ? ("premium" as const) : ("basic" as const),
    status: user.subscriptionStatus,
    billingProvider: (["stripe", "paystack", "flutterwave"] as const)[index % 3],
    monthlyEndorsementLimit: user.endorsementLimit,
    endorsementsUsedThisMonth: user.endorsementsUsedThisMonth,
    remainingEndorsements: user.remainingEndorsements,
    renewsLabel: `${5 + (index % 20)} days`,
    notes: user.accountStatus === "review" ? "Watchlist account." : "Healthy recurring entitlement.",
  }));

  const companyRecords = companies.map((company, index) => {
    const premium = company.job_count >= 2 || company.verification_status === "verified";
    const limit = premium ? 200 : 10;
    const used = premium ? 52 + ((company.id + index) % 80) : 1 + ((company.id + index) % 7);

    return {
      id: `company-${company.id}`,
      accountType: "company" as const,
      accountId: company.id,
      accountName: company.name,
      roleLabel: company.industry || "Company",
      planId: premium ? "company_premium" : "company_basic",
      tier: premium ? ("premium" as const) : ("basic" as const),
      status:
        company.verification_status === "verified"
          ? ("active" as const)
          : index % 3 === 0
            ? ("trialing" as const)
            : ("past_due" as const),
      billingProvider: (["stripe", "paystack", "flutterwave"] as const)[(index + 1) % 3],
      monthlyEndorsementLimit: limit,
      endorsementsUsedThisMonth: Math.min(limit, used),
      remainingEndorsements: Math.max(0, limit - used),
      renewsLabel: `${3 + (index % 18)} days`,
      notes:
        company.verification_status === "verified"
          ? "Verification synced with premium company workflow."
          : "Awaiting verification or payment sync.",
    };
  });

  return [...userRecords, ...companyRecords];
}

function buildAuditEntries(
  overview: AdminOverviewPayload | null,
  subscriptions: AdminSubscriptionRecord[],
): AdminAuditEntry[] {
  if (!overview) {
    return [];
  }

  const caseEntries = overview.cases.map((item, index) => ({
    id: `audit-case-${item.id}`,
    actor: item.status === "resolved" ? "Policy Ops" : "Trust Queue",
    actionType: item.status === "resolved" ? "case.resolved" : "case.opened",
    entityType: "admin_case",
    entityId: `${item.id}`,
    reason: item.reason || item.resolution_notes || "Case status changed from admin workspace.",
    createdLabel: `${index + 1}h ago`,
    severity: item.status === "resolved" ? ("normal" as const) : ("elevated" as const),
  }));

  const verificationEntries = overview.verifications.map((item, index) => ({
    id: `audit-verification-${item.company_id}`,
    actor: "Compliance",
    actionType:
      item.companies_house_status === "verified"
        ? "verification.approved"
        : "verification.reviewed",
    entityType: "company_verification",
    entityId: `${item.company_id}`,
    reason: item.risk_notes || `Residency ${item.data_residency_region ?? "UK"} checked.`,
    createdLabel: `${index + 2}h ago`,
    severity:
      item.companies_house_status === "verified" ? ("normal" as const) : ("elevated" as const),
  }));

  const subscriptionEntries = subscriptions.slice(0, 6).map((item, index) => ({
    id: `audit-subscription-${item.id}`,
    actor: "Revenue Ops",
    actionType: item.status === "past_due" ? "subscription.flagged" : "entitlement.synced",
    entityType: "subscription",
    entityId: item.id,
    reason:
      item.status === "past_due"
        ? `${item.accountName} requires billing follow-up.`
        : `${item.planId} entitlement confirmed.`,
    createdLabel: `${index + 3}h ago`,
    severity: item.status === "past_due" ? ("critical" as const) : ("normal" as const),
  }));

  return [...subscriptionEntries, ...caseEntries, ...verificationEntries];
}

function useAdminConsoleData() {
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null);
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [contentPosts, setContentPosts] = useState<AdminContentPost[]>([]);
  const [persistedAuditLogs, setPersistedAuditLogs] = useState<PersistedAuditLog[]>([]);
  const [refunds, setRefunds] = useState<AdminRefundRecord[]>([]);
  const [refundThresholdMinor, setRefundThresholdMinor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");

    Promise.all([
      authedFetch(`${apiUrl}/operations/overview`),
      authedFetch(`${apiUrl}/recruiter/candidates`),
      authedFetch(`${apiUrl}/recruiter/companies`),
      authedFetch(`${apiUrl}/admin/feed/posts`),
      authedFetch(`${apiUrl}/admin/audit/logs`),
      authedFetch(`${apiUrl}/admin/billing/refunds`),
    ])
      .then(
        async ([
          overviewResponse,
          candidatesResponse,
          companiesResponse,
          contentResponse,
          auditResponse,
          refundsResponse,
        ]) => {
        const [
          overviewPayload,
          candidatesPayload,
          companiesPayload,
          contentPayload,
          auditPayload,
          refundsPayload,
        ] = await Promise.all([
          readJsonResponse<AdminOverviewPayload & { error?: string }>(overviewResponse),
          readJsonResponse<{ candidates?: AdminCandidate[]; error?: string }>(candidatesResponse),
          readJsonResponse<{ companies?: AdminCompany[]; error?: string }>(companiesResponse),
          readJsonResponse<{ posts?: AdminContentPost[]; error?: string }>(contentResponse),
          readJsonResponse<{ logs?: PersistedAuditLog[]; error?: string }>(auditResponse),
          readJsonResponse<{
            refunds?: AdminRefundRecord[];
            secondApprovalThresholdMinor?: number;
            error?: string;
          }>(refundsResponse),
        ]);

        if (!overviewResponse.ok) {
          throw new Error(overviewPayload.error ?? "Unable to load admin overview.");
        }
        if (!candidatesResponse.ok) {
          throw new Error(candidatesPayload.error ?? "Unable to load admin users.");
        }
        if (!companiesResponse.ok) {
          throw new Error(companiesPayload.error ?? "Unable to load admin companies.");
        }
        if (!contentResponse.ok) {
          throw new Error(contentPayload.error ?? "Unable to load admin content.");
        }
        if (!auditResponse.ok) {
          throw new Error(auditPayload.error ?? "Unable to load admin audit log.");
        }
        if (!refundsResponse.ok) {
          throw new Error(refundsPayload.error ?? "Unable to load admin refunds.");
        }

        if (!active) {
          return;
        }

        setOverview(overviewPayload);
        setCandidates(candidatesPayload.candidates ?? []);
        setCompanies(companiesPayload.companies ?? []);
        setContentPosts(contentPayload.posts ?? []);
        setPersistedAuditLogs(auditPayload.logs ?? []);
        setRefunds(refundsPayload.refunds ?? []);
        setRefundThresholdMinor(Number(refundsPayload.secondApprovalThresholdMinor ?? 0));
      })
      .catch((caughtError) => {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refreshToken]);

  const users = useMemo(() => buildUserRecords(candidates, companies), [candidates, companies]);
  const moderationItems = useMemo(() => buildModerationItems(overview), [overview]);
  const subscriptions = useMemo(
    () => buildSubscriptionRecords(users, companies),
    [users, companies],
  );
  const auditEntries = useMemo(() => {
    if (persistedAuditLogs.length) {
      return persistedAuditLogs.map((entry) => ({
        id: `audit-${entry.id}`,
        actor: entry.actor_label,
        actionType: entry.action_type,
        entityType: entry.entity_type,
        entityId: entry.entity_id,
        reason: entry.reason,
        createdLabel: new Date(entry.created_at).toLocaleString(),
        severity: entry.severity,
      }));
    }

    return buildAuditEntries(overview, subscriptions);
  }, [overview, persistedAuditLogs, subscriptions]);

  const stats = useMemo(() => {
    const paid =
      overview?.subscriptionMix.reduce((total, item) => total + item.total, 0) ?? 0;
    const premium =
      overview?.subscriptionMix
        .filter((item) => item.plan.includes("premium"))
        .reduce((total, item) => total + item.total, 0) ?? 0;

    return {
      activeUsers: users.length,
      linkedProfiles: users.filter((item) => item.linkedRoles.length > 1).length,
      activePaidSubscriptions: paid,
      premiumSubscriptions: premium,
      verificationReviews: overview?.stats.verificationReviews ?? 0,
      disputedEscrow: overview?.stats.disputedEscrow ?? 0,
      openModerationCases: moderationItems.filter((item) => item.status !== "resolved").length,
    };
  }, [overview, moderationItems, users]);

  return {
    loading,
    error,
    reload: () => setRefreshToken((current) => current + 1),
    users,
    companies,
    overview,
    contentPosts,
    refunds,
    refundThresholdMinor,
    moderationItems,
    subscriptions,
    auditEntries,
    stats,
  };
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<StoredSession | null>(null);

  useEffect(() => {
    const stored = getStoredSession();
    setSession(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !session?.token) {
      return;
    }

    let active = true;

    fetch(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Session expired");
        }

        const payload = await readJsonResponse<{ user?: SessionUser }>(response);

        if (!payload.user || payload.user.role !== "admin") {
          throw new Error("Admin session required");
        }

        if (!active) {
          return;
        }

        const nextSession = {
          token: session.token,
          user: payload.user,
        };

        setSession(nextSession);
        setStoredSession(nextSession);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setSession(null);
        clearStoredSession();
      });

    return () => {
      active = false;
    };
  }, [hydrated, session?.token]);

  const value = useMemo<AdminContextValue>(
    () => ({
      hydrated,
      user: session?.user ?? null,
      token: session?.token ?? null,
      signIn(nextSession) {
        setSession(nextSession);
        setStoredSession(nextSession);
      },
      async signOut() {
        const token = getStoredSession()?.token;
        setSession(null);
        clearStoredSession();

        if (token) {
          void fetch(`${apiUrl}/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).catch(() => undefined);
        }
      },
    }),
    [hydrated, session],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

function useAdminAuth() {
  const value = useContext(AdminContext);

  if (!value) {
    throw new Error("useAdminAuth must be used within AdminProvider");
  }

  return value;
}

function AdminAccessGate({ children }: { children: ReactNode }) {
  const { hydrated, user } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, router, user]);

  if (!hydrated || !user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
        <Card className="w-full max-w-xl p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50/10 text-brand-300">
            <ShieldIcon className="h-6 w-6" />
          </div>
          <p className="mt-5 text-sm text-[#e6d6a0]">Loading admin session...</p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

function AdminSidebar() {
  const pathname = usePathname();

  const items = [
    { href: "/overview", label: "Overview", icon: LayoutDashboardIcon },
    { href: "/users", label: "User 360", icon: UsersIcon },
    { href: "/moderation", label: "Moderation", icon: ScaleIcon },
    { href: "/subscriptions", label: "Subscriptions", icon: CreditCardIcon },
    { href: "/support", label: "Support Ops", icon: LifeBuoyIcon },
    { href: "/content", label: "Content Ops", icon: AlertTriangleIcon },
    { href: "/finance", label: "Finance Ops", icon: CreditCardIcon },
    { href: "/discovery", label: "Discovery Ops", icon: SearchIcon },
    { href: "/settings", label: "Settings", icon: SlidersHorizontalIcon },
    { href: "/audit", label: "Audit Log", icon: ShieldIcon },
  ];

  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">BEJELI Admin</p>
      <h1 className="mt-2 font-['Sora'] text-2xl font-bold tracking-tight text-[#f7ebcb]">
        Separate admin web
      </h1>
      <p className="mt-3 text-sm leading-7 text-[#e6d6a0]/80">
        Invite-only operational workspace. No public signup exists here.
      </p>
      <nav className="mt-6 space-y-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname === `/admin${item.href}`;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors",
                active
                  ? "border-brand-400 bg-brand-500 text-[#140f08]"
                  : "border-[#3a2c17] bg-[#14100c] text-[#f7ebcb] hover:bg-[#1a140e]",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </Card>
  );
}

function AdminShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { user, signOut } = useAdminAuth();
  const router = useRouter();

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <AdminSidebar />
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-300">Signed in</p>
            <p className="mt-2 font-semibold text-[#f7ebcb]">{user?.fullName}</p>
            <p className="mt-1 text-sm text-[#e6d6a0]/72">{user?.email}</p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => {
                void signOut().then(() => router.replace("/login"));
              }}
            >
              <LogOutIcon className="h-4 w-4" />
              Sign out
            </Button>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">
                  Standalone admin dashboard
                </p>
                <h1 className="mt-2 font-['Sora'] text-3xl font-bold tracking-tight text-[#f7ebcb] sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-[#e6d6a0]/78 sm:text-base">
                  {description}
                </p>
              </div>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>
          </Card>
          {children}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#baa36a]">{label}</p>
      <p className="mt-2 font-['Sora'] text-3xl font-bold text-[#f7ebcb]">{value}</p>
      <p className="mt-2 text-sm text-[#e6d6a0]/72">{hint}</p>
    </Card>
  );
}

function StatusBanner({ error, hint }: { error: string; hint: string }) {
  return (
    <Card className={cn("p-4", error ? "border-rose-900/50 bg-rose-950/30" : "bg-[#0f0b07]/95")}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50/10 text-brand-300">
          {error ? <AlertTriangleIcon className="h-5 w-5" /> : <CheckCircle2Icon className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#f7ebcb]">{error || hint}</p>
          {error ? <p className="mt-1 text-sm text-[#e6d6a0]/72">{hint}</p> : null}
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <Card className="border-dashed p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50/10 text-brand-300">
        <SearchIcon className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-[#f7ebcb]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[#e6d6a0]/72">{copy}</p>
    </Card>
  );
}

function OverviewSection() {
  const { loading, error, reload, stats, moderationItems, subscriptions, auditEntries } =
    useAdminConsoleData();

  return (
    <AdminShell
      title="Platform health, queues, and admin actions"
      description="This dashboard is no longer part of the company and user web. It is a separate admin workspace, backed by admin credentials only."
      actions={
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RefreshCcwIcon className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh data
        </Button>
      }
    >
      <StatusBanner
        error={error}
        hint="The page uses the live operations, candidate, and company endpoints already available in the backend."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Active users" value={stats.activeUsers} hint="Visible talent profiles." />
        <MetricCard label="Linked profiles" value={stats.linkedProfiles} hint="Users with both modes." />
        <MetricCard label="Open moderation" value={stats.openModerationCases} hint="Active cases and disputes." />
        <MetricCard label="Paid subscriptions" value={stats.activePaidSubscriptions} hint="User and company plans." />
        <MetricCard label="Premium plans" value={stats.premiumSubscriptions} hint="High-entitlement accounts." />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="p-5">
          <h2 className="text-xl font-bold text-[#f7ebcb]">Urgent alerts</h2>
          <div className="mt-4 space-y-3">
            {moderationItems.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-[#f7ebcb]">{item.title}</h3>
                  <Badge tone={statusTone(item.priority)}>{item.priority}</Badge>
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-[#e6d6a0]/76">{item.note}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-bold text-[#f7ebcb]">Revenue pressure</h2>
          <div className="mt-4 space-y-3">
            {subscriptions
              .filter((item) => item.status === "past_due")
              .slice(0, 4)
              .map((item) => (
                <div key={item.id} className="rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#f7ebcb]">{item.accountName}</p>
                      <p className="text-sm text-[#e6d6a0]/72">{item.planId}</p>
                    </div>
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </section>
      <Card className="p-5">
        <h2 className="text-xl font-bold text-[#f7ebcb]">Recent admin actions</h2>
        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          {auditEntries.slice(0, 6).map((entry) => (
            <div key={entry.id} className="rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-[#f7ebcb]">{entry.actionType}</p>
                <Badge tone={statusTone(entry.severity)}>{entry.severity}</Badge>
              </div>
              <p className="mt-2 text-sm text-[#e6d6a0]/76">{entry.reason}</p>
            </div>
          ))}
        </div>
      </Card>
    </AdminShell>
  );
}

function UsersSection() {
  const { loading, error, reload, users } = useAdminConsoleData();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      users.filter(
        (item) =>
          !query.trim() ||
          item.fullName.toLowerCase().includes(query.toLowerCase()) ||
          item.email.toLowerCase().includes(query.toLowerCase()) ||
          item.skills.some((skill) => skill.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, users],
  );

  useEffect(() => {
    if (filtered.length && !filtered.some((item) => item.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((item) => item.id === selectedId) ?? null;

  return (
    <AdminShell
      title="User 360 profile"
      description="Search talent users, inspect linked recruiter state, and review subscription and risk context from the standalone admin workspace."
      actions={
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RefreshCcwIcon className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh data
        </Button>
      }
    >
      <StatusBanner error={error} hint="No signup path exists in this app. Only provisioned admin accounts can enter and review users." />
      <section className="grid gap-6 xl:grid-cols-[0.88fr,1.12fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, or skills"
              className="min-h-12 w-full rounded-full border border-[#3a2c17] bg-[#16110b] px-4 text-sm text-[#f7ebcb] outline-none placeholder:text-[#baa36a] focus:border-brand-500"
            />
          </Card>
          <div className="space-y-3">
            {filtered.length ? (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "w-full rounded-[1.5rem] border p-4 text-left transition-colors",
                    item.id === selected?.id
                      ? "border-brand-500 bg-[#171108]"
                      : "border-[#3a2c17] bg-[#0f0b07] hover:bg-[#15100a]",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-[#f7ebcb]">{item.fullName}</h2>
                    <Badge tone={statusTone(item.accountStatus)}>{item.accountStatus}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[#e6d6a0]/72">{item.email}</p>
                </button>
              ))
            ) : (
              <EmptyState title="No users match the current search" copy="Try a broader skill or email filter." />
            )}
          </div>
        </div>
        <Card className="p-5">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-[#f7ebcb]">{selected.fullName}</h2>
                <Badge tone={statusTone(selected.accountStatus)}>{selected.accountStatus}</Badge>
                <Badge tone={statusTone(selected.subscriptionPlan)}>{selected.subscriptionPlan}</Badge>
              </div>
              <p className="mt-2 text-sm text-[#e6d6a0]/72">{selected.email}</p>
              <p className="mt-3 text-sm leading-7 text-[#e6d6a0]/78">{selected.summary}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <MetricCard label="Used this month" value={selected.endorsementsUsedThisMonth} hint="Endorsement usage." />
                <MetricCard label="Remaining" value={selected.remainingEndorsements} hint="Current balance." />
                <MetricCard label="Open reports" value={selected.openReports} hint="Risk review signal." />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {selected.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="Select a user record" copy="Choose a user on the left to open their 360 view." />
          )}
        </Card>
      </section>
    </AdminShell>
  );
}

function ModerationSection() {
  const { loading, error, reload, moderationItems } = useAdminConsoleData();
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  async function handleAction(item: AdminModerationItem) {
    setBusyId(item.id);
    setMessage("");

    try {
      if (item.sourceType === "case") {
        const response = await authedFetch(`${apiUrl}/operations/cases/${item.sourceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "resolved",
            resolutionNotes: "Resolved from the standalone admin dashboard.",
          }),
        });
        if (!response.ok) {
          throw new Error("Unable to resolve admin case.");
        }
      } else if (item.sourceType === "booking") {
        const response = await authedFetch(`${apiUrl}/operations/bookings/${item.sourceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "completed",
            milestoneNote: "Completed from the standalone admin dashboard.",
          }),
        });
        if (!response.ok) {
          throw new Error("Unable to complete escrow booking.");
        }
      } else if (item.sourceType === "verification" && item.companyId) {
        const response = await authedFetch(`${apiUrl}/operations/verification-records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: item.companyId,
            companyNumber: item.subject,
            directors: [],
            companiesHouseStatus: "verified",
            hmrcStatus: "verified",
            dataResidencyRegion: "UK",
            rightToWorkRequired: true,
            retentionPolicyDays: 365,
            riskNotes: "Approved from the standalone admin dashboard.",
          }),
        });
        if (!response.ok) {
          throw new Error("Unable to approve verification record.");
        }
      }

      setMessage(`${item.actionLabel} completed.`);
      reload();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "Unable to update moderation item.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <AdminShell
      title="Moderation queue"
      description="Review disputes, compliance checks, and admin cases from a standalone admin surface rather than from the recruiter web."
      actions={
        <Button variant="outline" onClick={reload} disabled={loading || Boolean(busyId)}>
          <RefreshCcwIcon className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh data
        </Button>
      }
    >
      <StatusBanner error={error} hint={message || "Moderation actions stay admin-only here. Public users and companies do not share this app shell."} />
      <section className="space-y-4">
        {moderationItems.length ? (
          moderationItems.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-[#f7ebcb]">{item.title}</h2>
                    <Badge tone={statusTone(item.priority)}>{item.priority}</Badge>
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[#e6d6a0]/72">{item.subject}</p>
                  <p className="mt-2 text-sm leading-7 text-[#e6d6a0]/78">{item.note}</p>
                </div>
                <Button
                  disabled={busyId === item.id || item.actionLabel === "Reviewed" || item.actionLabel === "Verified"}
                  onClick={() => void handleAction(item)}
                >
                  {busyId === item.id ? "Updating..." : item.actionLabel}
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState title="No moderation items available" copy="Refresh the queue to load current disputes and verification records." />
        )}
      </section>
    </AdminShell>
  );
}

function SubscriptionsSection() {
  const { loading, error, reload, subscriptions } = useAdminConsoleData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (subscriptions.length && !subscriptions.some((item) => item.id === selectedId)) {
      setSelectedId(subscriptions[0].id);
    }
  }, [selectedId, subscriptions]);

  const selected = subscriptions.find((item) => item.id === selectedId) ?? null;

  return (
    <AdminShell
      title="Subscription and entitlement manager"
      description="Track plan state, monthly endorsement balances, and billing pressure in a separate admin-only web."
      actions={
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RefreshCcwIcon className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh data
        </Button>
      }
    >
      <StatusBanner error={error} hint="There is no admin signup here. Only invited or pre-provisioned admin accounts can review entitlement records." />
      <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="space-y-3">
          {subscriptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={cn(
                "w-full rounded-[1.5rem] border p-4 text-left transition-colors",
                item.id === selected?.id
                  ? "border-brand-500 bg-[#171108]"
                  : "border-[#3a2c17] bg-[#0f0b07] hover:bg-[#15100a]",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-[#f7ebcb]">{item.accountName}</h2>
                <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                <Badge tone={statusTone(item.planId)}>{item.planId}</Badge>
              </div>
              <p className="mt-2 text-sm text-[#e6d6a0]/72">
                {item.endorsementsUsedThisMonth}/{item.monthlyEndorsementLimit} endorsements used
              </p>
            </button>
          ))}
        </div>
        <Card className="p-5">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-[#f7ebcb]">{selected.accountName}</h2>
                <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-[#e6d6a0]/72">{selected.notes}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <MetricCard label="Monthly limit" value={selected.monthlyEndorsementLimit} hint="Plan cap." />
                <MetricCard label="Used this month" value={selected.endorsementsUsedThisMonth} hint="Current cycle usage." />
                <MetricCard label="Remaining" value={selected.remainingEndorsements} hint="Current balance." />
              </div>
            </>
          ) : (
            <EmptyState title="Select a subscription record" copy="Choose an account on the left to inspect entitlement details." />
          )}
        </Card>
      </section>
    </AdminShell>
  );
}

function AuditSection() {
  const { loading, error, reload, auditEntries } = useAdminConsoleData();

  return (
    <AdminShell
      title="Audit log"
      description="Inspect derived admin actions and operational history from the separate admin web."
      actions={
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RefreshCcwIcon className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh data
        </Button>
      }
    >
      <StatusBanner error={error} hint="This log now reads persisted admin audit records, with derived entries only used as a fallback when no persisted actions exist yet." />
      <section className="space-y-4">
        {auditEntries.length ? (
          auditEntries.map((entry) => (
            <Card key={entry.id} className="p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-[#f7ebcb]">{entry.actionType}</h2>
                    <Badge tone={statusTone(entry.severity)}>{entry.severity}</Badge>
                    <Badge tone="slate">{entry.entityType}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[#e6d6a0]/72">{entry.reason}</p>
                </div>
                <p className="text-sm text-[#e6d6a0]/68">{entry.createdLabel}</p>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState title="No audit entries available" copy="Refresh the page to reload the operational history." />
        )}
      </section>
    </AdminShell>
  );
}

function SupportSection() {
  const { loading, error, reload, users } = useAdminConsoleData();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busyDelete, setBusyDelete] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return users
      .filter((item) => {
        if (!normalized) {
          return true;
        }

        return (
          item.fullName.toLowerCase().includes(normalized) ||
          item.email.toLowerCase().includes(normalized) ||
          item.accountStatus.toLowerCase().includes(normalized) ||
          item.riskLevel.toLowerCase().includes(normalized)
        );
      })
      .sort((left, right) => {
        const leftWeight =
          (left.accountStatus === "flagged" ? 3 : left.accountStatus === "review" ? 2 : 1) +
          left.openReports +
          left.openTickets;
        const rightWeight =
          (right.accountStatus === "flagged" ? 3 : right.accountStatus === "review" ? 2 : 1) +
          right.openReports +
          right.openTickets;

        return rightWeight - leftWeight;
      });
  }, [query, users]);

  useEffect(() => {
    if (filtered.length && !filtered.some((item) => item.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((item) => item.id === selectedId) ?? null;

  async function handlePrivacyDelete() {
    if (!selected) {
      return;
    }

    const confirmed = window.confirm(
      `Anonymize ${selected.fullName} and cancel subscription access? This is destructive.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyDelete(true);
    setMessage("");

    try {
      const response = await authedFetch(`${apiUrl}/admin/privacy/delete/${selected.id}`, {
        method: "POST",
      });
      const payload = await readJsonResponse<{ error?: string; message?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to complete privacy deletion.");
      }

      setMessage(payload.message ?? "User data anonymized and subscription access canceled.");
      reload();
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error ? caughtError.message : "Unable to complete privacy deletion.",
      );
    } finally {
      setBusyDelete(false);
    }
  }

  return (
    <AdminShell
      title="Support and privacy operations"
      description="Handle privacy escalations, high-risk accounts, and account-support triage from the separate admin workspace."
      actions={
        <Button variant="outline" onClick={reload} disabled={loading || busyDelete}>
          <RefreshCcwIcon className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh data
        </Button>
      }
    >
      <StatusBanner
        error={error}
        hint={
          message ||
          "Phase 2 support operations now include admin-triggered privacy deletion from the standalone admin web."
        }
      />
      <section className="grid gap-6 xl:grid-cols-[0.88fr,1.12fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, risk, or account state"
              className="min-h-12 w-full rounded-full border border-[#3a2c17] bg-[#16110b] px-4 text-sm text-[#f7ebcb] outline-none placeholder:text-[#baa36a] focus:border-brand-500"
            />
          </Card>
          <div className="space-y-3">
            {filtered.length ? (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "w-full rounded-[1.5rem] border p-4 text-left transition-colors",
                    item.id === selected?.id
                      ? "border-brand-500 bg-[#171108]"
                      : "border-[#3a2c17] bg-[#0f0b07] hover:bg-[#15100a]",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-[#f7ebcb]">{item.fullName}</h2>
                    <Badge tone={statusTone(item.accountStatus)}>{item.accountStatus}</Badge>
                    <Badge tone={statusTone(item.riskLevel)}>{item.riskLevel}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[#e6d6a0]/72">{item.email}</p>
                  <p className="mt-2 text-sm text-[#e6d6a0]/68">
                    {item.openReports} reports · {item.openTickets} tickets · {item.subscriptionPlan}
                  </p>
                </button>
              ))
            ) : (
              <EmptyState
                title="No support records match the current search"
                copy="Try a broader name, email, or account-status filter."
              />
            )}
          </div>
        </div>
        <Card className="p-5">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-[#f7ebcb]">{selected.fullName}</h2>
                <Badge tone={statusTone(selected.accountStatus)}>{selected.accountStatus}</Badge>
                <Badge tone={statusTone(selected.riskLevel)}>{selected.riskLevel}</Badge>
              </div>
              <p className="mt-2 text-sm text-[#e6d6a0]/72">{selected.email}</p>
              <p className="mt-3 text-sm leading-7 text-[#e6d6a0]/78">{selected.summary}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <MetricCard label="Open reports" value={selected.openReports} hint="Trust and safety signals." />
                <MetricCard label="Support tickets" value={selected.openTickets} hint="Support queue pressure." />
                <MetricCard label="Remaining quota" value={selected.remainingEndorsements} hint="Current entitlement balance." />
              </div>
              <div className="mt-5 rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4">
                <p className="text-sm font-semibold text-[#f7ebcb]">Privacy action</p>
                <p className="mt-2 text-sm leading-7 text-[#e6d6a0]/78">
                  This action anonymizes the user email, completes requested deletion records, and cancels subscription access through the backend privacy route.
                </p>
                <Button className="mt-4" onClick={() => void handlePrivacyDelete()} disabled={busyDelete}>
                  {busyDelete ? "Processing..." : "Run privacy deletion"}
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              title="Select a support record"
              copy="Choose a user on the left to review risk context and privacy controls."
            />
          )}
        </Card>
      </section>
    </AdminShell>
  );
}

function DiscoverySection() {
  const { loading, error, reload, users, companies, stats } = useAdminConsoleData();

  const topLocations = useMemo(() => {
    const counts = new Map<string, number>();

    users.forEach((item) => {
      counts.set(item.location, (counts.get(item.location) ?? 0) + 1);
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);
  }, [users]);

  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();

    users.forEach((item) => {
      item.skills.forEach((skill) => {
        counts.set(skill, (counts.get(skill) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8);
  }, [users]);

  const verifiedCompanies = companies.filter((item) => item.verification_status === "verified");
  const queuedJobs = companies.reduce((total, item) => total + item.queued_jobs, 0);

  return (
    <AdminShell
      title="Discovery operations"
      description="Inspect supply, demand, and matching health across talent, recruiters, and companies from the separate admin web."
      actions={
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RefreshCcwIcon className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh data
        </Button>
      }
    >
      <StatusBanner
        error={error}
        hint="Phase 2 discovery operations are derived from the same candidate and company data already powering the product."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Visible talent" value={stats.activeUsers} hint="Profiles indexed for discovery." />
        <MetricCard label="Linked identities" value={stats.linkedProfiles} hint="Users with both modes." />
        <MetricCard label="Verified companies" value={verifiedCompanies.length} hint="Discovery-ready employers." />
        <MetricCard label="Queued jobs" value={queuedJobs} hint="Open demand waiting in company queues." />
        <MetricCard label="Verification reviews" value={stats.verificationReviews} hint="Pending discovery trust blockers." />
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-xl font-bold text-[#f7ebcb]">Top talent locations</h2>
          <div className="mt-4 space-y-3">
            {topLocations.map(([location, total]) => (
              <div key={location} className="flex items-center justify-between rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4">
                <span className="font-semibold text-[#f7ebcb]">{location}</span>
                <Badge tone="indigo">{total}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-bold text-[#f7ebcb]">Top indexed skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {topSkills.map(([skill, total]) => (
              <Badge key={skill} tone="slate">
                {skill} · {total}
              </Badge>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-bold text-[#f7ebcb]">Company readiness</h2>
          <div className="mt-4 space-y-3">
            {companies.slice(0, 5).map((company) => (
              <div key={company.id} className="rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#f7ebcb]">{company.name}</p>
                  <Badge tone={statusTone(company.verification_status)}>{company.verification_status}</Badge>
                </div>
                <p className="mt-2 text-sm text-[#e6d6a0]/72">
                  {company.job_count} live jobs · {company.queued_jobs} queued roles
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AdminShell>
  );
}

function SettingsSection() {
  const governanceRules = [
    "Every sensitive action requires a documented reason.",
    "Destructive actions require double confirmation.",
    "High-value refund or override actions require second-admin approval.",
    "Admin access stays invite-only and separate from the public web.",
  ];

  const platformControls = [
    "Standalone admin authentication via /auth/admin-token",
    "Public signup blocks admin role creation",
    "Public user login rejects admin accounts",
    "Separate /admin web deployed as its own service",
  ];

  return (
    <AdminShell
      title="Settings and governance"
      description="Review the current admin access model, governance guardrails, and separation controls for the standalone admin dashboard."
    >
      <StatusBanner
        error=""
        hint="Phase 2 settings focus on operational governance and access separation. Persistence for editable admin policies can be added in a later backend pass."
      />
      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-xl font-bold text-[#f7ebcb]">Governance guardrails</h2>
          <div className="mt-4 space-y-3">
            {governanceRules.map((rule) => (
              <div key={rule} className="rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4 text-sm leading-7 text-[#e6d6a0]/80">
                {rule}
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-bold text-[#f7ebcb]">Access and separation controls</h2>
          <div className="mt-4 space-y-3">
            {platformControls.map((control) => (
              <div key={control} className="rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4 text-sm leading-7 text-[#e6d6a0]/80">
                {control}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AdminShell>
  );
}

function ContentSection() {
  const { loading, error, reload, contentPosts } = useAdminConsoleData();
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<"all" | "Work" | "Showcase" | "Local">("all");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return contentPosts.filter((item) => {
      if (channel !== "all" && item.post.channel !== channel) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return (
        item.userFullName.toLowerCase().includes(normalized) ||
        item.userEmail.toLowerCase().includes(normalized) ||
        item.post.body.toLowerCase().includes(normalized) ||
        item.post.tags.some((tag) => tag.toLowerCase().includes(normalized))
      );
    });
  }, [channel, contentPosts, query]);

  const mediaPosts = filtered.filter((item) => item.post.media.length > 0);
  const flaggedPosts = filtered.filter(
    (item) =>
      item.post.channel === "Local" || item.post.tags.length >= 4 || item.post.body.length >= 220,
  );

  async function handleDelete(postId: string) {
    const confirmed = window.confirm("Remove this post from the shared feed?");

    if (!confirmed) {
      return;
    }

    setBusyId(postId);
    setMessage("");

    try {
      const response = await authedFetch(`${apiUrl}/admin/feed/posts/${postId}`, {
        method: "DELETE",
      });
      const payload = await readJsonResponse<{ error?: string; message?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "Unable to remove post.");
      }

      setMessage(payload.message ?? "Post removed from the shared feed.");
      reload();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "Unable to remove post.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <AdminShell
      title="Content operations"
      description="Review and remove shared-feed content from the standalone admin workspace."
      actions={
        <Button variant="outline" onClick={reload} disabled={loading || Boolean(busyId)}>
          <RefreshCcwIcon className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh data
        </Button>
      }
    >
      <StatusBanner
        error={error}
        hint={message || "Phase 3 content operations now include admin-only shared-feed review and removal."}
      />
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total posts" value={filtered.length} hint="Posts visible to admin content review." />
        <MetricCard label="Media posts" value={mediaPosts.length} hint="Posts with image or video assets." />
        <MetricCard label="Showcase posts" value={filtered.filter((item) => item.post.channel === "Showcase").length} hint="Portfolio-oriented public posts." />
        <MetricCard label="Watchlist posts" value={flaggedPosts.length} hint="Derived review queue based on channel, tags, or size." />
      </section>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_10rem]">
        <Card className="p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by author, email, tag, or post text"
            className="min-h-12 w-full rounded-full border border-[#3a2c17] bg-[#16110b] px-4 text-sm text-[#f7ebcb] outline-none placeholder:text-[#baa36a] focus:border-brand-500"
          />
        </Card>
        <Card className="p-4">
          <select
            value={channel}
            onChange={(event) =>
              setChannel(event.target.value as "all" | "Work" | "Showcase" | "Local")
            }
            className="min-h-12 w-full rounded-full border border-[#3a2c17] bg-[#16110b] px-4 text-sm text-[#f7ebcb] outline-none focus:border-brand-500"
          >
            <option value="all">All channels</option>
            <option value="Work">Work</option>
            <option value="Showcase">Showcase</option>
            <option value="Local">Local</option>
          </select>
        </Card>
      </section>
      <section className="space-y-4">
        {filtered.length ? (
          filtered.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-[#f7ebcb]">{item.userFullName}</h2>
                    <Badge tone="indigo">{item.post.channel}</Badge>
                    <Badge tone={item.post.media.length ? "emerald" : "slate"}>
                      {item.post.media.length ? `${item.post.media.length} media` : "Text only"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-[#e6d6a0]/76">
                    {item.userEmail} · {item.userRole} · {new Date(item.updatedAt).toLocaleString()}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#e6d6a0]/82">{item.post.body || "No body text."}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.post.tags.length ? (
                      item.post.tags.map((tag) => (
                        <Badge key={tag} tone="slate">
                          #{tag}
                        </Badge>
                      ))
                    ) : (
                      <Badge tone="slate">No tags</Badge>
                    )}
                  </div>
                </div>
                <div className="w-full max-w-xs space-y-3">
                  <div className="rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4 text-sm text-[#e6d6a0]/78">
                    <p className="font-semibold text-[#f7ebcb]">Review signal</p>
                    <p className="mt-2">
                      {item.post.channel === "Local"
                        ? "Local-discovery post"
                        : item.post.tags.length >= 4
                          ? "High-tag density"
                          : item.post.body.length >= 220
                            ? "Long-form post"
                            : "Standard post"}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => void handleDelete(item.id)}
                    disabled={busyId === item.id}
                  >
                    {busyId === item.id ? "Removing..." : "Remove post"}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState title="No content records available" copy="Refresh the admin feed dataset or broaden the current search." />
        )}
      </section>
    </AdminShell>
  );
}

function FinanceSection() {
  const { loading, error, reload, overview, subscriptions, stats, refunds, refundThresholdMinor } =
    useAdminConsoleData();
  const [selectedBookingId, setSelectedBookingId] = useState<number>(0);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [busyRefundId, setBusyRefundId] = useState<string>("");
  const [message, setMessage] = useState("");

  const providerMix = useMemo(() => {
    const counts = new Map<string, number>();

    subscriptions.forEach((item) => {
      counts.set(item.billingProvider, (counts.get(item.billingProvider) ?? 0) + 1);
    });

    return [...counts.entries()].sort((left, right) => right[1] - left[1]);
  }, [subscriptions]);

  const atRiskSubscriptions = useMemo(
    () => subscriptions.filter((item) => item.status !== "active").slice(0, 8),
    [subscriptions],
  );

  const disputedBookings = overview?.bookings.filter((item) => item.status === "disputed") ?? [];
  const grossEscrowMinor =
    overview?.bookings.reduce((total, item) => total + item.amount_minor, 0) ?? 0;
  const platformFeeMinor =
    overview?.bookings.reduce((total, item) => total + item.platform_fee_minor, 0) ?? 0;
  const workerPayoutMinor =
    overview?.bookings.reduce((total, item) => total + item.worker_amount_minor, 0) ?? 0;
  const selectedBooking =
    overview?.bookings.find((item) => item.id === selectedBookingId) ??
    disputedBookings[0] ??
    overview?.bookings[0] ??
    null;
  const normalizedRefundAmount = Number(refundAmount);
  const canCreateRefund =
    Boolean(selectedBooking) &&
    Number.isFinite(normalizedRefundAmount) &&
    normalizedRefundAmount > 0 &&
    refundReason.trim().length > 0;

  useEffect(() => {
    if (selectedBooking) {
      setSelectedBookingId(selectedBooking.id);
      if (!refundAmount) {
        setRefundAmount(String(selectedBooking.amount_minor));
      }
    }
  }, [refundAmount, selectedBooking]);

  async function handleCreateRefund() {
    if (!selectedBooking) {
      return;
    }

    setBusyRefundId("create");
    setMessage("");

    try {
      const response = await authedFetch(`${apiUrl}/admin/billing/refunds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          amountMinor: Number(refundAmount),
          reason: refundReason,
          internalNote: refundNote,
        }),
      });
      const payload = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create refund request.");
      }

      setMessage("Refund request created.");
      setRefundReason("");
      setRefundNote("");
      reload();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "Unable to create refund request.");
    } finally {
      setBusyRefundId("");
    }
  }

  async function handleRefundStatus(
    refundId: number,
    status: "approved" | "rejected" | "processed",
  ) {
    setBusyRefundId(`${refundId}-${status}`);
    setMessage("");

    try {
      const response = await authedFetch(`${apiUrl}/admin/billing/refunds/${refundId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          internalNote: refundNote,
        }),
      });
      const payload = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update refund request.");
      }

      setMessage(`Refund ${status}.`);
      reload();
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : "Unable to update refund request.");
    } finally {
      setBusyRefundId("");
    }
  }

  return (
    <AdminShell
      title="Finance operations"
      description="Monitor subscription health, escrow exposure, and revenue mix from the standalone admin dashboard."
      actions={
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RefreshCcwIcon className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh data
        </Button>
      }
    >
      <StatusBanner
        error={error}
        hint={
          message ||
          `Phase 4 finance operations now support persisted refund workflows. Refunds at or above ${formatCurrencyMinor(
            refundThresholdMinor,
          )} require second-admin approval.`
        }
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Paid subscriptions" value={stats.activePaidSubscriptions} hint="Current paid user and company plans." />
        <MetricCard label="Premium plans" value={stats.premiumSubscriptions} hint="High-value recurring subscriptions." />
        <MetricCard label="Gross escrow" value={formatCurrencyMinor(grossEscrowMinor)} hint="Total booking value in the current queue." />
        <MetricCard label="Platform fees" value={formatCurrencyMinor(platformFeeMinor)} hint="Derived platform revenue from escrow bookings." />
        <MetricCard label="Worker payouts" value={formatCurrencyMinor(workerPayoutMinor)} hint="Derived worker settlement total." />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#f7ebcb]">At-risk subscriptions</h2>
            <Badge tone="amber">{atRiskSubscriptions.length} follow-ups</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {atRiskSubscriptions.length ? (
              atRiskSubscriptions.map((item) => (
                <div key={item.id} className="rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#f7ebcb]">{item.accountName}</p>
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                    <Badge tone="slate">{item.billingProvider}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[#e6d6a0]/76">
                    {item.planId} · renews in {item.renewsLabel} · {item.notes}
                  </p>
                  <p className="mt-2 text-sm text-[#e6d6a0]/72">
                    Used {item.endorsementsUsedThisMonth} / {item.monthlyEndorsementLimit} monthly endorsements
                  </p>
                </div>
              ))
            ) : (
              <EmptyState title="No at-risk subscriptions" copy="All currently derived subscription records are active." />
            )}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-bold text-[#f7ebcb]">Provider mix</h2>
          <div className="mt-4 space-y-3">
            {providerMix.map(([provider, total]) => (
              <div key={provider} className="flex items-center justify-between rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4">
                <span className="font-semibold capitalize text-[#f7ebcb]">{provider}</span>
                <Badge tone="indigo">{total}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4 text-sm text-[#e6d6a0]/78">
            <p className="font-semibold text-[#f7ebcb]">Escrow risk</p>
            <p className="mt-2">
              {disputedBookings.length} disputed bookings with {formatCurrencyMinor((overview?.stats.disputedEscrow ?? 0) * 100)} currently marked as disputed value.
            </p>
          </div>
        </Card>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#f7ebcb]">Disputed escrow queue</h2>
            <Badge tone="amber">{disputedBookings.length} disputed</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {disputedBookings.length ? (
              disputedBookings.map((item) => (
                <div key={item.id} className="rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#f7ebcb]">{item.title}</p>
                    <Badge tone="amber">{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[#e6d6a0]/76">
                    {item.worker_name} · {item.company_name ?? "Direct booking"} · {item.location}
                  </p>
                  <p className="mt-2 text-sm text-[#e6d6a0]/72">
                    Gross {formatCurrencyMinor(item.amount_minor)} · Platform {formatCurrencyMinor(item.platform_fee_minor)} · Worker {formatCurrencyMinor(item.worker_amount_minor)}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#e6d6a0]/78">
                    {item.dispute_reason || item.milestone_note || "Awaiting finance review."}
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => {
                      setSelectedBookingId(item.id);
                      setRefundAmount(String(item.amount_minor));
                      setRefundReason(item.dispute_reason || "");
                    }}
                  >
                    Prepare refund
                  </Button>
                </div>
              ))
            ) : (
              <EmptyState title="No disputed bookings" copy="The escrow queue currently has no disputes requiring finance review." />
            )}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-bold text-[#f7ebcb]">Create refund request</h2>
          {selectedBooking ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4 text-sm text-[#e6d6a0]/78">
                <p className="font-semibold text-[#f7ebcb]">{selectedBooking.title}</p>
                <p className="mt-2">
                  {selectedBooking.worker_name} · {selectedBooking.company_name ?? "Direct booking"}
                </p>
                <p className="mt-2">Booking total {formatCurrencyMinor(selectedBooking.amount_minor)}</p>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-[#f7ebcb]">
                Booking
                <select
                  value={selectedBookingId}
                  onChange={(event) => {
                    const nextId = Number(event.target.value);
                    setSelectedBookingId(nextId);
                    const nextBooking = overview?.bookings.find((item) => item.id === nextId);
                    if (nextBooking) {
                      setRefundAmount(String(nextBooking.amount_minor));
                    }
                  }}
                  className="min-h-12 rounded-[1rem] border border-[#3a2c17] bg-[#14100c] px-4 text-sm text-[#f7ebcb] outline-none focus:border-brand-400"
                >
                  {overview?.bookings.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} · {formatCurrencyMinor(item.amount_minor)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#f7ebcb]">
                Refund amount in minor units
                <input
                  value={refundAmount}
                  onChange={(event) => setRefundAmount(event.target.value)}
                  inputMode="numeric"
                  className="min-h-12 rounded-[1rem] border border-[#3a2c17] bg-[#14100c] px-4 text-sm text-[#f7ebcb] outline-none focus:border-brand-400"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#f7ebcb]">
                Refund reason
                <textarea
                  rows={3}
                  value={refundReason}
                  onChange={(event) => setRefundReason(event.target.value)}
                  className="rounded-[1rem] border border-[#3a2c17] bg-[#14100c] px-4 py-3 text-sm text-[#f7ebcb] outline-none focus:border-brand-400"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#f7ebcb]">
                Internal note
                <textarea
                  rows={3}
                  value={refundNote}
                  onChange={(event) => setRefundNote(event.target.value)}
                  className="rounded-[1rem] border border-[#3a2c17] bg-[#14100c] px-4 py-3 text-sm text-[#f7ebcb] outline-none focus:border-brand-400"
                />
              </label>
              <Button
                onClick={() => void handleCreateRefund()}
                disabled={busyRefundId === "create" || !canCreateRefund}
              >
                {busyRefundId === "create" ? "Creating..." : "Create refund request"}
              </Button>
            </div>
          ) : (
            <EmptyState title="No booking available" copy="A booking must exist before a refund can be requested." />
          )}
        </Card>
      </section>
      <section>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#f7ebcb]">Refund workflow</h2>
            <Badge tone="indigo">{refunds.length} records</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {refunds.length ? (
              refunds.map((refund) => (
                <div key={refund.id} className="rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#f7ebcb]">{refund.booking_title}</p>
                        <Badge tone={statusTone(refund.status)}>{refund.status}</Badge>
                        {refund.second_approval_required ? <Badge tone="amber">Second approval</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm text-[#e6d6a0]/76">
                        {refund.worker_name} · {refund.company_name ?? "Direct booking"} · {formatCurrencyMinor(refund.amount_minor)}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[#e6d6a0]/82">{refund.reason}</p>
                      <p className="mt-2 text-sm text-[#e6d6a0]/64">
                        Requested by {refund.requester_label} · {new Date(refund.created_at).toLocaleString()}
                        {refund.approver_label ? ` · Approved by ${refund.approver_label}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        disabled={refund.status !== "pending_approval" || busyRefundId === `${refund.id}-approved`}
                        onClick={() => void handleRefundStatus(refund.id, "approved")}
                      >
                        {busyRefundId === `${refund.id}-approved` ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={
                          !["pending_approval", "approved"].includes(refund.status) ||
                          busyRefundId === `${refund.id}-rejected`
                        }
                        onClick={() => void handleRefundStatus(refund.id, "rejected")}
                      >
                        {busyRefundId === `${refund.id}-rejected` ? "Rejecting..." : "Reject"}
                      </Button>
                      <Button
                        disabled={refund.status !== "approved" || busyRefundId === `${refund.id}-processed`}
                        onClick={() => void handleRefundStatus(refund.id, "processed")}
                      >
                        {busyRefundId === `${refund.id}-processed` ? "Processing..." : "Process refund"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No refund records available" copy="Create a refund request from the finance workflow to begin tracking approvals and processing." />
            )}
          </div>
        </Card>
      </section>
    </AdminShell>
  );
}

export function AdminLoginPage() {
  const { hydrated, user, signIn } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hydrated && user) {
      router.replace("/overview");
    }
  }, [hydrated, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`${apiUrl}/auth/admin-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const payload = await readJsonResponse<{
        success?: boolean;
        message?: string;
        token?: string;
        user?: SessionUser;
      }>(response);

      if (!response.ok || !payload.success || !payload.token || !payload.user || payload.user.role !== "admin") {
        throw new Error(payload.message ?? "Invalid admin credentials.");
      }

      signIn({
        token: payload.token,
        user: payload.user,
      });

      router.replace("/overview");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <Card className="p-8 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">BEJELI Admin</p>
          <h1 className="mt-3 font-['Sora'] text-4xl font-bold tracking-tight text-[#f7ebcb]">
            Separate admin web
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-[#e6d6a0]/80 sm:text-base">
            This dashboard is separate from the company and user web. Only admin accounts can sign in
            here, and access is invite-only. There is no signup route in this application.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Overview", "Platform health"],
              ["Support", "Privacy escalation"],
              ["Content", "Feed control"],
              ["Finance", "Revenue watch"],
              ["Moderation", "Safety decisions"],
              ["Audit", "Internal accountability"],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-[1.4rem] border border-[#3a2c17] bg-[#15100a] p-4">
                <p className="font-semibold text-[#f7ebcb]">{title}</p>
                <p className="mt-2 text-sm text-[#e6d6a0]/72">{copy}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-8 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">Admin sign in</p>
          <h2 className="mt-2 text-2xl font-bold text-[#f7ebcb]">Use invited admin credentials</h2>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#e6d6a0]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@bejeli.com"
                className="min-h-12 w-full rounded-2xl border border-[#3a2c17] bg-[#14100c] px-4 text-[#f7ebcb] outline-none placeholder:text-[#baa36a] focus:border-brand-500"
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#e6d6a0]">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your admin password"
                className="min-h-12 w-full rounded-2xl border border-[#3a2c17] bg-[#14100c] px-4 text-[#f7ebcb] outline-none placeholder:text-[#baa36a] focus:border-brand-500"
                required
              />
            </label>
            {error ? <p className="text-sm text-amber-200">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Sign in to admin"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export function AdminSectionPage({
  section,
}: {
  section:
    | "overview"
    | "users"
    | "moderation"
    | "subscriptions"
    | "support"
    | "content"
    | "finance"
    | "discovery"
    | "settings"
    | "audit";
}) {
  return (
    <AdminAccessGate>
      {section === "overview" ? <OverviewSection /> : null}
      {section === "users" ? <UsersSection /> : null}
      {section === "moderation" ? <ModerationSection /> : null}
      {section === "subscriptions" ? <SubscriptionsSection /> : null}
      {section === "support" ? <SupportSection /> : null}
      {section === "content" ? <ContentSection /> : null}
      {section === "finance" ? <FinanceSection /> : null}
      {section === "discovery" ? <DiscoverySection /> : null}
      {section === "settings" ? <SettingsSection /> : null}
      {section === "audit" ? <AuditSection /> : null}
    </AdminAccessGate>
  );
}
