import Link from "next/link";

import { PricingClient } from "../../components/pricing-client";

export default function PricingPage() {
  return (
    <main className="page-shell">
      <section className="page-header">
        <span className="hero-kicker">Day 7</span>
        <h1>Plans and subscription checkout</h1>
        <p className="muted-copy">
          Choose Free, Growth, or Scale. Stripe handles UK and EU checkout.
          Paystack handles African checkout.
        </p>
        <Link className="secondary-button" href="/">
          Back home
        </Link>
      </section>
      <PricingClient />
    </main>
  );
}
