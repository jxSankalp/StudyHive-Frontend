import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(Boolean(data.session));
      setCheckingSession(false);
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated successfully.");
    navigate("/home", { replace: true });
  };

  if (checkingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]"><Loader2 className="w-5 h-5 text-white animate-spin" /></div>;
  }

  if (!hasRecoverySession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 text-gray-100">
        <div className="w-full max-w-sm text-center bg-[#121212] border border-white/10 rounded-xl p-6">
          <h1 className="text-xl font-semibold">Reset link unavailable</h1>
          <p className="text-sm text-gray-400 mt-2 mb-5">Request a new password reset link from the sign-in page.</p>
          <Link to="/sign-in" className="inline-flex h-10 items-center justify-center px-4 bg-white text-black rounded-md">Return to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4 text-gray-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 bg-[#121212] border border-white/10 rounded-xl p-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Choose a new password</h1>
          <p className="text-sm text-gray-400 mt-1">Use at least 8 characters.</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-md"
        />
        <input
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-md"
        />
        <button disabled={loading} className="w-full h-10 flex items-center justify-center bg-white text-black rounded-md disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
        </button>
      </form>
    </div>
  );
}
