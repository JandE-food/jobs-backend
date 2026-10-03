import Link from "next/link";

const planLabels: Record<string, string> = {
  user_basic: "Users",
  company_basic: "Companies",
  user_premium: "Premium Users",
  company_premium: "Premium Companies",
};

const planEntitlements: Record<string, string> = {
  user_basic: "10 endorsements per month",
  company_basic: "10 endorsements per month",
  user_premium: "200 endorsements per month",
  company_premium: "200 endorsements per month",
};

export default async function BillingActivePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const plan = resolvedSearchParams.plan ?? "";
  const planLabel = planLabels[plan] ?? "Subscription";
  const planAllowance = planEntitlements[plan] ?? "monthly endorsements activated";

  return (
    <main className="page-shell">
      <section className="content-card">
        <span className="hero-kicker">Subscription active</span>
        <h1>Subscription active</h1>
        <p className="muted-copy">
          {planLabel} is now active. This subscription includes{" "}
          <strong>{planAllowance}</strong> for the current billing cycle.
        </p>
        <div className="button-row">
          <Link className="primary-button" href="/pricing">
            Back to pricing
          </Link>
          <Link className="secondary-button" href="/settings/privacy">
            Open privacy settings
          </Link>
        </div>
      </section>
    </main>
  );
}
