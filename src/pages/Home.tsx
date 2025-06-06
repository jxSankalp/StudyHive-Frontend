import { useEffect, useState } from "react";
import {
  Search,
  MessageCircle,
  Users,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import clsx from "clsx";
import type { Group } from "@/types/index"; 


const gradientColors = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-yellow-500 to-orange-500",
  "from-indigo-500 to-purple-500",
  "from-rose-500 to-red-500",
  "from-teal-500 to-lime-500",
  "from-fuchsia-500 to-violet-500",
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchGroups = async () => {
    const {data} = await axios.get("/api/chat");
    setGroups(data);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGroupClick = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const handleCreateGroup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (
      form.elements.namedItem("name") as HTMLInputElement
    )?.value.trim();
    const description = (
      form.elements.namedItem("description") as HTMLTextAreaElement
    )?.value.trim();
    if (!name || !description) return;

    const randomColor =
      gradientColors[Math.floor(Math.random() * gradientColors.length)];

    const newGroup : Group = {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      description,
      members: 1,
      lastMessage: "New group created!",
      color: randomColor,
    };
    setGroups((prev) => [newGroup, ...prev]);
    setShowModal(false);
    form.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,0.1)_50%,transparent_75%)] bg-[length:60px_60px]" />

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
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

          {filteredGroups.map((group) => {
            const IconComponent = MessageCircle;
            return (
              <div
                key={group.id}
                onClick={() => handleGroupClick(group.id)}
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
                      {group.name}
                    </h3>
                    <p className="text-gray-400 mb-6">{group.description}</p>
                    <div className="flex justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.members.toLocaleString()} members
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
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full relative border border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold text-white mb-4">
                Create New Group
              </h2>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <input
                  name="name"
                  placeholder="Group Name"
                  className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 placeholder-gray-500 focus:outline-none"
                />
                <textarea
                  name="description"
                  placeholder="Group Description"
                  className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 placeholder-gray-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Create Group
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
