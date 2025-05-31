// src/pages/SignUp.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, useSignUp } from "@clerk/clerk-react";

const SignUp: React.FC = () => {
  const { isLoaded, setActive, signUp } = useSignUp();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isSignedIn) navigate("/");
  }, [isSignedIn, navigate]);

  if (!isLoaded)
    return <div className="text-white text-center p-4">Loading...</div>;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp.create({ emailAddress: email, password, username });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.longMessage || "An error occurred.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate("/");
      } else {
        setError("Verification failed, please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.longMessage || "An error occurred.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="bg-[#111113] p-8 rounded-xl shadow-md w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-1">Sign Up</h2>
        <p className="text-sm mb-6 text-gray-400">
          Create an account to continue
        </p>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        {!pendingVerification ? (
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-sm text-gray-400 hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 transition rounded text-white font-semibold"
            >
              Sign Up
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-[#1c1c1e] border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-green-600 hover:bg-green-700 transition rounded text-white font-semibold"
            >
              Verify Email
            </button>
          </form>
        )}

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
