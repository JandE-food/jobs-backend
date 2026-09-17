"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

type RouterLike = {
  push: (href: string, options?: { scroll?: boolean }) => void;
  replace: (href: string, options?: { scroll?: boolean }) => void;
};

type TransitionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean | null;
};

type NavigationOptions = {
  replace?: boolean;
  scroll?: boolean;
};

type TransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    finished?: Promise<unknown>;
  };
};

let routeTransitionCleanupId: number | null = null;

function clearRouteTransitionState() {
  document.documentElement.classList.remove("route-transitioning");
  if (routeTransitionCleanupId !== null) {
    window.clearTimeout(routeTransitionCleanupId);
    routeTransitionCleanupId = null;
  }
}

function markRouteTransitioning() {
  document.documentElement.classList.add("route-transitioning");
  if (routeTransitionCleanupId !== null) {
    window.clearTimeout(routeTransitionCleanupId);
  }

  routeTransitionCleanupId = window.setTimeout(() => {
    clearRouteTransitionState();
  }, 420);
}

export function navigateWithTransition(
  router: RouterLike,
  href: string,
  options: NavigationOptions = {},
) {
  const navigate = () => {
    if (options.replace) {
      router.replace(href, { scroll: options.scroll });
      return;
    }

    router.push(href, { scroll: options.scroll });
  };

  if (typeof window === "undefined" || typeof document === "undefined") {
    navigate();
    return;
  }

  markRouteTransitioning();

  const transitionDocument = document as TransitionDocument;
  if (typeof transitionDocument.startViewTransition === "function") {
    const transition = transitionDocument.startViewTransition(() => {
      navigate();
    });

    transition.finished?.finally(() => {
      clearRouteTransitionState();
    });
    return;
  }

  window.requestAnimationFrame(() => {
    navigate();
  });
}

export function TransitionLink({
  href,
  replace,
  scroll,
  prefetch,
  onClick,
  target,
  children,
  ...props
}: TransitionLinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      target === "_blank" ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigateWithTransition(router, href, { replace, scroll });
  }

  return (
    <Link
      href={href}
      replace={replace}
      scroll={scroll}
      prefetch={prefetch ?? undefined}
      target={target}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
