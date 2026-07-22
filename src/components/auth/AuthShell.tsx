import { useEffect, type ReactNode } from "react";
import { Activity, CalendarDays, MessageCircle, Moon, Sun, Video } from "lucide-react";
import { useTheme } from "@/context/theme";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const features = [
  { icon: MessageCircle, label: "One place for every group conversation" },
  { icon: CalendarDays, label: "Plans and deadlines your team can see" },
  { icon: Video, label: "Meetings that start without the setup" },
];

export function AuthShell({ title, description, children }: AuthShellProps) {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const timer = window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }), 120);
    return () => window.clearTimeout(timer);
  }, [title]);

  return (
    <main className="auth-shell grid lg:grid-cols-[minmax(420px,0.9fr)_1.1fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#18213a] px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
        <div className="absolute -left-28 top-1/4 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />

        <div className="relative flex items-center gap-3 text-sm font-semibold tracking-wide">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/10 shadow-lg shadow-black/10">
            <Activity className="h-5 w-5 text-cyan-300" />
          </span>
          StudyHive
        </div>

        <div className="relative my-auto max-w-xl py-16">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Built for momentum</p>
          <h1 className="max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-0.035em] xl:text-5xl">
            Keep the whole study group moving.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            Chat, plan, share notes, and jump into a call without stitching together five different apps.
          </p>

          <div className="mt-10 space-y-3">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.07]">
                  <Icon className="h-4 w-4 text-cyan-300" />
                </span>
                {label}
              </div>
            ))}
          </div>

          <div className="soft-float mt-12 max-w-sm rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-2xl shadow-black/20 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Today’s focus</span>
              <span className="flex items-center gap-1.5 text-emerald-300"><i className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Live</span>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-black/15 p-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-400/20 text-indigo-200"><CalendarDays className="h-4 w-4" /></span>
              <div><p className="text-sm font-medium">Calculus review</p><p className="mt-0.5 text-xs text-slate-400">4 members · 6:30 PM</p></div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-500">A calmer workspace for serious collaboration.</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-16 sm:px-8">
        <div className="absolute right-5 top-5 flex items-center gap-3 sm:right-8 sm:top-7">
          <span className="flex items-center gap-2 text-sm font-semibold lg:hidden"><Activity className="h-5 w-5 text-primary" /> StudyHive</span>
          <button type="button" onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface/80 text-muted-foreground shadow-sm transition hover:-translate-y-0.5 hover:text-foreground" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <div className="auth-card">
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Welcome to StudyHive</p>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
