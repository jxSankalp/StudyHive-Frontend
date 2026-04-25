import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  FileText,
  Video,
  PenTool,
  Search,
  MoreVertical,
  Users,
  Clock,
  MessageCircle,
  CheckSquare,
  CalendarDays,
  Settings,
  Moon,
  Sun,
  LayoutDashboard,
  UserPlus,
  PanelRightClose,
  PanelRightOpen,
  Hash,
  Activity,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import WhiteboardComponent from '@/components/chat/Whiteboards';
import CreateWhiteboardModal from '@/components/CreateWhiteBoardModal';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Messages from "@/components/chat/Messages";
import Notes from "@/components/chat/Notes";
import Meetings from "@/components/chat/Meetings";
import type { Note, Meeting, Whiteboard } from "@/types";
import { GroupOptionsMenu } from "@/components/GroupOptionsMenu";
import { Toaster, toast } from "sonner";
import CreateNotesModal from "@/components/CreateNotesModal";
import { format } from "date-fns";
import CreateMeetingModal from "@/components/CreateMeetingModal";
import api from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";

type TabType = "chat" | "notes" | "meetings" | "whiteboards" | "files" | "tasks" | "calendar";

export default function WorkspacePage() {
  const navigate = useNavigate();
  const { id: chatId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const validTabs: TabType[] = ["chat","notes","meetings","whiteboards","files","tasks","calendar"];
  const tabParam = searchParams.get("tab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam && validTabs.includes(tabParam) ? tabParam : "chat");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showWhiteboardModal, setShowWhiteboardModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  
  // Data
  const [allNotesData, setAllNotesData] = useState<Note[]>([]);
  const [allMeetData, setAllMeetData] = useState<Meeting[]>([]);
  const [allWhiteboardsData, setAllWhiteboardsData] = useState<Whiteboard[]>([]);
  const [noteData, setNoteData] = useState<Note | null>(null);
  const [workspaceStats, setWorkspaceStats] = useState({
    chatName: "Workspace",
    totalMembers: 0,
    totalOnline: 0,
  });
  const [members, setMembers] = useState<Array<{ id: string; username: string; photo?: string }>>([]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showGroupOptions, setShowGroupOptions] = useState(false);

  const navItems = [
    { id: "chat", label: "Chat", icon: MessageCircle, color: "text-indigo-400" },
    { id: "notes", label: "Notes", icon: FileText, color: "text-blue-400" },
    { id: "meetings", label: "Meetings", icon: Video, color: "text-green-400" },
    { id: "whiteboards", label: "Whiteboards", icon: PenTool, color: "text-pink-400" },
    { id: "files", label: "Files", icon: FileText, color: "text-amber-400" },
    { id: "tasks", label: "Tasks", icon: CheckSquare, color: "text-orange-400" },
    { id: "calendar", label: "Calendar", icon: CalendarDays, color: "text-purple-400" },
  ] as const;

  const fetchNoteById = async (noteId: string) => {
    try {
      const res = await api.get(`/notes/${noteId}`);
      if (res.data?.data) setNoteData(res.data.data as Note);
    } catch (error) {
      console.error(`Failed to fetch note ${noteId}:`, error);
    }
  };

  const fetchData = async (tab: TabType) => {
    if (!chatId) return;
    try {
      if (tab === "notes") {
        const res = await api.get(`/notes`, { params: { chatId } });
        setAllNotesData(Array.isArray(res.data?.data) ? res.data.data : []);
      } else if (tab === "meetings") {
        const res = await api.get(`/meet/${chatId}`);
        setAllMeetData(Array.isArray(res.data) ? res.data : []);
      } else if (tab === "whiteboards") {
        const res = await api.get(`/whiteboards/group/${chatId}`);
        setAllWhiteboardsData(Array.isArray(res.data?.data) ? res.data.data : []);
      }
    } catch (error) {
      console.error(`Failed to fetch data for ${tab}:`, error);
    }
  };

  const fetchWorkspaceStats = async () => {
    if (!chatId) return;
    try {
      const { data } = await api.get(`/chat/${chatId}/stats`);
      setWorkspaceStats({
        chatName: data.chatName || "Workspace",
        totalMembers: Number(data.totalMembers) || 0,
        totalOnline: Number(data.totalOnline) || 0,
      });
    } catch (error) {
      console.error("Failed to fetch chat stats:", error);
    }
  };

  const fetchMembers = async () => {
    if (!chatId) return;
    try {
      const { data } = await api.get(`/chat`);
      const chat = data?.chats?.find((c: any) => c.id === chatId);
      if (chat?.chat_members) {
        const parsed = (chat.chat_members as any[])
          .map((m: any) => ({
            id: m.profiles?.id || m.user_id,
            username: m.profiles?.username || "Member",
            photo: m.profiles?.photo,
          }))
          .filter((m) => m.id);
        // Deduplicate by id
        const seen = new Set<string>();
        setMembers(parsed.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; }));
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, refreshKey]);

  useEffect(() => {
    fetchWorkspaceStats();
    fetchMembers();
    // Also pre-fetch meetings for the RightPanel upcoming widget
    if (chatId) {
      api.get(`/meet/${chatId}`)
        .then(res => setAllMeetData(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    }
  }, [chatId]);

  const handleCreateNew = (type: TabType) => {
    if (!chatId) {
      toast.error("Open a valid workspace before creating items.");
      return;
    }
    if (type === "notes") setShowNotesModal(true);
    else if (type === "meetings") setShowMeetingModal(true);
    else if (type === "whiteboards") setShowWhiteboardModal(true);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Filters
  const filteredNotes = allNotesData.filter((n) => !normalizedQuery || n.name?.toLowerCase().includes(normalizedQuery));
  const filteredMeetings = allMeetData.filter((m) => !normalizedQuery || m.name?.toLowerCase().includes(normalizedQuery));
  const filteredWhiteboards = allWhiteboardsData.filter((w) => !normalizedQuery || w.title?.toLowerCase().includes(normalizedQuery));

  // --- RENDERING ---

  const Sidebar = () => (
    <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 bg-[#0F1115] border-r border-border flex flex-col transition-all duration-300 z-20 shadow-2xl`}>
      {/* Top Header */}
      <div className="h-16 flex items-center px-3 border-b border-border/50 gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/home`)} className="text-gray-400 hover:text-white shrink-0" title="Back to Home">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {!sidebarCollapsed && (
          <div className="flex-1 flex items-center space-x-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white truncate text-lg tracking-tight">StudyHive</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(v => !v)} className="text-gray-500 hover:text-white shrink-0" title="Toggle Sidebar">
          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`} />
        </Button>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {!sidebarCollapsed && <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Workspace</p>}
        {navItems.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedItem(null); setSearchQuery(""); }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start space-x-3'} px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              {isActive && !sidebarCollapsed && (
                <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? tab.color : 'text-gray-500 group-hover:text-gray-300'} transition-colors`} />
              {!sidebarCollapsed && <span className="font-medium text-sm">{tab.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile */}
      <div className="p-4 border-t border-border/50">
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} bg-white/5 p-2 rounded-xl border border-white/5`}>
          <div className="flex items-center space-x-3">
            <Avatar className="w-9 h-9 border border-white/10 shadow-sm">
              <AvatarImage src={user?.photo || ""} />
              <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white">
                {user?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-white line-clamp-1">{user?.username || "User"}</span>
                <span className="text-xs text-green-400 flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>Online</span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const SecondarySidebar = () => {
    if (activeTab === "chat") return null;
    
    let listData: any[] = [];
    if (activeTab === "notes") listData = filteredNotes;
    if (activeTab === "meetings") listData = filteredMeetings;
    if (activeTab === "whiteboards") listData = filteredWhiteboards;

    return (
      <div className="w-80 flex-shrink-0 bg-[#13151A] border-r border-border flex flex-col z-10">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <h2 className="text-lg font-bold text-white capitalize">{activeTab}</h2>
        </div>
        <div className="p-4 border-b border-border/50">
          <div className="relative mb-3 group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-gray-500 rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-primary/50"
            />
          </div>
          <Button
            onClick={() => handleCreateNew(activeTab)}
            className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> Create New
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {listData.map((item) => {
            const isSelected = selectedItem === (item.id || item._id);
            return (
              <div
                key={item.id || item._id}
                onClick={() => {
                  setSelectedItem(item.id || item._id);
                  if (activeTab === 'notes') fetchNoteById(item._id);
                }}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5"
                    : "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10"
                }`}
              >
                <h3 className={`font-medium truncate mb-1 ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                  {item.name || item.title}
                </h3>
                {item.content && <p className="text-sm text-gray-500 line-clamp-1">{item.content}</p>}
                <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                  {item.status && (
                    <span className={`px-2 py-0.5 rounded-full ${item.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10'}`}>
                      {item.status}
                    </span>
                  )}
                  {item.createdAt && <span>{format(new Date(item.createdAt), "MMM d")}</span>}
                </div>
              </div>
            );
          })}
          {listData.length === 0 && (
            <div className="text-center p-6 text-gray-500 text-sm">
              No {activeTab} found.
            </div>
          )}
        </div>
      </div>
    );
  };

  const TopBar = () => (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-[#0B0D10]/80 backdrop-blur-xl border-b border-border sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        {sidebarCollapsed && (
          <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(false)} className="mr-2 text-gray-400 hover:text-white">
            <LayoutDashboard className="w-5 h-5" />
          </Button>
        )}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Hash className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight flex items-center space-x-2">
              <span>{activeTab === "chat" ? workspaceStats.chatName : activeTab}</span>
              <ChevronDown className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-300" />
            </h1>
            {activeTab === "chat" && (
              <div className="flex items-center text-xs text-gray-400 space-x-3 mt-0.5">
                <span className="flex items-center"><Users className="w-3 h-3 mr-1"/> {workspaceStats.totalMembers}</span>
                <span className="flex items-center text-green-400"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></div> {workspaceStats.totalOnline} Online</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="hidden md:flex items-center space-x-2 mr-2">
          {activeTab === "chat" && (
            <>
              <Button
                variant="ghost" size="sm"
                className="text-gray-400 hover:text-white bg-white/5 border border-white/5 rounded-lg h-9 px-3"
                onClick={() => setShowMeetingModal(true)}
                title="Start a video meeting"
              >
                <Video className="w-4 h-4 mr-2" /> Meet
              </Button>
              <div className="w-px h-6 bg-border mx-2"></div>
            </>
          )}
          <Button
            variant="ghost" size="icon"
            className="text-gray-400 hover:text-white"
            onClick={() => setShowGroupOptions(v => !v)}
            title="Add members / Rename group"
          >
            <UserPlus className="w-5 h-5" />
          </Button>
        </div>
        
        {activeTab === "chat" && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className={`transition-colors ${rightPanelOpen ? 'bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary' : 'text-gray-400 hover:text-white'}`}
          >
            {rightPanelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </Button>
        )}
      </div>
    </header>
  );

  const RightPanel = () => {
    if (!rightPanelOpen || activeTab !== "chat") return null;

    const visibleMembers = members.slice(0, 5);
    const extraCount = Math.max(0, members.length - 5);
    const upcomingMeetings = allMeetData.filter(m => m.status === "active" || m.status === "scheduled");

    return (
      <aside className="w-80 flex-shrink-0 bg-[#13151A] border-l border-border hidden xl:flex flex-col z-10 shadow-2xl">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Workspace Details</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* Real Members */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-400 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Members ({workspaceStats.totalMembers})
              </h3>
              <button
                onClick={() => setShowGroupOptions(v => !v)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                + Invite
              </button>
            </div>
            {members.length === 0 ? (
              <p className="text-xs text-gray-600 px-1">Loading members…</p>
            ) : (
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="relative shrink-0">
                      <Avatar className="w-8 h-8 border border-white/10">
                        <AvatarImage src={m.photo || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-xs text-white">
                          {m.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator - green if user is in online count */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#13151A] bg-gray-600"></div>
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white truncate flex-1">{m.username}</span>
                    {m.id === user?._id && (
                      <span className="text-[10px] text-indigo-400 font-semibold">You</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full h-px bg-border/50"></div>

          {/* Real Meetings */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-400 flex items-center">
                <Video className="w-4 h-4 mr-2" />
                {upcomingMeetings.length > 0 ? "Meetings" : "No Active Meetings"}
              </h3>
              <button
                onClick={() => setShowMeetingModal(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                + New
              </button>
            </div>
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-6 rounded-xl border border-dashed border-white/10">
                <Video className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No active or scheduled meetings</p>
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  Create one
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map(meeting => (
                  <div
                    key={meeting.id}
                    className={`rounded-xl border p-4 ${
                      meeting.status === "active"
                        ? "bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20"
                        : "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-semibold text-white truncate flex-1 mr-2">{meeting.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        meeting.status === "active"
                          ? "bg-emerald-500 text-white"
                          : "bg-indigo-500 text-white"
                      }`}>
                        {meeting.status === "active" ? "LIVE" : "SOON"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> {meeting.scheduledTime} · {meeting.participants} participant{meeting.participants !== 1 ? "s" : ""}
                    </p>
                    <a href={`/meeting/${meeting.id}`}>
                      <Button
                        size="sm"
                        className={`w-full h-8 text-xs font-semibold shadow-xl ${
                          meeting.status === "active"
                            ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                            : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                        } text-white`}
                      >
                        {meeting.status === "active" ? "Join Now" : "Join Meeting"}
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </aside>
    );
  }

  const renderMainContent = () => {
    if (activeTab === "chat") {
      return <Messages />;
    }

    if (!selectedItem) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0D10] h-full">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-2xl">
            {React.createElement(navItems.find(t => t.id === activeTab)?.icon || FileText, { className: "w-10 h-10 text-gray-500" })}
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Select a {activeTab.slice(0,-1)}</h3>
          <p className="text-gray-500 mb-8 max-w-sm text-center">
            Choose from the sidebar or create a new one to start collaborating with your team.
          </p>
          <Button onClick={() => handleCreateNew(activeTab)} className="bg-white text-black hover:bg-gray-200 rounded-xl px-6 h-11 font-semibold shadow-xl shadow-white/10">
            <Plus className="w-4 h-4 mr-2" /> Create New
          </Button>
        </div>
      );
    }

    if (activeTab === "notes") return <Notes note={noteData} setRefreshKey={setRefreshKey} setSelectedItem={setSelectedItem} />;
    if (activeTab === "meetings") return <Meetings meeting={allMeetData.find((m) => m.id === selectedItem)} onStatusChange={() => setRefreshKey((k) => k + 1)} />;
    if (activeTab === "whiteboards") {
      const w = allWhiteboardsData.find((w) => w._id === selectedItem);
      return w ? <WhiteboardComponent whiteboard={w} /> : <div className="flex-1 flex items-center justify-center text-gray-500 h-full">Loading...</div>;
    }

    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 h-full">
        Work in progress
      </div>
    );
  };

  return (
    <div className="h-screen w-full bg-[#0B0D10] flex overflow-hidden text-foreground selection:bg-primary/30 font-sans">
      {Sidebar()}
      {SecondarySidebar()}
      
      <main className="flex-1 flex flex-col min-w-0 relative z-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        {TopBar()}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0B0D10]">
          {renderMainContent()}
        </div>
      </main>

      {RightPanel()}

      {showGroupOptions && (
        <div className="fixed inset-0 z-50" onClick={() => setShowGroupOptions(false)}>
          <div onClick={e => e.stopPropagation()}>
            <GroupOptionsMenu />
          </div>
        </div>
      )}

      <Toaster richColors theme="dark" />
      <CreateNotesModal showModal={showNotesModal} setShowModal={setShowNotesModal} setRefreshKey={setRefreshKey} />
      <CreateMeetingModal chatId={chatId||""} open={showMeetingModal} onOpenChange={setShowMeetingModal} onSuccess={() => setRefreshKey((k) => k + 1)} />
      <CreateWhiteboardModal showModal={showWhiteboardModal} setShowModal={setShowWhiteboardModal} setRefreshKey={setRefreshKey} />
    </div>
  );
}

