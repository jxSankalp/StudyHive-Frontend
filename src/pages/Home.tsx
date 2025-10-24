import { useEffect, useState } from "react";
import {
  Search,
  MessageCircle,
  Users,
  Plus,
  Home, // 1. Import Home icon
  User, // 2. Import User icon for Profile
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import type { Group } from "@/types/index";
import CreateGroupModal from "@/components/CreateGroupModal";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button"; // 3. Import Button
import api from "@/lib/axiosInstance";

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchGroups = async () => {
    try {
      const { data } = await api.get("/api/chat");
      console.log(data.chats);
      setGroups(Array.isArray(data.chats) ? data.chats : []);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      setGroups([]);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const filteredGroups = Array.isArray(groups)
    ? groups.filter(
        (group) =>
          group?.chatName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleGroupClick = (id: string) => {
    navigate(`/chat/${id}`);
  };

  // --- 4. Handler for Home Button ---
  const handleHomeClick = () => {
    navigate("/"); // Navigate to the root route (landing page)
  };

  // --- 5. Handler for Profile Button ---
  const handleProfileClick = () => {
    navigate("/profile"); // Navigate to the profile page
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,0.1)_50%,transparent_75%)] bg-[length:60px_60px]" />

      <Toaster richColors />

      {/* --- 6. Add Home Button (Top Left) --- */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleHomeClick}
        className="absolute top-6 left-6 z-20 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Go to Landing Page"
      >
        <Home className="w-6 h-6" />
      </Button>

      {/* --- 7. Add Profile Button (Top Right) --- */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleProfileClick}
        className="absolute top-6 right-6 z-20 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Go to Profile"
      >
        <User className="w-6 h-6" />
      </Button>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header - Added padding to prevent overlap */}
        <div className="text-center mb-16 pt-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-4">
            Study Hive
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            From Notes to Whiteboards — All in One Study Space.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2">
              <div className="flex items-center space-x-4">
                <Search className="w-6 h-6 text-gray-400 ml-4" />
                <input
                  type="text"
                  placeholder="Search chat groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-white placeholder-gray-400 text-lg focus:ring-0 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Create New Group Card */}
          <div
            onClick={() => setShowModal(true)}
            className="group cursor-pointer bg-gray-900/60 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-8 flex items-center justify-center hover:border-gray-600/50 hover:scale-105 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                Create New Group
              </h3>
            </div>
          </div>

          {/* Group Cards */}
          {filteredGroups.map((group) => {
            const IconComponent = MessageCircle;
            return (
              <div
                key={group._id}
                onClick={() => handleGroupClick(group._id)}
                className="group cursor-pointer transform hover:scale-105 transition-all duration-300"
              >
                <div className="relative">
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${group.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
                  />
                  <div className="relative bg-gray-900/60 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-8 hover:border-gray-600/50 transition-all duration-300">
                    <div
                      className={clsx(
                        "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300",
                        `bg-gradient-to-r ${group.color}`
                      )}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {group.chatName}
                    </h3>
                    <p className="text-gray-400 mb-6">{group.description}</p>
                    <div className="flex justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.usercount} members
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <p className="text-gray-500 text-sm mt-4 border-t border-gray-700/30 pt-2 truncate">
                      {group.lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        <CreateGroupModal
          showModal={showModal}
          setShowModal={setShowModal}
          onGroupCreated={fetchGroups}
        />
      </div>
    </div>
  );
}