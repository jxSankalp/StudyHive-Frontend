import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity, ArrowDownRight, ArrowRight, Bell, CalendarDays, Check,
  CheckCircle2, ChevronRight, FileText, ListChecks, Menu, MessageCircle,
  Moon, PenTool, Search, Sparkles, Sun, Video, X, type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/context/theme";

const ease = [0.22, 1, 0.36, 1] as const;

const features: Array<{
  icon: LucideIcon;
  number: string;
  title: string;
  copy: string;
  detail: string;
  className: string;
  visual: "chat" | "notes" | "board" | "meeting" | "calendar" | "tasks" | "notifications";
}> = [
  { icon: MessageCircle, number: "01", title: "Chat", copy: "Keep decisions beside the work—not buried three apps away.", detail: "Replies · mentions · files", className: "md:col-span-2 xl:col-span-2", visual: "chat" },
  { icon: FileText, number: "02", title: "Notes", copy: "Turn a fast conversation into shared understanding.", detail: "Collaborative · recoverable", className: "md:col-span-1", visual: "notes" },
  { icon: PenTool, number: "03", title: "Whiteboard", copy: "Sketch the part that is easier to show than explain.", detail: "Realtime · visual", className: "md:col-span-1", visual: "board" },
  { icon: Video, number: "04", title: "Meetings", copy: "Start the call where your notes, people, and plan already live.", detail: "Video · participants", className: "md:col-span-2 xl:col-span-2", visual: "meeting" },
  { icon: CalendarDays, number: "05", title: "Calendar", copy: "Give every session and deadline one dependable home.", detail: "Shared · scheduled", className: "md:col-span-1", visual: "calendar" },
  { icon: ListChecks, number: "06", title: "Tasks", copy: "Make the next action and its owner impossible to miss.", detail: "Assigned · trackable", className: "md:col-span-1", visual: "tasks" },
  { icon: Bell, number: "07", title: "Notifications", copy: "Return to the exact message, task, or meeting that needs you.", detail: "Relevant · deep-linked", className: "md:col-span-2 xl:col-span-2", visual: "notifications" },
];

const scatteredTools = ["WhatsApp", "Discord", "Google Docs", "Zoom", "Calendar", "Task list"];

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.62, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5 font-semibold tracking-[-0.025em]">
      <span className="relative grid h-9 w-9 place-items-center rounded-[11px] bg-[var(--landing-ink)] text-[var(--landing-paper)] shadow-[0_7px_18px_rgba(20,43,35,0.18)] dark:bg-[var(--landing-accent)] dark:text-[#102019]">
        <Activity className="h-[18px] w-[18px]" aria-hidden="true" />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--landing-paper)] bg-[var(--landing-coral)]" />
      </span>
      <span className="text-[17px]">StudyHive</span>
    </span>
  );
}

function WorkspacePreview() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 34, rotate: 1.4 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.82, delay: 0.2, ease }}
      className="relative mx-auto w-full max-w-[650px]"
      aria-hidden="true"
    >
      <div className="absolute -inset-5 -z-10 rotate-2 rounded-[32px] bg-[var(--landing-accent)] opacity-70" />
      <div className="landing-window overflow-hidden rounded-[26px] border-2 border-[var(--landing-ink)] bg-[var(--landing-card)] shadow-[14px_16px_0_var(--landing-ink)] dark:shadow-[14px_16px_0_rgba(0,0,0,0.35)]">
        <div className="flex h-12 items-center border-b-2 border-[var(--landing-ink)] px-4">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--landing-coral)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--landing-gold)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--landing-accent)]" />
          </div>
          <div className="mx-auto flex h-7 w-[48%] items-center gap-2 rounded-lg border border-[var(--landing-line)] bg-[var(--landing-paper)] px-3 text-[10px] text-[var(--landing-muted)]">
            <Search className="h-3 w-3" aria-hidden="true" /> Search Calculus crew
          </div>
        </div>

        <div className="grid min-h-[390px] grid-cols-[62px_1fr] sm:grid-cols-[150px_1fr]">
          <aside className="border-r-2 border-[var(--landing-line)] bg-[var(--landing-solid)] p-2.5 text-[var(--landing-on-solid)]">
            <p className="hidden px-2 pt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/45 sm:block">Spaces</p>
            <div className="mt-3 space-y-2">
              {["CA", "PL", "FP"].map((initials, index) => (
                <div key={initials} className={`flex items-center gap-2 rounded-xl p-2 ${index === 0 ? "bg-white/13" : "opacity-55"}`}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold ${index === 0 ? "bg-[var(--landing-accent)] text-[#112019]" : "bg-white/10"}`}>{initials}</span>
                  <span className="hidden truncate text-[11px] font-medium sm:block">{["Calculus", "Physics lab", "Finals prep"][index]}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0 bg-[var(--landing-paper)] p-3 sm:p-4">
            <div className="flex items-center justify-between border-b border-[var(--landing-line)] pb-3">
              <div><p className="text-sm font-bold">Calculus crew</p><p className="mt-0.5 text-[10px] text-[var(--landing-muted)]">6 members · 3 here now</p></div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-full bg-[var(--landing-accent-soft)] px-3 py-1.5 text-[10px] font-bold text-[var(--landing-ink)] sm:block">Exam in 12 days</span>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--landing-solid)] text-[var(--landing-on-solid)]"><Video className="h-4 w-4" /></span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
              <div className="rounded-2xl border border-[var(--landing-line)] bg-[var(--landing-card)] p-3.5 sm:p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold"><MessageCircle className="h-3.5 w-3.5" /> Today</div>
                <div className="mt-8 space-y-3">
                  <div className="mr-7 rounded-2xl rounded-bl-sm bg-[var(--landing-paper)] px-3 py-2.5 text-[11px] leading-4">Can someone explain question 14 before tonight?</div>
                  <div className="ml-6 rounded-2xl rounded-br-sm bg-[var(--landing-solid)] px-3 py-2.5 text-[11px] leading-4 text-[var(--landing-on-solid)]">I added a worked example to our notes. @Maya, want to whiteboard it at 7?</div>
                  <div className="flex items-center gap-2 px-1 text-[9px] font-semibold text-[var(--landing-muted)]"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Seen by Arjun and 3 others</div>
                </div>
                <div className="mt-5 flex h-9 items-center justify-between rounded-xl border border-[var(--landing-line)] bg-[var(--landing-paper)] px-3 text-[10px] text-[var(--landing-muted)]"><span>Message the group…</span><ArrowRight className="h-3 w-3" /></div>
              </div>

              <div className="hidden space-y-3 lg:block">
                <div className="rounded-2xl border border-[var(--landing-line)] bg-[var(--landing-card)] p-4">
                  <div className="flex items-center justify-between text-[11px] font-bold"><span className="flex items-center gap-2"><ListChecks className="h-3.5 w-3.5" /> This week</span><span>2/4</span></div>
                  <div className="mt-4 space-y-2.5 text-[10px]">
                    <p className="flex items-center gap-2 text-[var(--landing-muted)] line-through"><Check className="h-3.5 w-3.5" /> Review chapter 6</p>
                    <p className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded border border-[var(--landing-ink)]" /> Practice set 04</p>
                    <p className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded border border-[var(--landing-ink)]" /> Formula sheet</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-[var(--landing-coral-soft)] p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--landing-muted)]">Next session</p><p className="mt-2 text-xs font-bold">Integration clinic</p><p className="mt-1 text-[10px] text-[var(--landing-muted)]">Today · 7:00 PM</p>
                  <div className="mt-3 flex -space-x-1.5">{["A", "M", "R"].map((letter) => <span key={letter} className="grid h-6 w-6 place-items-center rounded-full border-2 border-[var(--landing-coral-soft)] bg-[var(--landing-solid)] text-[8px] font-bold text-[var(--landing-on-solid)]">{letter}</span>)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { y: [0, -8, 0], rotate: [-2, -1, -2] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-8 -left-3 hidden w-44 -rotate-2 border-2 border-[var(--landing-ink)] bg-[var(--landing-gold)] p-3 shadow-[6px_7px_0_var(--landing-ink)] sm:block">
        <p className="text-[9px] font-black uppercase tracking-[0.16em]">Shared context</p><p className="mt-1 text-xs font-semibold">The plan stays next to the conversation.</p>
      </motion.div>
    </motion.div>
  );
}

function FeatureVisual({ type }: { type: (typeof features)[number]["visual"] }) {
  if (type === "chat") return <div className="space-y-2"><div className="mr-10 h-8 rounded-xl rounded-bl-sm bg-[var(--landing-paper)]" /><div className="ml-12 h-10 rounded-xl rounded-br-sm bg-[var(--landing-accent)]" /><div className="mr-20 h-7 rounded-xl rounded-bl-sm bg-[var(--landing-paper)]" /></div>;
  if (type === "notes") return <div className="space-y-2.5"><div className="h-2 w-2/3 rounded-full bg-[var(--landing-ink)]" /><div className="h-1.5 w-full rounded-full bg-[var(--landing-line)]" /><div className="h-1.5 w-5/6 rounded-full bg-[var(--landing-line)]" /><div className="mt-4 border-l-2 border-[var(--landing-coral)] pl-3 text-[10px] font-semibold">Key idea: solve together.</div></div>;
  if (type === "board") return <div className="relative h-24"><span className="absolute left-2 top-3 h-12 w-12 rounded-full border-2 border-[var(--landing-coral)]" /><span className="absolute right-3 top-1 h-14 w-20 rotate-6 border-2 border-[var(--landing-ink)]" /><span className="absolute bottom-2 left-12 h-0.5 w-24 -rotate-12 bg-[var(--landing-accent)]" /></div>;
  if (type === "meeting") return <div className="grid grid-cols-3 gap-2">{["AM", "RS", "MK"].map((name, index) => <div key={name} className={`grid aspect-[1.2] place-items-center rounded-xl text-[10px] font-black ${index === 1 ? "bg-[var(--landing-accent)] text-[#14231d]" : "bg-[var(--landing-solid)] text-[var(--landing-on-solid)]"}`}>{name}</div>)}</div>;
  if (type === "calendar") return <div className="grid grid-cols-7 gap-1">{Array.from({ length: 21 }, (_, index) => <span key={index} className={`aspect-square rounded-sm ${index === 10 || index === 16 ? "bg-[var(--landing-coral)]" : index === 12 ? "bg-[var(--landing-accent)]" : "bg-[var(--landing-paper)]"}`} />)}</div>;
  if (type === "tasks") return <div className="space-y-2">{[true, false, false].map((done, index) => <div key={index} className="flex items-center gap-2 rounded-lg bg-[var(--landing-paper)] p-2"><span className={`grid h-4 w-4 place-items-center rounded ${done ? "bg-[var(--landing-solid)] text-[var(--landing-on-solid)]" : "border border-[var(--landing-line)]"}`}>{done && <Check className="h-2.5 w-2.5" />}</span><span className={`h-1.5 rounded-full bg-[var(--landing-line)] ${index === 1 ? "w-2/3" : "w-1/2"}`} /></div>)}</div>;
  return <div className="space-y-2">{["@ You were mentioned", "Task due tomorrow"].map((label, index) => <div key={label} className="flex items-center gap-3 rounded-xl bg-[var(--landing-paper)] p-2.5"><span className={`h-2 w-2 rounded-full ${index === 0 ? "bg-[var(--landing-coral)]" : "bg-[var(--landing-accent)]"}`} /><span className="text-[10px] font-semibold">{label}</span><ChevronRight className="ml-auto h-3 w-3" /></div>)}</div>;
}

function FeatureCard({ feature, index }: { feature: (typeof features)[number]; index: number }) {
  const Icon = feature.icon;
  return (
    <Reveal className={feature.className} delay={(index % 3) * 0.06}>
      <article className="group relative h-full min-h-[300px] overflow-hidden border-t-2 border-[var(--landing-ink)] bg-[var(--landing-card)] px-5 py-6 text-[var(--landing-ink)] transition duration-300 hover:-translate-y-1 hover:bg-[var(--landing-card-hover)] sm:px-6">
        <div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--landing-solid)] text-[var(--landing-on-solid)] transition duration-300 group-hover:rotate-[-7deg] group-hover:bg-[var(--landing-accent)] group-hover:text-[#14231d]"><Icon className="h-5 w-5" /></span><span className="font-mono text-[11px] font-bold text-[var(--landing-muted)]">{feature.number} / 07</span></div>
        <div className="mt-9 grid gap-7 sm:grid-cols-[1fr_.9fr] sm:items-end">
          <div><h3 className="landing-display text-[2rem] leading-none tracking-[-0.035em]">{feature.title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-[var(--landing-muted)]">{feature.copy}</p><p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em]">{feature.detail}</p></div>
          <div aria-hidden="true" className="rounded-2xl border border-[var(--landing-line)] bg-[var(--landing-visual)] p-4 transition duration-300 group-hover:border-[var(--landing-ink)]"><FeatureVisual type={feature.visual} /></div>
        </div>
      </article>
    </Reveal>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroVariants: Variants = { hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.09 } } };
  const heroItem: Variants = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.64, ease } } };
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="landing-shell min-h-screen overflow-x-hidden selection:bg-[var(--landing-accent)] selection:text-[#102019]">
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled || mobileMenuOpen ? "border-b border-[var(--landing-line)] bg-[var(--landing-paper-translucent)] backdrop-blur-xl" : "bg-transparent"}`}>
        <div className="mx-auto flex h-[72px] max-w-[1380px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" aria-label="StudyHive home"><Logo /></Link>
          <nav className="hidden items-center gap-8 text-[13px] font-semibold md:flex" aria-label="Main navigation"><a href="#problem" className="landing-nav-link">Why StudyHive</a><a href="#features" className="landing-nav-link">Features</a><a href="#how-it-works" className="landing-nav-link">How it works</a></nav>
          <div className="hidden items-center gap-2 md:flex">
            <button type="button" onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-full border border-[var(--landing-line)] transition hover:-translate-y-0.5 hover:border-[var(--landing-ink)]" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
            <Link to="/sign-in" className="inline-flex h-10 items-center px-4 text-[13px] font-bold transition hover:opacity-60">Sign in</Link>
            <Link to="/sign-up" className="landing-button landing-button-dark h-11 px-5">Start your workspace <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--landing-line)] md:hidden" aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileMenuOpen}>{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {mobileMenuOpen && (
          <motion.nav initial={reduceMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="border-t border-[var(--landing-line)] bg-[var(--landing-paper)] px-5 pb-6 pt-4 md:hidden" aria-label="Mobile navigation">
            {[{ label: "Why StudyHive", href: "#problem" }, { label: "Features", href: "#features" }, { label: "How it works", href: "#how-it-works" }].map((item) => <a key={item.href} href={item.href} onClick={closeMenu} className="flex h-12 items-center justify-between border-b border-[var(--landing-line)] text-sm font-bold">{item.label}<ArrowDownRight className="h-4 w-4" /></a>)}
            <button type="button" onClick={toggleTheme} className="flex h-12 w-full items-center gap-3 border-b border-[var(--landing-line)] text-sm font-bold" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {theme === "dark" ? "Use light theme" : "Use dark theme"}</button>
            <div className="mt-5 grid grid-cols-2 gap-2"><Link to="/sign-in" className="landing-button h-12 border border-[var(--landing-line)]" onClick={closeMenu}>Sign in</Link><Link to="/sign-up" className="landing-button landing-button-dark h-12" onClick={closeMenu}>Get started</Link></div>
          </motion.nav>
        )}
      </header>

      <main>
        <section className="relative px-5 pb-24 pt-32 sm:px-8 sm:pt-40 lg:px-10 lg:pb-32">
          <div className="landing-grid pointer-events-none absolute inset-0" aria-hidden="true" /><div className="landing-orb landing-orb-one" aria-hidden="true" /><div className="landing-orb landing-orb-two" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1380px] items-center gap-16 lg:grid-cols-[.88fr_1.12fr] xl:gap-24">
            <motion.div initial="hidden" animate="visible" variants={heroVariants}>
              <motion.p variants={heroItem} className="mb-7 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.19em] text-[var(--landing-muted)]"><Sparkles className="h-3.5 w-3.5 text-[var(--landing-coral)]" /> One room for the whole study session</motion.p>
              <motion.h1 variants={heroItem} className="landing-display max-w-[760px] text-[clamp(3.7rem,7vw,7rem)] leading-[0.89] tracking-[-0.065em]">Your study group has <span className="relative whitespace-nowrap"><span className="relative z-10">too many tabs.</span><span className="absolute bottom-[0.04em] left-0 h-[0.16em] w-full -rotate-1 bg-[var(--landing-accent)]" aria-hidden="true" /></span></motion.h1>
              <motion.p variants={heroItem} className="mt-7 max-w-[620px] text-[17px] leading-7 text-[var(--landing-muted)] sm:text-lg sm:leading-8">Stop stitching together WhatsApp, Discord, Docs, Zoom, and scattered to-do lists. StudyHive puts chat, notes, whiteboards, meetings, calendars, tasks, and notifications in one shared workspace.</motion.p>
              <motion.div variants={heroItem} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"><Link to="/sign-up" className="landing-button landing-button-dark group h-[54px] px-7 text-sm">Create your free workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link><a href="#features" className="landing-button h-[54px] border border-[var(--landing-line)] px-6 text-sm hover:border-[var(--landing-ink)]">See what replaces the tabs <ArrowDownRight className="h-4 w-4" /></a></motion.div>
              <motion.div variants={heroItem} className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold uppercase tracking-[0.11em] text-[var(--landing-muted)]">{["One membership", "Searchable context", "Built for groups"].map((item) => <span key={item} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[var(--landing-coral)]" />{item}</span>)}</motion.div>
            </motion.div>
            <WorkspacePreview />
          </div>
        </section>

        <section className="border-y-2 border-[var(--landing-ink)] bg-[var(--landing-solid)] text-[var(--landing-on-solid)]" aria-label="StudyHive product summary">
          <div className="mx-auto grid max-w-[1380px] grid-cols-1 divide-y divide-white/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[{ value: "07", label: "connected study tools" }, { value: "01", label: "shared membership model" }, { value: "01", label: "searchable workspace" }].map((stat) => <div key={stat.label} className="flex items-baseline gap-4 px-6 py-6 sm:justify-center lg:py-8"><strong className="landing-display text-4xl text-[var(--landing-accent)]">{stat.value}</strong><span className="max-w-32 text-[11px] font-bold uppercase leading-4 tracking-[0.12em] text-white/65">{stat.label}</span></div>)}
          </div>
        </section>

        <section id="problem" className="scroll-mt-20 px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="mx-auto max-w-[1220px]">
            <Reveal className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--landing-coral-text)]">The problem is not your group</p><h2 className="landing-display text-[clamp(2.7rem,5.2vw,5rem)] leading-[0.95] tracking-[-0.055em]">It is the space between all the tools.</h2></Reveal>
            <div className="mt-14 grid border-y-2 border-[var(--landing-ink)] lg:grid-cols-[1fr_110px_1fr]">
              <Reveal className="py-9 lg:py-12 lg:pr-12">
                <div className="flex items-center justify-between"><h3 className="text-sm font-black uppercase tracking-[0.16em]">The usual setup</h3><span className="rounded-full bg-[var(--landing-coral-soft)] px-3 py-1 text-[10px] font-bold">Scattered</span></div>
                <div className="mt-8 flex min-h-[260px] flex-wrap content-center justify-center gap-3 rounded-[28px] border border-dashed border-[var(--landing-line)] p-5">{scatteredTools.map((tool, index) => <motion.span key={tool} whileHover={reduceMotion ? undefined : { y: -4, rotate: index % 2 ? 2 : -2 }} className={`inline-flex h-12 items-center rounded-full border border-[var(--landing-line)] bg-[var(--landing-card)] px-4 text-xs font-bold shadow-sm ${index % 3 === 0 ? "-rotate-2" : index % 3 === 1 ? "translate-y-3 rotate-1" : "-translate-y-2"}`}>{tool}</motion.span>)}</div>
                <p className="mt-6 max-w-md text-sm leading-6 text-[var(--landing-muted)]">Decisions disappear in chat. Notes live in a mystery document. The call link is somewhere above. Nobody knows what is due.</p>
              </Reveal>
              <div className="relative hidden items-center justify-center border-x border-[var(--landing-line)] lg:flex" aria-hidden="true"><span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--landing-accent)] text-[#14231d]"><ArrowRight className="h-5 w-5" /></span></div>
              <Reveal className="border-t border-[var(--landing-line)] py-9 lg:border-t-0 lg:py-12 lg:pl-12" delay={0.08}>
                <div className="flex items-center justify-between"><h3 className="text-sm font-black uppercase tracking-[0.16em]">The StudyHive way</h3><span className="rounded-full bg-[var(--landing-accent-soft)] px-3 py-1 text-[10px] font-bold">Connected</span></div>
                <div className="relative mt-8 min-h-[260px] overflow-hidden rounded-[28px] bg-[var(--landing-solid)] p-7 text-[var(--landing-on-solid)]"><div className="landing-rings absolute inset-0 opacity-30" aria-hidden="true" /><div className="relative grid h-full min-h-[204px] place-items-center"><div className="grid h-24 w-24 place-items-center rounded-full border border-white/20 bg-[var(--landing-accent)] text-center text-xs font-black leading-4 text-[#14231d] shadow-xl">ONE<br />SPACE</div>{[{ label: "Talk", pos: "left-0 top-2" }, { label: "Think", pos: "right-0 top-2" }, { label: "Plan", pos: "bottom-2 left-2" }, { label: "Meet", pos: "bottom-2 right-2" }].map((item) => <span key={item.label} className={`absolute ${item.pos} rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em]`}>{item.label}</span>)}</div></div>
                <p className="mt-6 max-w-md text-sm leading-6 text-[var(--landing-muted)]">One workspace keeps the conversation, material, plan, and people under the same permission boundary—and makes all of it easier to find again.</p>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 bg-[var(--landing-solid)] px-5 py-24 text-[var(--landing-on-solid)] sm:px-8 lg:px-10 lg:py-32">
          <div className="mx-auto max-w-[1380px]">
            <Reveal className="grid gap-7 lg:grid-cols-[1fr_.72fr] lg:items-end"><div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--landing-accent)]">Seven surfaces. One rhythm.</p><h2 className="landing-display mt-5 max-w-4xl text-[clamp(3rem,5.6vw,5.5rem)] leading-[0.92] tracking-[-0.055em]">Everything the session needs, already in the room.</h2></div><p className="max-w-xl text-base leading-7 text-white/60 lg:justify-self-end">Not seven disconnected features. One continuous flow from a question, to an explanation, to a plan your group can actually follow.</p></Reveal>
            <div className="mt-16 grid gap-px bg-white/18 md:grid-cols-2 xl:grid-cols-3">{features.map((feature, index) => <FeatureCard key={feature.title} feature={feature} index={index} />)}</div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="mx-auto max-w-[1220px]">
            <Reveal className="text-center"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--landing-coral-text)]">Easy to start. Easier to return to.</p><h2 className="landing-display mx-auto mt-5 max-w-3xl text-[clamp(2.8rem,5vw,4.8rem)] leading-[0.95] tracking-[-0.05em]">A better group habit in three steps.</h2></Reveal>
            <div className="mt-16 grid md:grid-cols-3">{[
              { number: "01", title: "Create the room", copy: "Open a workspace for a subject, project, or exam. Your group gets one shared home." },
              { number: "02", title: "Bring the context", copy: "Invite the people, start the conversation, and put the notes and deadlines beside it." },
              { number: "03", title: "Keep momentum", copy: "Meet, solve, assign, and return later without reconstructing what happened." },
            ].map((step, index) => <Reveal key={step.number} delay={index * 0.08} className="relative border-t-2 border-[var(--landing-ink)] py-8 md:border-l md:px-8 md:first:border-l-0"><div className="flex items-center justify-between"><span className="landing-display text-5xl text-[var(--landing-accent-strong)]">{step.number}</span><ArrowDownRight className="h-5 w-5 text-[var(--landing-muted)]" /></div><h3 className="mt-10 text-xl font-black tracking-[-0.02em]">{step.title}</h3><p className="mt-3 text-sm leading-6 text-[var(--landing-muted)]">{step.copy}</p></Reveal>)}</div>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8 lg:px-10 lg:pb-32">
          <Reveal className="relative mx-auto max-w-[1220px] overflow-hidden border-2 border-[var(--landing-ink)] bg-[var(--landing-accent)] px-6 py-16 text-[#112019] shadow-[12px_14px_0_var(--landing-ink)] sm:px-12 sm:py-20 lg:px-20">
            <div className="landing-cta-grid absolute inset-0 opacity-30" aria-hidden="true" /><div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-[11px] font-black uppercase tracking-[0.2em]">Your next session can feel different</p><h2 className="landing-display mt-5 max-w-4xl text-[clamp(3rem,6vw,6rem)] leading-[0.9] tracking-[-0.06em]">Less tab hunting.<br />More learning.</h2><p className="mt-6 max-w-xl text-base leading-7 text-[#27483b]">Give your group one dependable place to talk, think, meet, and finish the work.</p></div><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Link to="/sign-up" className="landing-button group h-14 min-w-56 bg-[#112019] px-7 text-sm text-white hover:bg-[#23493b]">Start your workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link><Link to="/sign-in" className="landing-button h-12 min-w-56 border border-[#112019]/30 px-6 text-sm hover:border-[#112019]">Already use StudyHive? Sign in</Link></div></div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t-2 border-[var(--landing-ink)] px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1380px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"><div><Link to="/" aria-label="StudyHive home"><Logo /></Link><p className="mt-4 max-w-sm text-sm leading-6 text-[var(--landing-muted)]">One calm, connected workspace for study groups that want to make real progress.</p></div><div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold"><a href="#problem" className="landing-nav-link">Why StudyHive</a><a href="#features" className="landing-nav-link">Features</a><a href="#how-it-works" className="landing-nav-link">How it works</a><Link to="/sign-in" className="landing-nav-link">Sign in</Link></div></div>
        <div className="mx-auto mt-9 flex max-w-[1380px] flex-col gap-2 border-t border-[var(--landing-line)] pt-6 text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--landing-muted)] sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} StudyHive</span><span>Built for shared progress</span></div>
      </footer>
    </motion.div>
  );
}
