"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const emailError = useMemo(() => {
    if (!email) return "Enter your email address";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email";
    return "";
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return "Enter your password";
    if (password.length < 8) return "Use at least 8 characters";
    return "";
  }, [password]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = {
      email: emailError,
      password: passwordError,
    };

    setErrors(nextErrors);
    if (emailError || passwordError) return;
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const result = await register(email, password);
      await login(result.access_token);
      router.push("/");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-6 text-[var(--text-primary)]">
      <div className="panel w-full max-w-md p-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--text-primary)]">Create account</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Create a trading workspace profile in a minute.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="register-email" className="mb-2 block text-sm text-[var(--text-primary)]">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              className="focus-visible-ring w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email ? <p className="mt-1 text-xs text-[var(--negative)]">{errors.email}</p> : null}
          </div>

          <div>
            <label htmlFor="register-password" className="mb-2 block text-sm text-[var(--text-primary)]">
              Password
            </label>
            <div className="relative">
              <input id="register-password" type={showPassword ? "text" : "password"} className="focus-visible-ring w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-base)] px-3 py-2 pr-11 text-sm text-[var(--text-primary)]" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="focus-visible-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--text-muted)]">
                {showPassword ? <span aria-hidden="true">◉</span> : <span aria-hidden="true">◎</span>}
              </button>
            </div>
            {errors.password ? <p className="mt-1 text-xs text-[var(--negative)]">{errors.password}</p> : null}
          </div>

          {submitError ? <p role="alert" className="text-sm text-[var(--negative)]">{submitError}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-visible-ring w-full rounded-xl bg-[var(--accent-signal)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-base)]"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[var(--text-muted)]">Already registered? <Link href="/login" className="text-[var(--accent-signal)]">Sign in</Link></p>
      </div>
    </main>
  );
}
