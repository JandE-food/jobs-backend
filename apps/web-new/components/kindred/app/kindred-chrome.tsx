"use client";

import { useEffect, type ReactNode } from "react";

import { usePathname, useRouter } from "next/navigation";

import { BottomNav } from "../BottomNav";
import { SideNav } from "../SideNav";
import { TopBar } from "../TopBar";
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
  "/recruiter/candidates",
  "/recruiter/post",
  "/recruiter/shortlists",
  "/recruiter/companies",
  "/recruiter/operations",
  "/settings/privacy",
]);

const AUTH_ROUTES = new Set(["/login", "/signup"]);

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

export function KindredChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, user } = useKindredAuth();
  const immersiveFeedRoute = pathname === "/";

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!user && isAppRoute(pathname)) {
      router.replace("/login");
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
      router.replace("/");
    }
  }, [hydrated, pathname, router, user]);

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
        <div className={immersiveFeedRoute ? "hidden sm:block" : ""}>
          <BottomNav />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
