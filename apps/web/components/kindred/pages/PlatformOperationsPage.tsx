"use client";

import { useEffect, useState } from "react";

import { apiUrl, authedFetch, readJsonResponse } from "../../api";
import { Badge, Button, Card } from "../primitives";

type OverviewPayload = {
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

export function PlatformOperationsPage() {
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  async function loadOverview() {
    const response = await authedFetch(`${apiUrl}/operations/overview`);
    const payload = await readJsonResponse<OverviewPayload & { error?: string }>(response);

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load platform operations.");
    }

    setOverview(payload);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadOverview().catch((caughtError) => {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load platform operations.",
        );
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  async function updateBookingStatus(
    bookingId: number,
    status: "released" | "disputed" | "completed",
  ) {
    setBusyKey(`booking-${bookingId}-${status}`);
    setMessage("");
    setError("");

    try {
      const response = await authedFetch(`${apiUrl}/operations/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          disputeReason:
            status === "disputed" ? "Raised from operations workspace." : undefined,
          milestoneNote:
            status === "released" ? "Escrow released after completion review." : undefined,
        }),
      });
      const payload = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update escrow status.");
      }

      await loadOverview();
      setMessage(`Booking ${status} successfully.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update escrow status.",
      );
    } finally {
      setBusyKey("");
    }
  }

  async function resolveCase(caseId: number) {
    setBusyKey(`case-${caseId}`);
    setMessage("");
    setError("");

    try {
      const response = await authedFetch(`${apiUrl}/operations/cases/${caseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "resolved",
          resolutionNotes: "Resolved from the platform operations dashboard.",
        }),
      });
      const payload = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to resolve admin case.");
      }

      await loadOverview();
      setMessage("Admin case resolved.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to resolve admin case.",
      );
    } finally {
      setBusyKey("");
    }
  }

  async function verifyCompany(companyId: number) {
    setBusyKey(`verification-${companyId}`);
    setMessage("");
    setError("");

    try {
      const existing = overview?.verifications.find((item) => item.company_id === companyId);

      const response = await authedFetch(`${apiUrl}/operations/verification-records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          companyNumber: existing?.company_number ?? "",
          directors: [],
          companiesHouseStatus: "verified",
          hmrcStatus: "verified",
          dataResidencyRegion: existing?.data_residency_region ?? "UK",
          rightToWorkRequired: existing?.right_to_work_required ?? true,
          retentionPolicyDays: 365,
          riskNotes: existing?.risk_notes ?? "Verified from operations dashboard.",
        }),
      });
      const payload = await readJsonResponse<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to verify company.");
      }

      await loadOverview();
      setMessage("Company verification updated.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to verify company.",
      );
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="ui-fade-up space-y-8 xl:space-y-10">
      <section aria-labelledby="operations-title">
        <Card className="p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
            Admin & analytics dashboard
          </p>
          <h1
            id="operations-title"
            className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Escrow, compliance, rewards, and revenue in one control plane
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Review dispute holds, companies-house style verification state, subscription mix,
            token velocity, and payout readiness from a single recruiter/admin workspace.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex min-h-11 items-center rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white">
              Escrow control
            </span>
            <span className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
              Verification review
            </span>
            <span className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
              Revenue visibility
            </span>
          </div>
        </Card>
      </section>

      {message ? (
        <Card className="border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {message}
        </Card>
      ) : null}
      {error ? (
        <Card className="border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Escrow held", value: overview?.stats.heldEscrow ?? 0 },
          { label: "Disputes", value: overview?.stats.disputedEscrow ?? 0 },
          { label: "Completed", value: overview?.stats.completedEscrow ?? 0 },
          { label: "Points issued", value: overview?.stats.totalPoints ?? 0 },
          { label: "Redemptions", value: overview?.stats.pendingRedemptions ?? 0 },
          { label: "Reviews due", value: overview?.stats.verificationReviews ?? 0 },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-slate-950">{stat.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-slate-950">Escrow queue</h2>
            <Badge tone="amber">Stripe Connect ready architecture</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {(overview?.bookings ?? []).map((booking) => (
              <div key={booking.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{booking.title}</h3>
                      <Badge tone={booking.status === "disputed" ? "amber" : "indigo"}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.worker_name} · {booking.company_name ?? "Direct booking"} · {booking.location}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {booking.milestone_note || "Milestone-based release flow active."}
                    </p>
                    {booking.dispute_reason ? (
                      <p className="mt-2 text-sm font-semibold text-amber-700">
                        Dispute: {booking.dispute_reason}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-700">
                    <p>Total: £{(booking.amount_minor / 100).toFixed(2)}</p>
                    <p>Worker: £{(booking.worker_amount_minor / 100).toFixed(2)}</p>
                    <p>Platform: £{(booking.platform_fee_minor / 100).toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={busyKey === `booking-${booking.id}-released`}
                    onClick={() => void updateBookingStatus(booking.id, "released")}
                  >
                    Release
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyKey === `booking-${booking.id}-completed`}
                    onClick={() => void updateBookingStatus(booking.id, "completed")}
                  >
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyKey === `booking-${booking.id}-disputed`}
                    onClick={() => void updateBookingStatus(booking.id, "disputed")}
                  >
                    Flag dispute
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-slate-950">Subscription mix</h2>
          <div className="mt-4 space-y-3">
            {(overview?.subscriptionMix ?? []).map((item) => (
              <div key={item.plan} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                <span className="text-sm font-semibold capitalize text-slate-700">{item.plan}</span>
                <Badge tone="indigo">{item.total}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-slate-950">Dispute mediation portal</h2>
            <Badge tone="amber">Internal review</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {(overview?.cases ?? []).map((item) => (
              <div key={item.id} className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">
                    {item.booking_title ?? "Escrow case"} · {item.company_name ?? "Direct"}
                  </h3>
                  <Badge tone={item.status === "resolved" ? "emerald" : "amber"}>
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {item.resolution_notes || "Awaiting admin action."}
                </p>
                <div className="mt-4">
                  <Button
                    size="sm"
                    disabled={busyKey === `case-${item.id}` || item.status === "resolved"}
                    onClick={() => void resolveCase(item.id)}
                  >
                    Resolve case
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-slate-950">Compliance & trust automation</h2>
            <Badge tone="indigo">UK-only routing</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {(overview?.verifications ?? []).map((item) => (
              <div key={item.company_id} className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">{item.name}</h3>
                  <Badge tone={item.companies_house_status === "verified" ? "emerald" : "amber"}>
                    {item.companies_house_status ?? "pending"}
                  </Badge>
                  <Badge tone={item.hmrc_status === "verified" ? "emerald" : "amber"}>
                    HMRC {item.hmrc_status ?? "pending"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Company no: {item.company_number || "Awaiting"} · Residency:{" "}
                  {item.data_residency_region ?? "UK"} · Right to work:{" "}
                  {item.right_to_work_required ? "Required" : "Optional"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.risk_notes || "No additional risk notes."}
                </p>
                <div className="mt-4">
                  <Button
                    size="sm"
                    disabled={busyKey === `verification-${item.company_id}`}
                    onClick={() => void verifyCompany(item.company_id)}
                  >
                    Mark verified
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
