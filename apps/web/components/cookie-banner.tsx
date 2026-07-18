"use client";

import { useEffect, useState } from "react";

const storageKey = "uk-cloud-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = window.localStorage.getItem(storageKey);
    setVisible(consent !== "accepted");
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <aside className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div>
        <p className="cookie-title">Cookies for core platform flows</p>
        <p className="cookie-copy">
          We use a small cookie banner now so billing and privacy flows can grow
          into GDPR-ready consent management later.
        </p>
      </div>
      <button
        className="primary-button"
        type="button"
        onClick={() => {
          window.localStorage.setItem(storageKey, "accepted");
          setVisible(false);
        }}
      >
        Accept cookies
      </button>
    </aside>
  );
}
