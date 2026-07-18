import Link from "next/link";

import { CookieBanner } from "../components/cookie-banner";

export default function Home() {
  return (
    <>
      <main className="hero-shell">
        <section className="hero-card" aria-labelledby="home-title">
          <span className="hero-kicker">Recruitment Platform</span>
          <h1 id="home-title">Recruitment App – UK Cloud</h1>
          <p className="hero-copy">
            A clean starter stack with Next.js, Fastify, PostgreSQL, Redis, and
            Docker so the recruitment platform can grow feature by feature.
          </p>
          <div className="hero-status" role="status" aria-live="polite">
            <span className="status-dot" />
            Base environment ready for frontend, API, and infrastructure work
          </div>
          <div className="button-row">
            <Link className="primary-button" href="/pricing">
              View pricing
            </Link>
            <Link className="secondary-button" href="/settings/privacy">
              Privacy settings
            </Link>
          </div>
        </section>
      </main>
      <CookieBanner />
    </>
  );
}
