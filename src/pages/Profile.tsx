import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";

const Profile = () => {
  const { user, loading, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (user?.username) setUsername(user.username);
  }, [user?.username]);

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-lg">Loading...</div>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-lg">Not signed in</div>
      </div>
    );

  const handleUpdate = async () => {
    const nextUsername = username.trim();
    if (nextUsername.length < 2) {
      toast.error("Username must be at least 2 characters.");
      return;
    }
    try {
      await api.put(`/users/${user._id}`, { username: nextUsername });
      await checkAuth();
      toast.success("Username updated!");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update profile"));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/sign-in");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-surface border border-border p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-4">Your Profile</h1>

        <div className="mb-6">
          <label className="block text-sm text-muted-foreground mb-1">Email</label>
          <div className="text-foreground font-medium bg-elevated rounded-md px-3 py-2">
            {user.email}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-muted-foreground mb-1">Username</label>
          <input
            type="text"
            value={username}
            placeholder="Enter a new username"
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 bg-elevated border border-border text-foreground rounded-md placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex justify-between space-x-4">
          <button
            onClick={handleUpdate}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition"
          >
            Update Username
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
