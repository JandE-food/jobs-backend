"use client";

import { useEffect, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";

import { apiUrl, authedFetch, readJsonResponse } from "./api";

type PlanId = "user_basic" | "company_basic" | "user_premium" | "company_premium";

type SubscriptionResponse = {
  subscription?: {
    plan?: PlanId;
    status?: string;
    current_period_end?: string | null;
  } | null;
  entitlements?: {
    active?: boolean;
    monthlyEndorsements?: number;
    endorsementsUsedThisMonth?: number;
    remainingEndorsements?: number;
    premium?: boolean;
    audience?: "talent" | "company" | null;
    tier?: "basic" | "premium" | null;
    planName?: string | null;
  };
};

const plans = [
  {
    id: "user_basic" as const,
    name: "Users",
    price: "£3",
    audience: "Talent",
    copy: "For normal users who want full access and monthly endorsements.",
    limit: "10 endorsements / month",
    premium: false,
  },
  {
    id: "company_basic" as const,
    name: "Companies",
    price: "£3",
    audience: "Recruiter / Company",
    copy: "For companies that want full access and monthly endorsements.",
    limit: "10 endorsements / month",
    premium: false,
  },
  {
    id: "user_premium" as const,
    name: "Premium Users",
    price: "£40",
    audience: "Talent",
    copy: "For power users who need a much larger endorsement allowance every month.",
    limit: "200 endorsements / month",
    premium: true,
  },
  {
    id: "company_premium" as const,
    name: "Premium Companies",
    price: "£40",
    audience: "Recruiter / Company",
    copy: "For companies that want premium visibility plus a higher endorsement allowance.",
    limit: "200 endorsements / month",
    premium: true,
  },
];

export function PricingClient() {
  const searchParams = useSearchParams();
  const [country, setCountry] = useState("UK");
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState("");
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionResponse | null>(null);

  const highlightedPlan = searchParams.get("highlight") as PlanId | null;

  useEffect(() => {
    let active = true;

    authedFetch(`${apiUrl}/billing/subscription`)
      .then(async (response) => {
        const payload = await readJsonResponse<SubscriptionResponse & { error?: string }>(response);

        if (!response.ok || !active) {
          return;
        }

        setSubscriptionState(payload);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const currentPlan = subscriptionState?.subscription?.plan ?? null;
  const remainingEndorsements = subscriptionState?.entitlements?.remainingEndorsements ?? 0;
  const currentPlanLabel = subscriptionState?.entitlements?.planName ?? "No active plan";
  const planCards = useMemo(
    () =>
      plans.map((plan) => ({
        ...plan,
        isCurrent: currentPlan === plan.id,
        isHighlighted: highlightedPlan === plan.id,
      })),
    [currentPlan, highlightedPlan],
  );

  async function subscribe(plan: PlanId) {
    setLoadingPlan(plan);
    setError("");

    try {
      const response = await authedFetch(`${apiUrl}/billing/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          country,
        }),
      });

      const payload = await readJsonResponse<{
        checkoutUrl?: string;
        error?: string;
      }>(response);

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error ?? "Unable to create checkout.");
      }

      window.location.assign(payload.checkoutUrl);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to start checkout.",
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="stack-gap">
      <section className="content-card">
        <span className="pill">Current subscription</span>
        <h2>{currentPlanLabel}</h2>
        <p className="muted-copy">
          {subscriptionState?.entitlements?.active
            ? `You have ${remainingEndorsements} endorsements remaining in this monthly cycle.`
            : "Choose a subscription to activate monthly endorsements and unlock the platform."}
        </p>
      </section>

      <label className="field-shell" htmlFor="country">
        <span className="field-label">Choose billing country</span>
        <input
          id="country"
          className="text-input"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          placeholder="UK, Germany, Nigeria, Kenya..."
        />
      </label>

      <div className="grid-cards">
        {planCards.map((plan) => (
          <article
            className="content-card"
            key={plan.id}
            style={
              plan.isHighlighted
                ? {
                    borderColor: "rgba(79,70,229,0.45)",
                    boxShadow: "0 18px 40px rgba(79,70,229,0.18)",
                  }
                : undefined
            }
          >
            <span className="pill">{plan.name}</span>
            <p className="muted-copy" style={{ marginBottom: "0.4rem" }}>
              {plan.audience}
            </p>
            <h2>{plan.name}</h2>
            <p className="price-tag">{plan.price}/mo</p>
            <p className="muted-copy">{plan.copy}</p>
            <p className="plan-limit">{plan.limit}</p>
            {plan.premium ? (
              <p className="muted-copy">Premium tier for higher endorsement volume.</p>
            ) : (
              <p className="muted-copy">Base subscription required to participate on BEJELI.</p>
            )}
            <button
              className="primary-button"
              type="button"
              onClick={() => subscribe(plan.id)}
              disabled={loadingPlan === plan.id || plan.isCurrent}
            >
              {loadingPlan === plan.id
                ? "Starting..."
                : plan.isCurrent
                  ? "Current plan"
                  : plan.premium
                    ? "Upgrade to premium"
                    : "Subscribe"}
            </button>
          </article>
        ))}
      </div>

      {error ? <p className="error-copy">{error}</p> : null}
      <p className="muted-copy">
        Every active plan includes endorsements. Basic plans include 10
        endorsements per month, while premium plans include 200 endorsements per
        month. UK and EU countries route to Stripe. African countries route to
        Flutterwave by default, with Paystack still available as a backend
        override for future regional flows.
      </p>
    </div>
  );
}
