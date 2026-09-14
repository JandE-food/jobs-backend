import Link from "next/link";

import { PricingClient } from "@/components/pricing-client";

export default function PricingPage() {
  return (
    <main className="page-shell">
      <section className="page-header">
        <span className="hero-kicker">Billing</span>
        <h1>Plans and subscription checkout</h1>
        <p className="muted-copy">
          Choose Free, Growth, or Scale for recruiter and enterprise workflows.
          Stripe handles UK and EU checkout. Flutterwave is ready for African
          checkout routing.
        </p>
        <Link className="secondary-button" href="/">
          Back home
        </Link>
      </section>
      <PricingClient />
    </main>
  );
}
