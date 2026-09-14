"use client";

import { useState } from "react";

import { apiUrl, authedFetch, readJsonResponse } from "./api";

type PlanId = "free" | "growth" | "scale" | "enterprise";

const plans = [
  {
    id: "free" as const,
    name: "Free",
    price: "£0",
    copy: "For early testing and one active job.",
    limit: "1 active job",
  },
  {
    id: "growth" as const,
    name: "Growth",
    price: "£49",
    copy: "For growing recruiters that need more capacity.",
    limit: "10 active jobs",
  },
  {
    id: "scale" as const,
    name: "Scale",
    price: "£149",
    copy: "For higher-volume hiring with featured placement.",
    limit: "Many jobs + featured",
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    price: "£399",
    copy: "For escrow-backed hiring, compliance automation, and platform analytics.",
    limit: "Unlimited jobs + operations controls",
  },
];

export function PricingClient() {
  const [country, setCountry] = useState("UK");
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState("");

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
        {plans.map((plan) => (
          <article className="content-card" key={plan.id}>
            <span className="pill">{plan.name}</span>
            <h2>{plan.name}</h2>
            <p className="price-tag">{plan.price}/mo</p>
            <p className="muted-copy">{plan.copy}</p>
            <p className="plan-limit">{plan.limit}</p>
            <button
              className="primary-button"
              type="button"
              onClick={() => subscribe(plan.id)}
              disabled={loadingPlan === plan.id}
            >
              {loadingPlan === plan.id ? "Starting..." : "Subscribe"}
            </button>
          </article>
        ))}
      </div>

      {error ? <p className="error-copy">{error}</p> : null}
      <p className="muted-copy">
        UK and EU countries route to Stripe. African countries route to
        Flutterwave by default, with Paystack still available as a backend
        override for future regional flows. If payment keys are not configured
        yet, the API returns a mock success redirect so you can test the flow
        locally.
      </p>
    </div>
  );
}
