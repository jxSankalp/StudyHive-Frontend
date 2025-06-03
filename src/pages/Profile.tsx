import { useUser, useClerk } from "@clerk/clerk-react";
import { useState } from "react";

const Profile = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [username, setUsername] = useState("");

  if (!isLoaded)
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Not signed in</div>
      </div>
    );

  const handleUpdate = async () => {
    try {
      await user.update({ username });
      alert("Username updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    }
  };

  const handleLogout = () => {
    signOut({ redirectUrl: "/sign-in" });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-4">Your Profile</h1>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <div className="text-white font-medium bg-gray-700 rounded-md px-3 py-2">
            {user.primaryEmailAddress?.emailAddress}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-1">Username</label>
          <input
            type="text"
            value={username}
            placeholder={user.username || "Enter a new username"}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
