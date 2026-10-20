"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BellIcon,
  BookmarkIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";

import { apiUrl, authedFetch, readJsonResponse } from "../api";
import { useKindredAuth } from "./app/kindred-provider";
import { jobs } from "./mock";
import { me } from "./mock";
import { Avatar } from "./primitives";
import { TransitionLink } from "./TransitionLink";

type SearchSuggestion = {
  key: string;
  label: string;
  meta: string;
  href: string;
};

type CompanySuggestion = {
  id: number;
  name: string;
  slug: string;
  industry: string;
  location: string;
};

type CandidateSuggestion = {
  id: number | string;
  full_name: string;
  headline: string;
  location: string;
};

export function TopBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<CompanySuggestion[]>([]);
  const [candidates, setCandidates] = useState<CandidateSuggestion[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const router = useRouter();
  const { user } = useKindredAuth();
  const recruiterMode = user?.role === "recruiter" || user?.role === "admin";
  const homeHref = recruiterMode ? "/recruiter" : "/";
  const postHref = !user ? "/login" : recruiterMode ? "/recruiter/post" : "/post";
  const profileHref = user ? "/profile" : "/profile";
  const searchShellRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const shouldFocusSearch =
    searchParams.get("focus") === "search" &&
    (pathname === "/jobs" || pathname === "/recruiter/candidates");
  const searchQueryParam = searchParams.get("query") ?? "";

  function buildSearchHref(value: string) {
    const searchValue = value.trim();
    if (!searchValue) {
      return recruiterMode ? "/recruiter/candidates" : "/jobs";
    }

    const params = new URLSearchParams({
      query: searchValue,
    });
    return recruiterMode
      ? `/recruiter/candidates?${params.toString()}`
      : `/jobs?${params.toString()}`;
  }

  useEffect(() => {
    let active = true;

    fetch(`${apiUrl}/companies`)
      .then(async (response) => {
        const payload = await readJsonResponse<{ companies?: CompanySuggestion[] }>(response);

        if (!response.ok || !active) {
          return;
        }

        setCompanies(payload.companies ?? []);
      })
      .catch(() => undefined);

    if (!recruiterMode) {
      return () => {
        active = false;
      };
    }

    authedFetch(`${apiUrl}/recruiter/candidates`)
      .then(async (response) => {
        const payload = await readJsonResponse<{ candidates?: CandidateSuggestion[] }>(response);

        if (!response.ok || !active) {
          return;
        }

        setCandidates(payload.candidates ?? []);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [recruiterMode]);

  useEffect(() => {
    setQuery(searchQueryParam);
  }, [searchQueryParam]);

  useEffect(() => {
    if (!shouldFocusSearch) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
      setSearchOpen(true);
    }, 120);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [shouldFocusSearch]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchShellRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return [] as SearchSuggestion[];
    }

    const companyMatches = companies
      .filter((company) =>
        [company.name, company.industry, company.location]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalized)),
      )
      .slice(0, 3)
      .map((company) => ({
        key: `company-${company.id}`,
        label: company.name,
        meta: `${company.industry || "Company"} · ${company.location || "Global"} · Company`,
        href: `/companies/${company.slug}`,
      }));

    if (recruiterMode) {
      const candidateMatches = candidates
        .filter((candidate) =>
          [candidate.full_name, candidate.headline, candidate.location]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalized)),
        )
        .slice(0, 4)
        .map((candidate) => ({
          key: `candidate-${candidate.id}`,
          label: candidate.full_name,
          meta: `${candidate.headline || "Candidate"} · ${candidate.location || "Anywhere"} · Candidate`,
      href: `/recruiter/candidates?query=${encodeURIComponent(candidate.full_name)}`,
        }));

      return [...candidateMatches, ...companyMatches].slice(0, 6);
    }

    const jobMatches = jobs
      .filter((job) =>
        [job.role, job.company, job.location, ...job.reasons]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalized)),
      )
      .slice(0, 4)
      .map((job) => ({
        key: `job-${job.id}`,
        label: job.role,
        meta: `${job.company} · ${job.location} · Job`,
        href: `/jobs?query=${encodeURIComponent(job.role)}`,
      }));

    return [...jobMatches, ...companyMatches].slice(0, 6);
  }, [candidates, companies, query, recruiterMode]);

  const activeSuggestionIndex =
    searchOpen && query.trim() && suggestions.length
      ? highlightedIndex >= 0 && highlightedIndex < suggestions.length
        ? highlightedIndex
        : 0
      : -1;

  function commitSearch(value: string, href?: string) {
    const trimmed = value.trim();

    if (!trimmed) {
      setSearchOpen(false);
      setHighlightedIndex(-1);
      router.push(buildSearchHref(value));
      return;
    }

    setQuery(trimmed);
    setSearchOpen(false);
    setHighlightedIndex(-1);
    router.push(href ?? buildSearchHref(trimmed));
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!query.trim()) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchOpen(true);
      setHighlightedIndex((current) =>
        suggestions.length ? (current + 1 + suggestions.length) % suggestions.length : -1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSearchOpen(true);
      setHighlightedIndex((current) => {
        if (!suggestions.length) {
          return -1;
        }

        if (current <= 0) {
          return suggestions.length - 1;
        }

        return current - 1;
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (searchOpen && activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
        const suggestion = suggestions[activeSuggestionIndex];
        commitSearch(suggestion.label, suggestion.href);
        return;
      }

      commitSearch(query);
      return;
    }

    if (event.key === "Escape") {
      setSearchOpen(false);
      setHighlightedIndex(-1);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4">
        <Link href={homeHref} className="flex items-center gap-2" aria-label="BEJELI home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <BriefcaseBusinessIcon className="h-4 w-4 text-white" strokeWidth={2.4} />
          </span>
          <span className="hidden text-lg font-extrabold tracking-tight text-ink sm:inline">BEJELI</span>
        </Link>

        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            if (searchOpen && activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
              const suggestion = suggestions[activeSuggestionIndex];
              commitSearch(suggestion.label, suggestion.href);
              return;
            }

            commitSearch(query);
          }}
          className="ml-2 flex-1 md:mx-auto md:max-w-md"
        >
          <label htmlFor="global-search" className="sr-only">
            Search people, roles and companies
          </label>
          <div ref={searchShellRef} className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              ref={searchInputRef}
              id="global-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => {
                if (query.trim()) {
                  setSearchOpen(true);
                }
              }}
              placeholder="Search people, roles, companies"
              className="h-9 w-full rounded-full border border-line bg-canvas pl-9 pr-3 text-base text-ink placeholder:text-ink-faint focus:border-brand-300 focus:bg-white focus:outline-none sm:text-sm"
              autoComplete="off"
              onKeyDown={handleSearchKeyDown}
              role="combobox"
              aria-expanded={searchOpen && Boolean(query.trim())}
              aria-controls="global-search-suggestions"
              aria-autocomplete="list"
              aria-activedescendant={
                activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]
                  ? `global-search-option-${suggestions[activeSuggestionIndex].key}`
                  : undefined
              }
            />
            {searchOpen && query.trim() ? (
              <div
                id="global-search-suggestions"
                role="listbox"
                className="nav-dropdown-panel right mt-1 min-w-0 w-full p-2"
              >
                <p className="nav-dropdown-label">Suggested searches</p>
                {suggestions.length ? (
                  suggestions.map((suggestion, index) => (
                    <button
                      id={`global-search-option-${suggestion.key}`}
                      key={suggestion.key}
                      type="button"
                      role="option"
                      aria-selected={activeSuggestionIndex === index}
                      onClick={() => {
                        commitSearch(suggestion.label, suggestion.href);
                      }}
                      onMouseEnter={() => {
                        setHighlightedIndex(index);
                      }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      className={`nav-dropdown-link w-full text-left ${
                        activeSuggestionIndex === index ? "bg-slate-100 text-slate-950" : ""
                      }`}
                    >
                      <strong>{suggestion.label}</strong>
                      <span>{suggestion.meta}</span>
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      commitSearch(query);
                    }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    className="nav-dropdown-link w-full text-left"
                  >
                    <strong>Search for &quot;{query.trim()}&quot;</strong>
                    <span>
                      {recruiterMode
                        ? "Search recruiter candidates and company results"
                        : "Search role matches and company results"}
                    </span>
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </form>

        <div className="flex items-center gap-1.5">
          {recruiterMode ? (
            <>
              <Link
                href="/recruiter/companies"
                className="hidden h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-bold text-ink transition-colors duration-150 hover:bg-canvas sm:inline-flex"
              >
                <Building2Icon className="h-4 w-4 text-ink-mute" />
                Companies
              </Link>
              <Link
                href="/recruiter/shortlists"
                className="hidden h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-bold text-ink transition-colors duration-150 hover:bg-canvas lg:inline-flex"
              >
                <BookmarkIcon className="h-4 w-4 text-ink-mute" />
                Shortlists
              </Link>
            </>
          ) : null}

          <span className="mr-1 hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-success lg:inline-flex">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            UK data protected
          </span>

          <TransitionLink
            href={postHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-3.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-brand-700"
          >
            <PlusIcon className="h-4 w-4" strokeWidth={2.6} />
            <span className="hidden sm:inline">Post</span>
          </TransitionLink>

          <Link
            href="/notifications"
            className="relative hidden h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-150 hover:bg-canvas sm:inline-flex"
            aria-label="Activity, 3 unread"
          >
            <BellIcon className="h-5 w-5" strokeWidth={2.2} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white" />
          </Link>

          <TransitionLink href={profileHref} aria-label="Your profile" className="ml-0.5">
            {user ? (
              <Avatar src={me.avatar} alt={user.fullName} size={36} />
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-slate-100 text-slate-500 transition-colors duration-150 hover:bg-slate-200">
                <UserRoundIcon className="h-4.5 w-4.5" strokeWidth={2.2} aria-hidden="true" />
              </span>
            )}
          </TransitionLink>
        </div>
      </div>
    </header>
  );
}
