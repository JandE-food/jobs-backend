"use client";

import {
  createElement,
  forwardRef,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export function AnimatePresence({ children }: { children: ReactNode; mode?: string }) {
  return <>{children}</>;
}

export function useReducedMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type MotionDivProps = HTMLAttributes<HTMLDivElement> & {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
};

const MotionDiv = forwardRef<HTMLDivElement, MotionDivProps>(function MotionDiv(
  { children, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props },
  ref,
) {
  void _initial;
  void _animate;
  void _exit;
  void _transition;
  const htmlProps = props as ComponentPropsWithoutRef<"div">;
  return createElement("div", { ...htmlProps, ref }, children);
});

export const motion = {
  div: MotionDiv,
};
