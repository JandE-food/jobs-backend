"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { apiUrl, readJsonResponse } from "../api";
import { jobs, me, notifications, people, skillSuggestions } from "./mock";
import {
  BellIcon,
  BriefcaseBusinessIcon,
  ChevronDownIcon,
  FileTextIcon,
  HomeIcon,
  SearchIcon,
  SparklesIcon,
  UsersIcon,
} from "./icons";
import { cn, IconButton } from "./primitives";
import { useKindredAuth } from "./app/kindred-provider";

type OpenMenu = "search" | "platform" | "explore" | "recruiters" | "account" | null;

type CompanySearchItem = {
  id: number;
  name: string;
  slug: string;
  location: string;
  industry: string;
};

const recentSearchesStorageKey = "kindred-recent-searches";

type SearchResult = {
  id: string;
  href: string;
  title: string;
  description: string;
  category: "Jobs" | "People" | "Companies" | "Pages" | "Skills";
};

function TopbarDropdown({
  label,
  icon,
  open,
  onToggle,
  align = "left",
  children,
}: {
  label: ReactNode;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  align?: "left" | "right";
  children: ReactNode;
}) {
  return (
    <div className="nav-dropdown">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="nav-pill focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
      >
        {icon}
        <span className={cn("truncate", align === "right" && "max-w-[8rem]")}>{label}</span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open ? <div className={`nav-dropdown-panel ${align === "right" ? "right" : ""}`}>{children}</div> : null}
    </div>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const { user } = useKindredAuth();
  const canUseRecruiterShell =
    user?.role === "recruiter" || user?.role === "admin";
  const userInitial = (user?.fullName ?? "B").trim().charAt(0).toUpperCase();
  const unreadNotifications = notifications.filter((item) => item.unread).length;
  const topbarRef = useRef<HTMLElement | null>(null);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<CompanySearchItem[]>([]);
  const [searchError, setSearchError] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!topbarRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(recentSearchesStorageKey);
      setRecentSearches(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetch(`${apiUrl}/companies`)
      .then(async (response) => {
        const payload = await readJsonResponse<{ companies?: CompanySearchItem[] }>(response);

        if (!response.ok) {
          throw new Error("Unable to load company search results.");
        }

        if (active) {
          setCompanies(payload.companies ?? []);
          setSearchError("");
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setSearchError(error instanceof Error ? error.message : "Unable to load company search results.");
      });

    return () => {
      active = false;
    };
  }, []);

  function toggleMenu(menu: OpenMenu) {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  function persistRecentSearches(nextSearches: string[]) {
    setRecentSearches(nextSearches);

    try {
      window.localStorage.setItem(
        recentSearchesStorageKey,
        JSON.stringify(nextSearches),
      );
    } catch {
      // Ignore storage errors and keep search usable.
    }
  }

  function rememberSearch(value: string) {
    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    const nextSearches = [
      normalized,
      ...recentSearches.filter(
        (item) => item.toLowerCase() !== normalized.toLowerCase(),
      ),
    ].slice(0, 6);

    persistRecentSearches(nextSearches);
  }

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const pageResults: SearchResult[] = [
      {
        id: "page-home",
        href: "/",
        title: "Home feed",
        description: "Your main professional dashboard and activity stream.",
        category: "Pages",
      },
      {
        id: "page-jobs",
        href: "/jobs",
        title: "Jobs workspace",
        description: "Review AI-ranked opportunities and saved roles.",
        category: "Pages",
      },
      {
        id: "page-network",
        href: "/network",
        title: "Network graph",
        description: "Discover people, mutuals, and warm introductions.",
        category: "Pages",
      },
      {
        id: "page-notifications",
        href: "/notifications",
        title: "Notifications",
        description: "Track recruiter activity, match updates, and profile events.",
        category: "Pages",
      },
      {
        id: "page-resume",
        href: "/resume",
        title: "Resume Studio",
        description: "Upload your CV and review structured parsing output.",
        category: "Pages",
      },
      {
        id: "page-companies",
        href: "/companies",
        title: "Company directory",
        description: "Browse verified employer pages and hiring queues.",
        category: "Pages",
      },
    ];

    const jobResults: SearchResult[] = jobs.map((job) => ({
      id: `job-${job.id}`,
      href: "/jobs",
      title: job.role,
      description: `${job.company} · ${job.location} · ${job.salary}`,
      category: "Jobs",
    }));

    const peopleResults: SearchResult[] = [me, ...people].map((person) => ({
      id: `person-${person.id}`,
      href: person.id === "me" ? "/profile" : "/network",
      title: person.name,
      description: `${person.title} · ${person.company} · ${person.location}`,
      category: "People",
    }));

    const companyResults: SearchResult[] = companies.map((company) => ({
      id: `company-${company.id}`,
      href: `/companies/${company.slug}`,
      title: company.name,
      description: `${company.industry} · ${company.location}`,
      category: "Companies",
    }));

    const skillResults: SearchResult[] = skillSuggestions.map((skill) => ({
      id: `skill-${skill.toLowerCase().replace(/\s+/g, "-")}`,
      href: "/jobs",
      title: skill,
      description: "Skill signal used for jobs, search relevance, and profile matching.",
      category: "Skills",
    }));

    const allResults = [
      ...pageResults,
      ...jobResults,
      ...peopleResults,
      ...companyResults,
      ...skillResults,
    ];

    if (!query) {
      return [];
    }

    return allResults
      .filter((item) =>
        `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(query),
      )
      .slice(0, 10);
  }, [companies, searchQuery]);

  return (
    <header ref={topbarRef} className="topbar-shell ui-fade-up">
      <div className="topbar-inner">
        <Link
          href="/"
          aria-label="BEJELI home"
          className="flex min-h-11 items-center gap-2 rounded-xl px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-700 text-white">
            <BriefcaseBusinessIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            BEJELI
          </span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          <Link href="/" className="nav-pill focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            Home
          </Link>
          <TopbarDropdown
            label="Platform"
            icon={<SparklesIcon className="h-4 w-4" aria-hidden="true" />}
            open={openMenu === "platform"}
            onToggle={() => toggleMenu("platform")}
          >
            <p className="nav-dropdown-label">Professional workflows</p>
            <Link href="/jobs" className="nav-dropdown-link" onClick={() => setOpenMenu(null)}>
              <strong>Job matching</strong>
              <span>Review scored roles, save opportunities, and apply from one workspace.</span>
            </Link>
            <Link href="/network" className="nav-dropdown-link" onClick={() => setOpenMenu(null)}>
              <strong>Network graph</strong>
              <span>Find warm introductions, peers, and recruiter-side operators.</span>
            </Link>
            <Link href="/resume" className="nav-dropdown-link" onClick={() => setOpenMenu(null)}>
              <strong>Resume Studio</strong>
              <span>Upload your CV, review structured data, and refine your profile.</span>
            </Link>
          </TopbarDropdown>
          <TopbarDropdown
            label="Explore"
            icon={<BriefcaseBusinessIcon className="h-4 w-4" aria-hidden="true" />}
            open={openMenu === "explore"}
            onToggle={() => toggleMenu("explore")}
          >
            <p className="nav-dropdown-label">Hiring ecosystem</p>
            <Link href="/companies" className="nav-dropdown-link" onClick={() => setOpenMenu(null)}>
              <strong>Company directory</strong>
              <span>Browse verified employer pages, campaigns, and hiring queues.</span>
            </Link>
            <Link href="/pricing" className="nav-dropdown-link" onClick={() => setOpenMenu(null)}>
              <strong>Plans and billing</strong>
              <span>Review Free, Growth, and Scale pricing across regions.</span>
            </Link>
            <Link href="/settings/privacy" className="nav-dropdown-link" onClick={() => setOpenMenu(null)}>
              <strong>Privacy controls</strong>
              <span>Export data, manage deletion requests, and review consent tooling.</span>
            </Link>
          </TopbarDropdown>
          {canUseRecruiterShell ? (
            <TopbarDropdown
              label="Recruiters"
              icon={<UsersIcon className="h-4 w-4" aria-hidden="true" />}
              open={openMenu === "recruiters"}
              onToggle={() => toggleMenu("recruiters")}
            >
              <p className="nav-dropdown-label">Enterprise tools</p>
              <Link href="/recruiter" className="nav-dropdown-link" onClick={() => setOpenMenu(null)}>
                <strong>Dashboard</strong>
                <span>Review company momentum, shortlists, and posting queues.</span>
              </Link>
              <Link
                href="/recruiter/candidates"
                className="nav-dropdown-link"
                onClick={() => setOpenMenu(null)}
              >
                <strong>Candidate search</strong>
                <span>Filter talent and add profiles directly into shortlist pipelines.</span>
              </Link>
              <Link
                href="/recruiter/companies"
                className="nav-dropdown-link"
                onClick={() => setOpenMenu(null)}
              >
                <strong>Company operations</strong>
                <span>Create company pages, job queues, and ad inventory placements.</span>
              </Link>
              <Link
                href="/recruiter/operations"
                className="nav-dropdown-link"
                onClick={() => setOpenMenu(null)}
              >
                <strong>Platform operations</strong>
                <span>Review escrow holds, compliance checks, rewards, and dispute cases.</span>
              </Link>
            </TopbarDropdown>
          ) : null}
        </nav>
        <div className="relative hidden min-w-0 flex-1 xl:block">
          <div className="flex h-12 w-full max-w-lg items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-500 transition-[background-color,border-color,box-shadow] duration-200 hover:border-slate-300 hover:bg-white focus-within:border-slate-300 focus-within:bg-white">
            <SearchIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setOpenMenu("search");
              }}
              onFocus={() => setOpenMenu("search")}
              placeholder="Search people, roles, and companies"
              aria-label="Search people, roles and companies"
              className="h-full w-full bg-transparent text-sm text-slate-700 caret-slate-900 outline-none placeholder:text-slate-500 focus-visible:outline-none"
            />
          </div>
          {openMenu === "search" && (searchQuery.trim() || recentSearches.length || searchError) ? (
            <div className="nav-dropdown-panel mt-2 w-full max-w-2xl">
              {searchQuery.trim() ? <p className="nav-dropdown-label">Search results</p> : null}
              {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  <div className="grid gap-1">
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={result.href}
                        onClick={() => {
                          rememberSearch(searchQuery);
                          setOpenMenu(null);
                        }}
                        className="nav-dropdown-link"
                      >
                        <strong>
                          {result.title}
                          <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                            {result.category}
                          </span>
                        </strong>
                        <span>{result.description}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    No results found for `{searchQuery.trim()}`.
                  </div>
                )
              ) : recentSearches.length ? (
                <>
                  <p className="nav-dropdown-label">Recent searches</p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSearchQuery(item)}
                        className="inline-flex min-h-10 items-center rounded-full bg-slate-100 px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
              {searchError ? (
                <p className="mt-3 text-xs text-rose-700">{searchError}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/resume"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            aria-label="Open Resume Studio"
          >
            <FileTextIcon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden min-[380px]:inline">Resume Studio</span>
          </Link>
          <IconButton
            label="Search people, roles and companies"
            className="xl:hidden"
            onClick={() => toggleMenu("search")}
          >
            <SearchIcon className="h-5 w-5" aria-hidden="true" />
          </IconButton>
          <Link
            href="/notifications"
            aria-label={`Notifications, ${unreadNotifications} unread`}
            className={cn(
              "relative grid h-11 w-11 place-items-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
              pathname === "/notifications" && "bg-slate-100 text-slate-900",
            )}
          >
            <BellIcon className="h-5 w-5" aria-hidden="true" />
            {unreadNotifications > 0 ? (
              <span
                aria-hidden="true"
                className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-600 ring-2 ring-white"
              />
            ) : null}
          </Link>
          <TopbarDropdown
            label={<span className="hidden lg:block">{user?.fullName ?? "Guest user"}</span>}
            icon={
              <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-700 text-xs font-bold text-white">
                {userInitial}
              </span>
            }
            open={openMenu === "account"}
            onToggle={() => toggleMenu("account")}
            align="right"
          >
            <p className="nav-dropdown-label">Account</p>
            <Link href="/profile" className="nav-dropdown-link" onClick={() => setOpenMenu(null)}>
              <strong>Profile hub</strong>
              <span>Review your profile, highlights, and open-to-work positioning.</span>
            </Link>
            <Link href="/resume" className="nav-dropdown-link" onClick={() => setOpenMenu(null)}>
              <strong>Resume Studio</strong>
              <span>Refresh skills, experience, and structured CV metadata.</span>
            </Link>
            <Link href="/settings/privacy" className="nav-dropdown-link" onClick={() => setOpenMenu(null)}>
              <strong>Privacy settings</strong>
              <span>Manage GDPR export, deletion, and session-linked data controls.</span>
            </Link>
          </TopbarDropdown>
        </div>
      </div>
      {openMenu === "search" ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 xl:hidden">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3">
              <SearchIcon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoFocus
                placeholder="Search people, roles, companies, and pages"
                aria-label="Search people, roles and companies"
                className="w-full bg-transparent text-sm text-slate-700 caret-slate-900 outline-none placeholder:text-slate-500 focus-visible:outline-none"
              />
            </div>
            {searchQuery.trim() ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                {searchResults.length > 0 ? (
                  <div className="grid gap-1">
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={result.href}
                        onClick={() => {
                          rememberSearch(searchQuery);
                          setOpenMenu(null);
                        }}
                        className="nav-dropdown-link"
                      >
                        <strong>{result.title}</strong>
                        <span>{result.description}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    No results found for `{searchQuery.trim()}`.
                  </div>
                )}
              </div>
            ) : recentSearches.length ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <p className="nav-dropdown-label px-0">Recent searches</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSearchQuery(item)}
                      className="inline-flex min-h-10 items-center rounded-full bg-slate-100 px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
