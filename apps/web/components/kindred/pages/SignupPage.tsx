"use client";

import { useState, type FormEvent } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiUrl, readJsonResponse } from "../../api";
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  LockKeyholeIcon,
  MailIcon,
  UserRoundIcon,
} from "../icons";

import { AuthLayout } from "../AuthLayout";
import { Button, Card, IconButton } from "../primitives";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "professional",
    agreed: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !emailPattern.test(form.email) || form.password.length < 8) {
      setError("Add your name, a valid email, and a password with at least 8 characters.");
      return;
    }

    if (!form.agreed) {
      setError("Please accept the Terms and Privacy Notice to continue.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      });
      const payload = await readJsonResponse<{
        token?: string;
        user?: {
          id: number;
          fullName: string;
          email: string;
          role: "professional" | "recruiter" | "admin";
        };
        message?: string;
      }>(response);

      if (!response.ok || !payload.token || !payload.user) {
        throw new Error(payload.message ?? "Unable to create account.");
      }

      router.push("/login");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create account.",
      );
      setBusy(false);
      return;
    }

    setBusy(false);
  }

  return (
    <AuthLayout>
      <Card className="w-full p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
          Build your professional signal
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Join a network built for meaningful connections and credible opportunities.
        </p>

        <ul className="mt-5 space-y-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <li className="flex gap-2">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            No recruiter spam
          </li>
          <li className="flex gap-2">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            AI-powered profile matching
          </li>
        </ul>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800"
            >
              {error}
            </p>
          ) : null}

          <div>
            <p className="mb-1.5 block text-sm font-bold text-slate-800">Account type</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className={`min-h-12 rounded-xl border px-4 text-left text-sm font-semibold ${
                  form.role === "professional"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
                onClick={() => setForm({ ...form, role: "professional" })}
              >
                Professional
              </button>
              <button
                type="button"
                className={`min-h-12 rounded-xl border px-4 text-left text-sm font-semibold ${
                  form.role === "recruiter"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
                onClick={() => setForm({ ...form, role: "recruiter" })}
              >
                Recruiter / Enterprise
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="signup-name" className="mb-1.5 block text-sm font-bold text-slate-800">
              Full name
            </label>
            <div className="relative">
              <UserRoundIcon
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Your name"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="mb-1.5 block text-sm font-bold text-slate-800"
            >
              Email address
            </label>
            <div className="relative">
              <MailIcon
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="mb-1.5 block text-sm font-bold text-slate-800"
            >
              Create password
            </label>
            <div className="relative">
              <LockKeyholeIcon
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                aria-describedby="password-help"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-12 text-base text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                required
              />
              <IconButton
                label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-0 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </IconButton>
            </div>
            <p id="password-help" className="mt-1.5 text-xs text-slate-600">
              At least 8 characters.
            </p>
          </div>

          <div className="flex min-h-11 items-start gap-3 rounded-xl p-1 text-sm leading-relaxed text-slate-700 focus-within:ring-2 focus-within:ring-indigo-600">
            <input
              id="signup-agreement"
              type="checkbox"
              checked={form.agreed}
              onChange={(event) => setForm({ ...form, agreed: event.target.checked })}
              className="mt-0.5 h-5 w-5 rounded border-slate-400 text-indigo-700 focus:ring-indigo-600"
            />
            <label htmlFor="signup-agreement">
              I agree to the{" "}
              <Link href="/signup" className="font-bold text-indigo-800 underline underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/signup" className="font-bold text-indigo-800 underline underline-offset-2">
                Privacy Notice
              </Link>
              .
            </label>
          </div>

          <Button type="submit" className="w-full">
            {busy ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-indigo-800 underline decoration-indigo-300 underline-offset-4 hover:text-indigo-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
