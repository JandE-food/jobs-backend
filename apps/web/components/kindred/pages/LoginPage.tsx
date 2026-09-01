"use client";

import { useState, type FormEvent } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiUrl, readJsonResponse } from "../../api";
import { useKindredAuth } from "../app/kindred-provider";
import { AuthLayout } from "../AuthLayout";
import { EyeIcon, EyeOffIcon, LockKeyholeIcon, MailIcon } from "../icons";
import { Button, Card, IconButton } from "../primitives";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const router = useRouter();
  const { signIn } = useKindredAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Enter both your email and password to continue.");
      return;
    }

    if (!emailPattern.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
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
        throw new Error(payload.message ?? "Unable to sign in.");
      }

      signIn({
        token: payload.token,
        user: payload.user,
      });
      router.push(
        payload.user.role === "recruiter" || payload.user.role === "admin"
          ? "/recruiter"
          : "/",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sign in.",
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
          Welcome back
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
          Sign in to BEJELI
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Pick up where you left off with your network and tailored role matches.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800"
            >
              {error}
            </p>
          ) : null}

          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-bold text-slate-800">
              Email address
            </label>
            <div className="relative">
              <MailIcon
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="login-password" className="text-sm font-bold text-slate-800">
                Password
              </label>
              <button
                type="button"
                disabled={busy}
                className="min-h-11 rounded-lg px-1 text-sm font-bold text-indigo-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                onClick={() => setError("Password reset is unavailable in this prototype.")}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <LockKeyholeIcon
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium text-slate-500">or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <Button
          variant="outline"
          className="w-full"
          disabled
        >
          Google sign-in coming soon
        </Button>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to BEJELI?{" "}
          <Link
            href="/signup"
            className="font-bold text-indigo-800 underline decoration-indigo-300 underline-offset-4 hover:text-indigo-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            Create an account
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
