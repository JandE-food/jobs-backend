"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white transition-[transform,box-shadow,border-color] duration-200",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md";
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";
  const sizes = {
    sm: "min-h-11 px-3.5",
    md: "min-h-12 px-5",
  };
  const variants = {
    primary: "bg-indigo-700 text-white hover:bg-indigo-800",
    outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
  };

  return (
    <button
      type={type}
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export function IconButton({
  label,
  className,
  children,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Avatar({
  src,
  alt,
  size = 40,
  ring,
}: {
  src: string;
  alt: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: size, height: size }}
      className={cn(
        "shrink-0 rounded-full bg-slate-100 object-cover",
        ring && "ring-2 ring-white",
      )}
    />
  );
}

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: "slate" | "indigo" | "emerald" | "amber";
  className?: string;
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    indigo: "bg-indigo-50 text-indigo-800",
    emerald: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function MatchRing({
  score,
  size = 52,
}: {
  score: number;
  size?: number;
}) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const tone = score >= 90 ? "#047857" : score >= 80 ? "#4338ca" : "#b45309";

  return (
    <div
      role="img"
      aria-label={`${score}% match`}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e7ecf3"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tone}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (score / 100) * circumference}
        />
      </svg>
      <div
        aria-hidden="true"
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <span className="text-sm font-bold leading-none text-slate-900">
          {score}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
          match
        </span>
      </div>
    </div>
  );
}
