import Link from "next/link";

import { PricingClient } from "@/components/pricing-client";

export default function PricingPage() {
  return (
    <main className="page-shell">
      <section className="page-header">
        <span className="hero-kicker">Billing</span>
        <h1>Subscription plans and monthly endorsements</h1>
        <p className="muted-copy">
          Choose between the BEJELI basic and premium subscriptions for users
          and companies. Every active plan includes monthly endorsements, and
          premium expands that allowance dramatically.
        </p>
        <Link className="secondary-button" href="/">
          Back home
        </Link>
      </section>
      <PricingClient />
    </main>
  );
}
