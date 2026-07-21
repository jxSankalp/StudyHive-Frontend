import { useCallback, useEffect, useState } from "react";
import {
  MessageCircle,
  Users,
  Plus,
  FileText,
  Video,
  Activity,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import type { ApiChat, Group } from "@/types/index";
import CreateGroupModal from "@/components/CreateGroupModal";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import api from "@/lib/axiosInstance";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    activeGroups: 0,
    messagesSent: 0,
    whiteboardsCreated: 0,
    notesCreated: 0,
  });

  const fetchGroupsAndStats = useCallback(async () => {
    setIsLoading(true);
    const [chatResult, statsResult] = await Promise.allSettled([
        api.get<{ chats: ApiChat[] }>("/chat"),
        api.get<typeof userStats>("/users/me/stats")
    ]);

    if (chatResult.status === "fulfilled") {
      const normalizedGroups: Group[] = (Array.isArray(chatResult.value.data.chats)
        ? chatResult.value.data.chats
        : []
      ).map((chat) => ({
        _id: chat.id,
        chatName: chat.chat_name,
        description: chat.description || "No description",
        usercount: Array.isArray(chat.chat_members) ? chat.chat_members.length : 0,
        lastMessage: chat.messages?.content || "No messages yet",
      }));
      setGroups(normalizedGroups);
    } else {
      console.error("Failed to fetch groups:", chatResult.reason);
      setGroups([]);
    }

    if (statsResult.status === "fulfilled") {
      setUserStats(statsResult.value.data);
    } else {
      console.error("Failed to fetch user stats:", statsResult.reason);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchGroupsAndStats();
  }, [fetchGroupsAndStats]);

  const handleGroupClick = (id: string) => {
    navigate(`/chat/${id}`);
  };

  // Real analytics data
  const stats = [
    { label: "Active Groups", value: groups.length.toString(), icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Messages Sent", value: userStats.messagesSent.toString(), icon: MessageCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Whiteboards", value: userStats.whiteboardsCreated.toString(), icon: Activity, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Notes Created", value: userStats.notesCreated.toString(), icon: FileText, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  return (
    <div className="min-h-full p-8 max-w-[1600px] mx-auto">
      <Toaster richColors />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.username || "Student"}
          </h1>
          <p className="text-muted-foreground">Here is what's happening in your workspace today.</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl gap-2 h-11 px-6"
          >
            <Plus className="w-4 h-4" />
            New Workspace
          </Button>
        </motion.div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
                <stat.icon className={clsx("w-6 h-6", stat.color)} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area (Left: Groups & Recent Activity) */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Workspaces
              </h2>
              <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate('/chats')}>
                View all
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                <div className="col-span-full py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : groups.length === 0 ? (
                <div className="col-span-full glass-panel p-12 flex flex-col items-center justify-center text-center border-dashed border-border">
                  <div className="w-16 h-16 bg-elevated rounded-2xl flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No active workspaces</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mb-6">Create a new group to start chatting, sharing notes, and collaborating with others.</p>
                  <Button onClick={() => setShowModal(true)} variant="outline" className="rounded-xl border-border hover:bg-elevated">
                    Create your first workspace
                  </Button>
                </div>
              ) : (
                groups.map((group, index) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    key={group._id}
                    onClick={() => handleGroupClick(group._id)}
                    className="glass-card p-5 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
                        <MessageCircle className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="flex items-center gap-1.5 bg-surface border border-border px-2.5 py-1 rounded-full text-xs font-medium">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{group.usercount}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {group.chatName}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
                      {group.description}
                    </p>
                    
                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex -space-x-2">
                         {/* Mock avatars */}
                        {[1,2,3].map(i => (
                          <img key={i} src={`https://api.dicebear.com/7.x/notionists/svg?seed=${group._id}${i}`} className="w-7 h-7 rounded-full border-2 border-elevated bg-surface" alt="member" />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                        Open <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Side Panel (Upcoming Meetings & Quick Actions) */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-panel p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-400" />
              Meetings
            </h3>
            
            {groups.length === 0 ? (
              <div className="py-8 flex flex-col items-center text-center gap-2">
                <Video className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Join a workspace to schedule meetings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.slice(0, 3).map(group => (
                  <div
                    key={group._id}
                    onClick={() => navigate(`/chat/${group._id}?tab=meetings`)}
                    className="p-3 rounded-xl bg-elevated border border-border hover:border-primary/30 transition-colors cursor-pointer flex items-center gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                      <Video className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{group.chatName}</p>
                      <p className="text-xs text-muted-foreground">Open to schedule</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            )}
            
            <Button
              variant="outline"
              className="w-full mt-4 rounded-xl border-border"
              onClick={() => groups.length > 0 ? navigate(`/chat/${groups[0]._id}?tab=meetings`) : setShowModal(true)}
            >
              {groups.length > 0 ? 'Go to Meetings' : 'Create a Workspace First'}
            </Button>
          </motion.div>
        </div>
      </div>

      <CreateGroupModal
        showModal={showModal}
        setShowModal={setShowModal}
        onGroupCreated={fetchGroupsAndStats}
      />
    </div>
  );
}
