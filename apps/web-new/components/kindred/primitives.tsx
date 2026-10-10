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
        "rounded-[1.75rem] border border-[#342715]/90 bg-[#0f0b07]/95 shadow-[0_18px_45px_rgba(0,0,0,0.26)] transition-[transform,box-shadow,border-color] duration-200",
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
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-[background-color,color,border-color,transform,box-shadow] duration-200 hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080604] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";
  const sizes = {
    sm: "min-h-11 px-3.5",
    md: "min-h-12 px-5",
  };
  const variants = {
    primary: "bg-brand-500 text-[#140f08] shadow-[0_14px_35px_rgba(196,150,28,0.24)] hover:bg-brand-400",
    outline: "border border-[#4d3a1d] bg-[#14100c] text-[#f7ebcb] hover:bg-[#1a140e]",
    ghost: "text-brand-100 hover:bg-[#18130d]",
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
        "grid h-11 w-11 place-items-center rounded-xl text-[#d7c28b] transition-colors hover:bg-[#18130d] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080604]",
        "grid h-11 w-11 place-items-center rounded-full text-[#d7c28b] transition-colors hover:bg-[#18130d] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080604]",
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
        "shrink-0 rounded-full bg-[#18130d] object-cover",
        ring && "ring-2 ring-brand-300",
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
    slate: "bg-[#1a140d] text-[#d7c28b]",
    indigo: "bg-brand-50/15 text-brand-200",
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
  const tone = score >= 90 ? "#d6a92f" : score >= 80 ? "#c4961c" : "#b45309";

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
          stroke="#2b2012"
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
        <span className="text-sm font-bold leading-none text-[#f7ebcb]">
          {score}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wide text-[#b89d5c]">
          match
        </span>
      </div>
    </div>
  );
}
