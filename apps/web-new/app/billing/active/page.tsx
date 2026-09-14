import Link from "next/link";

export default function BillingActivePage() {
  return (
    <main className="page-shell">
      <section className="content-card">
        <span className="hero-kicker">Subscription active</span>
        <h1>Subscription active</h1>
        <p className="muted-copy">
          Payment completed or the local mock flow succeeded. The backend
          webhook or free-plan activation route can now mark the subscription as
          active in PostgreSQL.
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
