// src/pages/SignIn.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Activity, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const SignIn: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/home");
  }, [isAuthenticated, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Logged in successfully!");
      navigate("/home");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      toast.error("Enter your email address first.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) toast.error(resetError.message);
    else toast.success("Password reset instructions were sent to your email.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 font-sans selection:bg-primary/20 text-foreground">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 bg-surface border border-border rounded-lg flex items-center justify-center mb-6 shadow-sm">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground mb-1.5">Sign in to StudyHive</h1>
          <p className="text-[14px] text-muted-foreground">Enter your details below to continue.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-[13px] text-red-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[13px] font-medium text-foreground/80">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-3 py-2 bg-surface border border-border rounded-md text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-[13px] font-medium text-foreground/80">
                Password
              </label>
              <button type="button" onClick={handleForgotPassword} className="text-[12px] text-muted-foreground hover:text-primary transition-colors">
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 bg-surface border border-border rounded-md text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-9 mt-2 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-[14px] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : "Sign in"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-[13px] text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/sign-up" className="text-primary font-medium hover:underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
