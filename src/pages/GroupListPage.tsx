import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Users, ArrowRight, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import api from "@/lib/axiosInstance";
import CreateGroupModal from "@/components/CreateGroupModal";
import { motion } from "framer-motion";
import type { ApiChat, Group } from "@/types/index";

interface GroupListPageProps {
  tab: "chat" | "notes" | "meetings" | "whiteboards";
  icon: LucideIcon;
  label: string;
  description: string;
}

export default function GroupListPage({ tab, icon: Icon, label, description }: GroupListPageProps) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      setLoadError(false);
      const res = await api.get<{ chats: ApiChat[] }>("/chat");
      const normalized: Group[] = (Array.isArray(res.data.chats) ? res.data.chats : []).map(
        (chat) => ({
          _id: chat.id,
          chatName: chat.chat_name,
          description: chat.description || "No description",
          usercount: Array.isArray(chat.chat_members) ? chat.chat_members.length : 0,
          lastMessage: chat.messages?.content || "",
        })
      );
      setGroups(normalized);
    } catch {
      setGroups([]);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="min-h-full p-8 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 h-8 px-3 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors border border-primary/20"
        >
          <Plus className="w-3.5 h-3.5" />
          New workspace
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && loadError && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-red-400 mb-4">Workspaces could not be loaded.</p>
          <button onClick={fetchGroups} className="h-9 px-4 text-sm bg-elevated border border-border rounded-lg">Try again</button>
        </div>
      )}

      {!isLoading && !loadError && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-elevated rounded-xl flex items-center justify-center mb-4 border border-border">
            <MessageCircle className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-gray-300 mb-1">No workspaces yet</p>
          <p className="text-sm text-muted-foreground mb-6">Create a workspace to access {label.toLowerCase()}.</p>
          <button
            onClick={() => setShowModal(true)}
            className="h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
          >
            Create workspace
          </button>
        </div>
      )}

      {/* Group list */}
      {!isLoading && !loadError && groups.length > 0 && (
        <div className="space-y-2">
          {groups.map((group, i) => (
            <motion.button
              key={group._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              onClick={() => navigate(`/chat/${group._id}?tab=${tab}`)}
              className="w-full flex items-center gap-4 px-4 py-3.5 bg-elevated hover:bg-elevated/80 border border-border hover:border-primary/20 rounded-xl transition-all text-left group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-primary/70" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{group.chatName}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{group.description}</p>
              </div>

              {/* Members */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Users className="w-3.5 h-3.5" />
                <span>{group.usercount}</span>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
            </motion.button>
          ))}
        </div>
      )}

      <CreateGroupModal
        showModal={showModal}
        setShowModal={setShowModal}
        onGroupCreated={fetchGroups}
      />
    </div>
  );
}
