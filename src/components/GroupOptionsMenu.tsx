import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Loader2, Search, Shield, UserMinus, UserPlus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { ApiChat, IUser } from "@/types";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";

interface GroupOptionsMenuProps { onClose: () => void; onChanged?: () => void }
type Member = { id: string; username: string; email: string; photo?: string; role: "owner" | "admin" | "member" };

export function GroupOptionsMenu({ onClose, onChanged }: GroupOptionsMenuProps) {
  const { id } = useParams();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const loadMembers = useCallback(async () => {
    if (!id) return;
    setLoadingMembers(true);
    try {
      const { data } = await api.get<{ chats: ApiChat[] }>("/chat");
      const chat = data.chats.find((candidate) => candidate.id === id);
      setMembers((chat?.chat_members ?? []).filter((member) => member.profiles).map((member) => ({ id: member.user_id, username: member.profiles?.username || "Member", email: member.profiles?.email || "", photo: member.profiles?.photo ?? undefined, role: member.role || (member.user_id === chat?.group_admin_id ? "owner" : "member") })));
      setNewGroupName(chat?.chat_name || "");
    } catch { toast.error("Workspace members could not be loaded."); }
    finally { setLoadingMembers(false); }
  }, [id]);

  useEffect(() => { void loadMembers(); }, [loadMembers]);
  useEffect(() => {
    const query = search.trim();
    if (!query) { setSearchResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => api.get<{ users: IUser[] }>("/users/search", { params: { query }, signal: controller.signal }).then((response) => setSearchResults((response.data.users ?? []).filter((candidate) => !members.some((member) => member.id === candidate._id)))).catch(() => { if (!controller.signal.aborted) setSearchResults([]); }), 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [members, search]);

  const currentRole = members.find((member) => member.id === user?._id)?.role ?? "member";
  const changed = () => { void loadMembers(); onChanged?.(); };

  const handleRename = async () => {
    const chatName = newGroupName.trim(); if (!id || !chatName) return;
    setSubmitting(true);
    try { await api.put("/chat/rename", { chatId: id, chatName }); toast.success("Workspace renamed."); onChanged?.(); }
    catch (error: unknown) { toast.error(getApiErrorMessage(error, "Failed to rename workspace.")); }
    finally { setSubmitting(false); }
  };

  const handleAddUsers = async () => {
    if (!id || !selectedUsers.length) return;
    setSubmitting(true);
    try { await api.put("/chat/groupadd", { chatId: id, userIds: selectedUsers.map((candidate) => candidate._id) }); toast.success("Members added."); setSelectedUsers([]); setSearch(""); changed(); }
    catch (error: unknown) { toast.error(getApiErrorMessage(error, "Failed to add members.")); }
    finally { setSubmitting(false); }
  };

  const updateRole = async (member: Member) => {
    if (!id) return;
    const role = member.role === "admin" ? "member" : "admin";
    try { await api.put("/chat/role", { chatId: id, userId: member.id, role }); toast.success(role === "admin" ? `${member.username} is now an admin.` : `${member.username} is now a member.`); changed(); }
    catch (error: unknown) { toast.error(getApiErrorMessage(error, "Role could not be updated.")); }
  };

  const removeMember = async (member: Member) => {
    if (!id || !window.confirm(`Remove ${member.username} from this workspace?`)) return;
    try { await api.put("/chat/groupremove", { chatId: id, userId: member.id }); toast.success("Member removed."); changed(); }
    catch (error: unknown) { toast.error(getApiErrorMessage(error, "Member could not be removed.")); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="flex h-full w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-6 py-5"><div><h2 className="text-lg font-bold">Workspace management</h2><p className="mt-1 text-xs text-muted-foreground">Manage members, admins, and settings.</p></div><Button variant="ghost" size="icon" onClick={onClose}><X /></Button></header>
        <div className="flex-1 space-y-7 overflow-y-auto p-6">
          <section><div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4 text-primary" /> Members</h3><span className="text-xs text-muted-foreground">{members.length} people</span></div>{loadingMembers ? <div className="grid h-24 place-items-center"><Loader2 className="animate-spin text-primary" /></div> : <div className="space-y-2">{members.map((member) => <div key={member.id} className="group flex items-center gap-3 rounded-xl border border-border bg-background/55 p-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-400/10 text-sm font-bold text-primary">{member.username.charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member.username}</p><p className="truncate text-xs text-muted-foreground">{member.email}</p></div><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${member.role === "owner" ? "bg-amber-500/12 text-amber-700 dark:text-amber-300" : member.role === "admin" ? "bg-primary/10 text-primary" : "bg-elevated text-muted-foreground"}`}>{member.role === "owner" ? <Crown className="h-3 w-3" /> : member.role === "admin" ? <Shield className="h-3 w-3" /> : null}{member.role}</span>{member.id !== user?._id && member.role !== "owner" && <div className="flex opacity-0 transition group-hover:opacity-100">{currentRole === "owner" && <button onClick={() => void updateRole(member)} title={member.role === "admin" ? "Remove admin" : "Make admin"} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"><Shield className="h-4 w-4" /></button>}<button onClick={() => void removeMember(member)} title="Remove member" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500"><UserMinus className="h-4 w-4" /></button></div>}</div>)}</div>}</section>

          <section className="border-t border-border pt-6"><h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><UserPlus className="h-4 w-4 text-primary" /> Add members</h3><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search username or email" className="h-10 bg-background pl-9" /></div>{searchResults.length > 0 && <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border bg-background p-1">{searchResults.map((candidate) => <button key={candidate._id} onClick={() => { setSelectedUsers((current) => current.some((item) => item._id === candidate._id) ? current : [...current, candidate]); setSearch(""); }} className="w-full rounded-lg p-2 text-left text-sm hover:bg-elevated"><span className="font-semibold">{candidate.username}</span> <span className="text-xs text-muted-foreground">{candidate.email}</span></button>)}</div>}<div className="mt-3 flex flex-wrap gap-1.5">{selectedUsers.map((selected) => <button key={selected._id} onClick={() => setSelectedUsers((current) => current.filter((candidate) => candidate._id !== selected._id))} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{selected.username}<X className="h-3 w-3" /></button>)}</div><Button onClick={() => void handleAddUsers()} disabled={submitting || !selectedUsers.length} className="mt-3 w-full rounded-xl"><UserPlus /> Add selected members</Button></section>

          <section className="border-t border-border pt-6"><h3 className="mb-3 text-sm font-bold">Workspace name</h3><Input value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} maxLength={100} className="bg-background" /><Button onClick={() => void handleRename()} disabled={submitting || !newGroupName.trim()} variant="outline" className="mt-3 w-full rounded-xl">Save workspace name</Button></section>
        </div>
      </motion.div>
    </div>
  );
}
