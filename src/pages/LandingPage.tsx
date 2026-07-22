import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  Menu,
  MessageCircle,
  Moon,
  PenTool,
  Search,
  Sun,
  Users,
  Video,
  X,
} from "lucide-react";
import { useTheme } from "@/context/theme";

const reveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: "easeOut" } },
};

const features = [
  { icon: MessageCircle, title: "Group chat that stays useful", copy: "Keep decisions, questions, and resources in one searchable conversation." },
  { icon: Video, title: "Meet without switching apps", copy: "Start a focused group call directly from the workspace where the work happens." },
  { icon: FileText, title: "Notes everyone can build on", copy: "Turn a discussion into shared notes your group can refine together." },
  { icon: PenTool, title: "A whiteboard for hard problems", copy: "Sketch an idea, explain a formula, and make thinking visible in real time." },
  { icon: CalendarDays, title: "A schedule the group can trust", copy: "Put sessions, deadlines, and meetings on one shared calendar." },
  { icon: Search, title: "Find the thread fast", copy: "Move between workspaces and return to the right context without digging." },
];

const steps = [
  { number: "01", title: "Create a workspace", copy: "Set up a home for a subject, project, or exam group." },
  { number: "02", title: "Bring in your group", copy: "Invite classmates and put the plan where everyone can see it." },
  { number: "03", title: "Get the work moving", copy: "Chat, meet, plan, and capture what your group learns." },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const ThemeButton = ({ mobile = false }: { mobile?: boolean }) => (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${mobile ? "h-11 w-full justify-start px-4" : "h-10 w-10 justify-center"} inline-flex items-center gap-3 rounded-xl border border-border bg-surface/80 text-muted-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-foreground`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {mobile && <span className="text-sm font-medium">{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
    </button>
  );

  return (
    <div className="workspace-canvas min-h-screen overflow-x-hidden text-foreground selection:bg-primary/20">
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-border/80 bg-surface/80 shadow-sm backdrop-blur-xl" : "bg-transparent"}`}>
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><Activity className="h-4.5 w-4.5" /></span>
            <span className="text-lg">StudyHive</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex" aria-label="Main navigation">
            <a href="#features" className="transition hover:text-foreground">Features</a>
            <a href="#how-it-works" className="transition hover:text-foreground">How it works</a>
            <a href="#pricing" className="transition hover:text-foreground">Pricing</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeButton />
            <Link to="/sign-in" className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-foreground transition hover:bg-elevated">Sign in</Link>
            <Link to="/sign-up" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90">Create account <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface/80 text-foreground md:hidden" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-b border-border bg-surface/95 backdrop-blur-xl md:hidden">
              <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5" aria-label="Mobile navigation">
                {[['Features', '#features'], ['How it works', '#how-it-works'], ['Pricing', '#pricing']].map(([label, href]) => <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-elevated hover:text-foreground">{label}</a>)}
                <ThemeButton mobile />
                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-4">
                  <Link to="/sign-in" className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface text-sm font-semibold">Sign in</Link>
                  <Link to="/sign-up" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">Sign up</Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <section className="relative px-5 pb-20 pt-34 sm:px-8 md:pb-28 md:pt-44">
          <div className="pointer-events-none absolute left-1/2 top-8 h-[32rem] w-[54rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.92fr_1.08fr]">
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.09 } } }}>
              <motion.div variants={reveal} className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Built for groups that want to get things done
              </motion.div>
              <motion.h1 variants={reveal} className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-6xl xl:text-7xl">
                Study together, without the app juggling.
              </motion.h1>
              <motion.p variants={reveal} className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                StudyHive gives your group one calm place to talk, plan sessions, share notes, solve problems, and meet face to face.
              </motion.p>
              <motion.div variants={reveal} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/sign-up" className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90">Start for free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
                <Link to="/sign-in" className="inline-flex h-13 items-center justify-center rounded-xl border border-border bg-surface/75 px-7 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface">I already have an account</Link>
              </motion.div>
              <motion.div variants={reveal} className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
                {['Free to start', 'No card required', 'Set up in minutes'].map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />{item}</span>)}
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.2, duration: 0.65, ease: "easeOut" }} className="relative">
              <div className="absolute -inset-7 rounded-[2.5rem] bg-gradient-to-br from-primary/16 to-accent/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-3 shadow-[0_35px_90px_-42px_var(--shadow-soft)] backdrop-blur-xl">
                <div className="flex items-center gap-2 border-b border-border px-3 pb-3">
                  <div className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-red-400" /><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div>
                  <div className="ml-3 flex h-8 flex-1 items-center gap-2 rounded-lg bg-elevated px-3 text-xs text-muted-foreground"><Search className="h-3.5 w-3.5" /> Search your workspace</div>
                </div>
                <div className="grid min-h-[390px] grid-cols-[72px_1fr] gap-3 pt-3 sm:grid-cols-[180px_1fr]">
                  <aside className="rounded-2xl bg-elevated/70 p-2.5">
                    <p className="hidden px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:block">Workspaces</p>
                    {['Calculus II', 'Physics lab', 'Finals prep'].map((group, index) => <div key={group} className={`mt-1 flex items-center gap-2 rounded-xl p-2 text-xs ${index === 0 ? 'bg-surface font-semibold text-foreground shadow-sm' : 'text-muted-foreground'}`}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Users className="h-3.5 w-3.5" /></span><span className="hidden truncate sm:block">{group}</span></div>)}
                  </aside>
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-background/55 px-4 py-3"><div><p className="text-sm font-semibold">Calculus II</p><p className="text-xs text-muted-foreground">6 people · 3 online</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Video className="h-4 w-4" /></span></div>
                    <div className="grid flex-1 gap-3 md:grid-cols-[1.15fr_.85fr]">
                      <div className="flex flex-col rounded-2xl border border-border bg-background/45 p-4">
                        <p className="flex items-center gap-2 text-xs font-semibold"><MessageCircle className="h-4 w-4 text-primary" /> Group chat</p>
                        <div className="mt-auto space-y-3 pt-8"><div className="mr-8 rounded-2xl rounded-bl-sm bg-elevated p-3 text-xs text-muted-foreground">Can we review integration by parts tonight?</div><div className="ml-8 rounded-2xl rounded-br-sm bg-primary p-3 text-xs text-primary-foreground">Yes—I've added it to the calendar for 6:30.</div></div>
                        <div className="mt-4 h-10 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-muted-foreground">Message the group…</div>
                      </div>
                      <div className="hidden rounded-2xl border border-border bg-surface p-4 md:block"><p className="flex items-center gap-2 text-xs font-semibold"><FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" /> Session notes</p><div className="mt-5 h-2 w-3/4 rounded-full bg-muted" /><div className="mt-3 h-2 w-full rounded-full bg-muted" /><div className="mt-3 h-2 w-5/6 rounded-full bg-muted" /><div className="mt-8 rounded-xl border border-primary/15 bg-primary/6 p-3 text-xs leading-5 text-muted-foreground">Next: solve practice questions 12–18 before Thursday.</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="border-y border-border/80 bg-surface/45 px-5 py-22 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">One connected workflow</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">Everything your study group reaches for.</h2><p className="mt-4 text-lg leading-8 text-muted-foreground">Useful collaboration tools, designed to feel like one product instead of a folder of links.</p></div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, copy }, index) => <motion.article key={title} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { delay: index * 0.05, duration: 0.4 } } }} className="glass-card group p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:-translate-y-0.5 group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></motion.article>)}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-5 py-22 sm:px-8">
          <div className="mx-auto max-w-7xl"><div className="text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">A simple start</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">From blank page to working group.</h2></div><div className="relative mt-13 grid gap-5 md:grid-cols-3"><div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-border md:block" />{steps.map((step) => <article key={step.number} className="relative rounded-2xl border border-border bg-surface/75 p-6 shadow-sm"><span className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 font-mono text-sm font-semibold text-primary">{step.number}</span><h3 className="mt-6 text-xl font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.copy}</p></article>)}</div></div>
        </section>

        <section id="pricing" className="border-y border-border/80 bg-surface/45 px-5 py-22 sm:px-8">
          <div className="mx-auto max-w-5xl"><div className="text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Clear pricing</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">Start without a decision meeting.</h2><p className="mt-4 text-muted-foreground">The core StudyHive workspace is free while we build the next tier.</p></div><div className="mt-12 grid gap-5 md:grid-cols-2"><article className="rounded-3xl border border-border bg-surface p-8 shadow-sm"><p className="text-sm font-semibold text-muted-foreground">Free</p><p className="mt-3 text-5xl font-semibold tracking-tight">$0</p><p className="mt-3 text-sm text-muted-foreground">For study groups getting organized.</p><ul className="mt-8 space-y-3 text-sm">{['Group workspaces', 'Chat and video meetings', 'Shared notes and whiteboards', 'Calendar and scheduling'].map((item) => <li key={item} className="flex items-center gap-3"><Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />{item}</li>)}</ul><Link to="/sign-up" className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Create your free account</Link></article><article className="relative overflow-hidden rounded-3xl border border-primary/25 bg-[#18213a] p-8 text-white shadow-xl shadow-primary/10"><div className="absolute -right-14 -top-14 h-52 w-52 rounded-full bg-cyan-400/15 blur-3xl" /><p className="relative text-sm font-semibold text-cyan-300">Pro · Coming later</p><p className="relative mt-3 text-4xl font-semibold tracking-tight">More power when you need it.</p><p className="relative mt-4 text-sm leading-6 text-slate-300">Larger groups, longer meetings, and expanded collaboration controls are on the roadmap.</p><div className="relative mt-8 rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-sm text-slate-300">Free accounts will continue to work when Pro launches.</div></article></div></div>
        </section>

        <section className="px-5 py-24 sm:px-8"><div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#18213a] px-6 py-16 text-center text-white shadow-2xl shadow-primary/15 sm:px-12"><div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" /><div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" /><div className="relative"><h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Give your group one good place to work.</h2><p className="mx-auto mt-4 max-w-xl text-slate-300">Create a workspace in minutes, or sign in and get back to the plan.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/sign-up" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-sm font-semibold text-[#18213a] transition hover:-translate-y-0.5 hover:bg-slate-100">Get started free <ArrowRight className="h-4 w-4" /></Link><Link to="/sign-in" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] px-7 text-sm font-semibold text-white transition hover:bg-white/10">Sign in</Link></div></div></div></section>
      </main>

      <footer className="border-t border-border bg-surface/55 px-5 py-10 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><Link to="/" className="flex items-center gap-2 font-semibold"><Activity className="h-5 w-5 text-primary" /> StudyHive</Link><p className="mt-2 text-sm text-muted-foreground">A calmer workspace for serious collaboration.</p></div><div className="flex flex-wrap items-center gap-5 text-sm font-medium text-muted-foreground"><a href="#features" className="hover:text-foreground">Features</a><a href="#pricing" className="hover:text-foreground">Pricing</a><Link to="/sign-in" className="hover:text-foreground">Sign in</Link><Link to="/sign-up" className="text-primary hover:text-primary/75">Create account</Link></div></div><div className="mx-auto mt-8 max-w-7xl border-t border-border pt-6 text-xs text-muted-foreground">© {new Date().getFullYear()} StudyHive. All rights reserved.</div></footer>
    </div>
  );
}
