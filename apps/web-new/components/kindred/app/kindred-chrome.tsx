"use client";

import { useEffect, useState, type ReactNode } from "react";

import { usePathname, useRouter } from "next/navigation";

import { BottomNav } from "../BottomNav";
import { SideNav } from "../SideNav";
import { TopBar } from "../TopBar";
import { TransitionLink } from "../TransitionLink";
import { useKindredAuth } from "./kindred-provider";

const APP_ROUTES = new Set([
  "/",
  "/jobs",
  "/notifications",
  "/resume",
  "/network",
  "/profile",
  "/companies",
  "/recruiter",
  "/recruiter/home",
  "/recruiter/candidates",
  "/recruiter/post",
  "/recruiter/shortlists",
  "/recruiter/companies",
  "/recruiter/operations",
  "/settings/privacy",
]);

const AUTH_ROUTES = new Set(["/login", "/signup"]);
const GUEST_ALLOWED_ROUTES = new Set([
  "/",
  "/jobs",
  "/notifications",
  "/network",
  "/profile",
  "/resume",
  "/settings/privacy",
]);

function isRecruiterRoute(pathname: string) {
  return pathname.startsWith("/recruiter");
}

function isAppRoute(pathname: string) {
  return (
    APP_ROUTES.has(pathname) ||
    pathname.startsWith("/companies/") ||
    pathname.startsWith("/recruiter/shortlists/") ||
    pathname.startsWith("/recruiter/candidates/")
  );
}

function isGuestAllowedRoute(pathname: string) {
  return GUEST_ALLOWED_ROUTES.has(pathname);
}

export function KindredChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, user } = useKindredAuth();
  const immersiveFeedRoute = pathname === "/";
  const [guestPromptDismissed, setGuestPromptDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return window.sessionStorage.getItem("bejeli-guest-prompt-dismissed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!user && isAppRoute(pathname)) {
      if (!isGuestAllowedRoute(pathname)) {
        router.replace("/");
      }
      return;
    }

    if (
      user &&
      isRecruiterRoute(pathname) &&
      user.role === "professional"
    ) {
      router.replace("/");
      return;
    }

    if (user && user.role === "recruiter" && pathname === "/jobs") {
      router.replace("/recruiter");
      return;
    }

    if (user && AUTH_ROUTES.has(pathname)) {
      const homePath = user.role === "recruiter" || user.role === "admin" ? "/recruiter" : "/";
      router.replace(homePath);
    }
  }, [hydrated, pathname, router, user]);

  const guestPromptOpen = hydrated && !user && pathname === "/" && !guestPromptDismissed;

  function dismissGuestPrompt() {
    setGuestPromptDismissed(true);

    try {
      window.sessionStorage.setItem("bejeli-guest-prompt-dismissed", "true");
    } catch {
      // Ignore storage limitations and just close the prompt in memory.
    }
  }

  if (!hydrated && (APP_ROUTES.has(pathname) || AUTH_ROUTES.has(pathname))) {
    return <div className="min-h-screen bg-canvas" />;
  }

  if (isAppRoute(pathname)) {
    return (
      <div className="min-h-full w-full bg-canvas">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        <div className={immersiveFeedRoute ? "hidden sm:block" : ""}>
          <TopBar />
        </div>
        <div
          className={`mx-auto flex w-full max-w-[1440px] gap-8 ${
            immersiveFeedRoute ? "px-0 sm:px-4" : "px-4"
          }`}
        >
          <aside className="hidden w-[260px] shrink-0 lg:block">
            <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-5 no-scrollbar">
              <SideNav />
            </div>
          </aside>
          <main
            id="main-content"
            aria-label={isRecruiterRoute(pathname) ? "BEJELI recruiter workspace" : "BEJELI talent workspace"}
            className={
              pathname === "/" || pathname === "/recruiter"
                ? "min-w-0 flex-1 pt-0 sm:pt-3"
                : "min-w-0 flex-1 pb-24 pt-5 lg:pb-12"
            }
          >
            {children}
          </main>
        </div>
        <BottomNav />
        {guestPromptOpen ? (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
            onClick={dismissGuestPrompt}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Login prompt"
              className="w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
                Welcome to BEJELI
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Do you want to log in?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Start on the feed, then choose whether you want to log in or stay signed out
                for now.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <TransitionLink
                  href="/login"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-bold text-white"
                >
                  Log in
                </TransitionLink>
                <button
                  type="button"
                  onClick={dismissGuestPrompt}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-sm font-bold text-slate-700"
                >
                  Stay signed out
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}
