// src/pages/SignUp.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

import api from "../lib/axiosInstance";

const SignUp: React.FC = () => {
  const { checkAuth, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Register, 2: OTP
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/home");
  }, [isAuthenticated, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        email,
        username,
        password,
      });
      
      setUserId(response.data.userId);
      setStep(2);
      toast.success("OTP sent to your email!");
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "An error occurred during registration.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/verify-otp", {
        userId,
        otp,
      });
      
      await checkAuth(); // Update context
      toast.success("Account verified successfully!");
      navigate("/home");
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Invalid OTP.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="bg-[#111113] p-8 rounded-xl shadow-md w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-1">
          {step === 1 ? "Sign Up" : "Verify OTP"}
        </h2>
        <p className="text-sm mb-6 text-gray-400">
          {step === 1 ? "Create an account to continue" : `Enter the OTP sent to ${email}`}
        </p>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        {step === 1 ? (
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
              {loading ? "Sending OTP..." : "Sign Up"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-sm font-medium">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-[#1c1c1e] border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-600 text-center tracking-widest text-xl"
                required
                placeholder="123456"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-green-600 hover:bg-green-700 transition rounded text-white font-semibold disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-400 hover:text-white"
            >
              Back to Sign Up
            </button>
          </form>
        )}

        {step === 1 && (
          <p className="text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/sign-in" className="text-purple-400 hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default SignUp;
