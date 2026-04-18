"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Mail } from "lucide-react";
import {
  Button,
  Field,
  Input,
  PasswordInput,
  FormError,
} from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const now = new Date();
  const weekNumber = getWeekNumber(now);

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)]">
      {/* =================================================================
       * LEFT — the form
       * ================================================================ */}
      <div className="flex flex-col min-h-screen">
        {/* Top brand line */}
        <header className="px-8 pt-7 pb-4">
          <a href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-sm flex items-center justify-center bg-ink-primary text-white">
              <span className="text-[10px] font-semibold tracking-[0.02em]">TAG</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-medium text-ink-primary tracking-[-0.005em]">
                TAG Solutions
              </span>
              <span className="text-[10px] text-ink-tertiary font-mono tracking-wide uppercase">
                HRM
              </span>
            </div>
          </a>
        </header>

        {/* Form area */}
        <main className="flex-1 flex items-center">
          <div className="w-full max-w-[420px] mx-auto px-8 py-10 reveal">
            <span className="eyebrow block mb-4">Sign in</span>
            <h1 className="text-[2.25rem] leading-[1.05] font-light tracking-[-0.025em] text-ink-primary text-balance mb-3">
              Welcome back to<br />
              <span className="text-ink-accent">TAG Solutions HRM.</span>
            </h1>
            <p className="text-[14px] text-ink-tertiary leading-relaxed mb-8">
              Use your work email to access attendance, leave, payroll, and reports.
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {error && <FormError>{error}</FormError>}

              <Field label="Work email" required>
                {({ id, invalid, describedBy }) => (
                  <Input
                    id={id}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@tagsolutions.com"
                    autoComplete="email"
                    leftIcon={<Mail className="w-3.5 h-3.5" strokeWidth={1.75} />}
                    required
                    aria-describedby={describedBy}
                    invalid={invalid}
                  />
                )}
              </Field>

              <Field label="Password" required>
                {({ id, invalid }) => (
                  <PasswordInput
                    id={id}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    invalid={invalid}
                  />
                )}
              </Field>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                icon={!loading && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
                iconPosition="right"
                className="w-full mt-2"
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="mt-8 text-[11px] text-ink-tertiary leading-relaxed">
              Trouble signing in? Contact your HR administrator or reach{" "}
              <a href="mailto:support@tagsolutions.com" className="text-ink-accent hover:underline">
                support@tagsolutions.com
              </a>
              .
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-8 py-5 border-t border-line-subtle">
          <div className="flex items-center justify-between text-[11px] text-ink-tertiary font-mono tabular-nums">
            <span>© {now.getFullYear()} TAG Solutions</span>
            <span className="hidden sm:inline">
              Week {weekNumber} · v1.0
            </span>
          </div>
        </footer>
      </div>

      {/* =================================================================
       * RIGHT — editorial brand panel (dark, textured, mono metadata)
       * ================================================================ */}
      <aside
        className="hidden lg:block relative overflow-hidden bg-ink-primary text-ink-inverse"
        aria-hidden
      >
        {/* Noise + gradient backdrop */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(1200px 600px at 90% 0%, rgba(249,115,22,0.6), transparent 60%), radial-gradient(800px 400px at 10% 100%, rgba(249,115,22,0.35), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col p-12">
          {/* Top meta rail */}
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.12em] text-white/50">
            <span>Vol.01 — HRM</span>
            <span>{now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</span>
          </div>

          {/* Editorial statement */}
          <div className="flex-1 flex flex-col justify-center max-w-[480px]">
            <span className="eyebrow !text-white/50 mb-6">Operations, clarified.</span>
            <h2 className="text-[3rem] leading-[1.05] font-light tracking-[-0.025em] text-balance">
              People, hours, and pay —{" "}
              <span className="text-accent">on one ledger.</span>
            </h2>
            <p className="text-[15px] text-white/60 mt-6 leading-relaxed max-w-md">
              Track attendance across the team, approve leave without the back-and-forth, and
              hand off clean payroll every month.
            </p>

            {/* Stat plate */}
            <div className="mt-10 grid grid-cols-3 gap-0 border border-white/10 rounded-md overflow-hidden bg-white/[0.02]">
              {[
                { label: "Modules", value: "07" },
                { label: "Roles", value: "03" },
                { label: "Exports", value: "PDF·XLSX" },
              ].map((stat, idx) => (
                <div
                  key={stat.label}
                  className={idx !== 2 ? "border-r border-white/10 p-4" : "p-4"}
                >
                  <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-white/40 block mb-2">
                    {stat.label}
                  </span>
                  <span className="font-mono tabular-nums text-[18px] text-white">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom meta rail */}
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.12em] text-white/40">
            <span>Secure · TLS 1.3</span>
            <span>Week {String(weekNumber).padStart(2, "0")} / 52</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
