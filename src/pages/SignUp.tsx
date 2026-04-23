// src/pages/SignUp.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const SignUp: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      // If Supabase requires email confirmation the session will be null.
      // In that case we show a "check your email" message.
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
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="bg-[#111113] p-8 rounded-xl shadow-md w-full max-w-md text-white text-center space-y-4">
          <h2 className="text-2xl font-bold">Check your email ✉️</h2>
          <p className="text-gray-400">
            We sent a confirmation link to <strong>{email}</strong>.<br />
            Click it to activate your account, then{" "}
            <Link to="/sign-in" className="text-purple-400 underline">
              sign in
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="bg-[#111113] p-8 rounded-xl shadow-md w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-1">Sign Up</h2>
        <p className="text-sm mb-6 text-gray-400">Create an account to continue</p>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-[#1c1c1e] border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-[#1c1c1e] border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-[#1c1c1e] border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-3 text-sm text-gray-400 hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 transition rounded text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-purple-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
