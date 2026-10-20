"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";

const storageKey = "uk-cloud-cookie-consent";

function getInitialVisibility() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(storageKey) !== "accepted";
}

export function CookieBanner() {
  const [visible, setVisible] = useState(getInitialVisibility);

  if (!visible) {
    return null;
  }

  return (
    <aside
      className="fixed bottom-20 right-4 z-40 w-[320px] rounded-2xl border border-line bg-white p-4 shadow-pop lg:bottom-4"
      role="dialog"
      aria-label="Cookie notice"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-extrabold text-ink">Cookies for core platform flows</h2>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss cookie notice"
          className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-mute transition-colors duration-150 hover:bg-canvas"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">
        We use a small cookie banner now so billing and privacy flows can grow into GDPR-ready consent management later.
      </p>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(storageKey, "accepted");
          setVisible(false);
        }}
        className="mt-3 h-9 w-full rounded-full bg-brand-600 text-sm font-bold text-white transition-colors duration-150 hover:bg-brand-700"
      >
        Accept cookies
      </button>
    </aside>
  );
}
