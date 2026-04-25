// src/pages/SignUp.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Activity, Loader2, CheckCircle2 } from "lucide-react";

const SignUp: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/home");
  }, [isAuthenticated, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(email, username, password);
      setEmailSent(true);
      toast.success("Account created! Check your email to confirm.");
    } catch (err: any) {
      const msg = err?.message || "An error occurred during registration.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 font-sans text-gray-100">
        <div className="w-full max-w-[360px] text-center">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-[20px] font-semibold text-white mb-2 tracking-tight">Check your email</h2>
          <p className="text-[14px] text-gray-400 mb-6 leading-relaxed">
            We sent a confirmation link to <span className="text-gray-200 font-medium">{email}</span>. Click it to activate your account.
          </p>
          <Link 
            to="/sign-in" 
            className="inline-flex h-9 items-center justify-center px-4 bg-[#1A1A1A] border border-white/10 hover:bg-[#222222] text-white text-[13px] font-medium rounded-md transition-colors w-full"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 font-sans selection:bg-white/20 text-gray-100">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 bg-[#1A1A1A] border border-white/10 rounded-lg flex items-center justify-center mb-6 shadow-sm">
            <Activity className="w-5 h-5 text-gray-100" />
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-white mb-1.5">Create your workspace</h1>
          <p className="text-[14px] text-gray-400">Enter your details to join StudyHive.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-[13px] text-red-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-[13px] font-medium text-gray-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              required
              className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-md text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[13px] font-medium text-gray-300">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-md text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[13px] font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-md text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password || !username}
            className="w-full h-9 mt-2 flex items-center justify-center bg-white text-black hover:bg-gray-100 font-medium text-[14px] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : "Sign up"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[13px] text-gray-400">
            Already have an account?{" "}
            <Link to="/sign-in" className="text-white font-medium hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
