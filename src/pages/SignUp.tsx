import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "@/components/auth/AuthShell";

export default function SignUp() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => { if (isAuthenticated) navigate("/home"); }, [isAuthenticated, navigate]);

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email.trim(), username.trim(), password);
      setEmailSent(true);
      toast.success("Account created! Check your email to confirm.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred during registration.";
      setError(message);
      toast.error(message);
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title={emailSent ? "Check your inbox" : "Create your account"} description={emailSent ? "One quick confirmation and your workspace is ready." : "Bring your study group into one focused workspace."}>
      {emailSent ? (
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10"><CheckCircle2 className="h-7 w-7 text-emerald-500" /></span>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">We sent a confirmation link to <strong className="text-foreground">{email}</strong>.</p>
          <Link to="/sign-in" className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90">Return to sign in</Link>
        </div>
      ) : (
        <>
          {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-sm font-medium text-red-600 dark:text-red-300">{error}</div>}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2"><label htmlFor="username" className="text-sm font-medium">Username</label><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Your display name" autoComplete="username" required className="auth-input" /></div>
            <div className="space-y-2"><label htmlFor="email" className="text-sm font-medium">Email address</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required className="auth-input" /></div>
            <div className="space-y-2"><label htmlFor="password" className="text-sm font-medium">Password</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required minLength={8} className="auth-input" /><p className="text-xs text-muted-foreground">Use 8 or more characters for a stronger account.</p></div>
            <button type="submit" disabled={loading || !email.trim() || !password || !username.trim()} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:translate-y-0 disabled:opacity-55">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}</button>
          </form>
          <p className="mt-7 border-t border-border pt-6 text-center text-sm text-muted-foreground">Already have an account? <Link to="/sign-in" className="font-semibold text-primary hover:underline hover:underline-offset-4">Sign in</Link></p>
        </>
      )}
    </AuthShell>
  );
}
