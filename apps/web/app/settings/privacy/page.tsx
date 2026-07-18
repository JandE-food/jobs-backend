import Link from "next/link";

import { PrivacyActions } from "../../../components/privacy-actions";

export default function PrivacyPage() {
  return (
    <main className="page-shell">
      <section className="page-header">
        <span className="hero-kicker">Day 8</span>
        <h1>Privacy controls</h1>
        <p className="muted-copy">
          Request deletion, export the current user data, and test the admin
          deletion endpoint for the seeded demo user.
        </p>
        <Link className="secondary-button" href="/">
          Back home
        </Link>
      </section>
      <PrivacyActions />
    </main>
  );
}
