import Link from "next/link";

import { PrivacyActions } from "@/components/privacy-actions";

export default function PrivacyPage() {
  return (
    <main className="page-shell">
      <section className="page-header">
        <span className="hero-kicker">Privacy</span>
        <h1>Privacy controls</h1>
        <p className="muted-copy">
          Request deletion, export your session-linked data, and test the admin
          deletion endpoint without leaving the website shell.
        </p>
        <Link className="secondary-button" href="/">
          Back home
        </Link>
      </section>
      <PrivacyActions />
    </main>
  );
}
