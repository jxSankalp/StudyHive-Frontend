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
import { reportFrontendError } from "@/lib/telemetry";

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
        unreadCount: Number(chat.unread_count ?? 0),
      }));
      setGroups(normalizedGroups);
    } else {
      reportFrontendError("home.groups.load.failed", chatResult.reason);
      setGroups([]);
    }

    if (statsResult.status === "fulfilled") {
      setUserStats(statsResult.value.data);
    } else {
      reportFrontendError("home.stats.load.failed", statsResult.reason);
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
    { label: "Active Groups", value: groups.length.toString(), icon: Users, color: "text-blue-600 dark:text-blue-300", bg: "bg-gradient-to-br from-blue-500/20 to-indigo-500/10", gradient: "from-blue-500/13 via-surface to-indigo-500/8" },
    { label: "Messages Sent", value: userStats.messagesSent.toString(), icon: MessageCircle, color: "text-emerald-600 dark:text-emerald-300", bg: "bg-gradient-to-br from-emerald-500/20 to-cyan-500/10", gradient: "from-emerald-500/12 via-surface to-cyan-500/8" },
    { label: "Whiteboards", value: userStats.whiteboardsCreated.toString(), icon: Activity, color: "text-amber-600 dark:text-amber-300", bg: "bg-gradient-to-br from-amber-500/20 to-orange-500/10", gradient: "from-amber-500/12 via-surface to-orange-500/7" },
    { label: "Notes Created", value: userStats.notesCreated.toString(), icon: FileText, color: "text-purple-600 dark:text-purple-300", bg: "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10", gradient: "from-purple-500/12 via-surface to-fuchsia-500/8" },
  ];

  return (
    <div className="relative isolate min-h-full max-w-[1600px] mx-auto overflow-hidden p-5 sm:p-8">
      <Toaster richColors />
      <div className="pointer-events-none absolute -left-36 top-12 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-72 -z-10 h-96 w-96 rounded-full bg-cyan-400/9 blur-3xl" />

      {/* Header section */}
      <div className="relative mb-8 flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-indigo-500/14 via-surface/90 to-cyan-400/10 p-7 shadow-[0_24px_65px_-38px_var(--shadow-soft)] md:flex-row md:items-center sm:p-9">
        <div className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full bg-primary/13 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-surface/55 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" /> Your workspace is ready
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2 sm:text-4xl">
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
          className="relative bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-primary-foreground shadow-xl shadow-primary/25 rounded-xl gap-2 h-11 px-6 transition hover:-translate-y-0.5"
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
            className={clsx("group relative overflow-hidden rounded-2xl border border-border/90 bg-gradient-to-br p-6 shadow-[0_16px_38px_-28px_var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_22px_48px_-28px_var(--shadow-soft)]", stat.gradient)}
          >
            <div className={clsx("pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl opacity-40", stat.bg)} />
            <div className="flex items-center gap-4">
              <div className={clsx("relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/35 shadow-sm", stat.bg)}>
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
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-indigo-500/7 p-5 shadow-[0_16px_38px_-28px_var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_54px_-30px_var(--shadow-soft)]"
                  >
                    <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/13 to-cyan-400/8 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                    <div className="flex justify-between items-start mb-4">
                      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/22 to-cyan-400/12 flex items-center justify-center border border-indigo-500/20 shadow-sm group-hover:scale-105 transition-transform">
                        <MessageCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div className="flex items-center gap-1.5 bg-surface border border-border px-2.5 py-1 rounded-full text-xs font-medium">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{group.usercount}</span>
                      </div>
                    </div>
                    
                    <div className="mb-1 flex items-center gap-2"><h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">{group.chatName}</h3>{!!group.unreadCount && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{group.unreadCount > 99 ? "99+" : group.unreadCount}</span>}</div>
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
            className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-cyan-500/8 p-6 shadow-[0_20px_48px_-30px_var(--shadow-soft)]"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-indigo-500/14 to-cyan-400/12 blur-3xl" />
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-400/10 text-indigo-600 dark:text-indigo-300"><Video className="w-4 h-4" /></span>
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
                    className="relative p-3 rounded-xl bg-gradient-to-r from-elevated to-indigo-500/5 border border-border hover:border-primary/30 transition-all hover:-translate-y-0.5 cursor-pointer flex items-center gap-3 group"
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
