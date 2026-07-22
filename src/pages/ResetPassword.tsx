import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { AuthShell } from "@/components/auth/AuthShell";

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
    return <div className="workspace-canvas min-h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>;
  }

  if (!hasRecoverySession) {
    return (
      <AuthShell title="Reset link unavailable" description="This recovery link has expired or was already used.">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Reset link unavailable</h1>
          <p className="text-sm text-muted-foreground mt-2 mb-5">Request a new password reset link from the sign-in page.</p>
          <Link to="/sign-in" className="inline-flex h-12 w-full items-center justify-center px-4 bg-primary text-primary-foreground rounded-xl font-semibold">Return to sign in</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" description="Use at least 8 characters and keep it unique to StudyHive.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">Enter and confirm your new password.</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          required
          minLength={8}
          className="auth-input"
        />
        <input
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          required
          minLength={8}
          className="auth-input"
        />
        <button disabled={loading} className="w-full h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
