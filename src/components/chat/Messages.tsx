import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";
import { socket } from "@/lib/socket";
import { supabase } from "@/lib/supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, AtSign, Bot, Copy, Download, File, Image as ImageIcon,
  Loader2, MessageCircle, Mic, Paperclip, Pencil, PlusCircle, Reply,
  Send, Smile, Trash2, X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";

interface Sender { _id: string; username: string; photo?: string }
interface Attachment { id: string; name: string; mimeType: string; sizeBytes: number; url: string }
interface Message {
  _id: string;
  sender: Sender;
  content: string;
  createdAt: string;
  chatId: string;
  editedAt?: string;
  deletedAt?: string;
  replyTo?: { _id: string; content: string; deletedAt?: string; senderName: string };
  reactions: Array<{ emoji: string; userId: string }>;
  attachments: Attachment[];
}
interface ReadReceipt { userId: string; lastReadAt: string; username: string }

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 4;
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/plain", "text/csv",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
const stringValue = (...values: unknown[]): string =>
  values.find((value): value is string => typeof value === "string") ?? "";

const normalizeAttachment = (value: unknown): Attachment => {
  const raw = asRecord(value);
  return {
    id: stringValue(raw.id),
    name: stringValue(raw.name, raw.original_name) || "Attachment",
    mimeType: stringValue(raw.mimeType, raw.mime_type),
    sizeBytes: Number(raw.sizeBytes ?? raw.size_bytes ?? 0),
    url: stringValue(raw.url, raw.signedUrl, raw.signed_url),
  };
};

const normalizeMessage = (value: unknown): Message => {
  const raw = asRecord(value);
  const senderObj = asRecord(raw.sender);
  const createdAt = stringValue(raw.createdAt, raw.created_at) || new Date().toISOString();
  const content = stringValue(raw.content);
  const senderId = stringValue(senderObj._id, senderObj.id, raw.sender_id);
  const replyObj = asRecord(raw.replyTo ?? raw.reply_to);
  const replySender = asRecord(replyObj.sender);
  const reactions = Array.isArray(raw.reactions) ? raw.reactions.map((reaction) => {
    const item = asRecord(reaction);
    return { emoji: stringValue(item.emoji), userId: stringValue(item.userId, item.user_id) };
  }).filter((reaction) => reaction.emoji && reaction.userId) : [];
  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments.map(normalizeAttachment).filter((attachment) => attachment.id && attachment.url)
    : [];
  return {
    _id: stringValue(raw._id, raw.id) || `${senderId}:${createdAt}:${content}`,
    content,
    createdAt,
    chatId: stringValue(raw.chatId, raw.chat_id),
    editedAt: stringValue(raw.editedAt, raw.edited_at) || undefined,
    deletedAt: stringValue(raw.deletedAt, raw.deleted_at) || undefined,
    replyTo: Object.keys(replyObj).length ? {
      _id: stringValue(replyObj._id, replyObj.id),
      content: stringValue(replyObj.content),
      deletedAt: stringValue(replyObj.deletedAt, replyObj.deleted_at) || undefined,
      senderName: stringValue(replySender.username) || "Member",
    } : undefined,
    reactions,
    attachments,
    sender: { _id: senderId, username: stringValue(senderObj.username) || "Unknown", photo: stringValue(senderObj.photo) || undefined },
  };
};

const pageData = (value: unknown) => {
  if (Array.isArray(value)) return { messages: value, nextCursor: null, hasMore: false };
  const raw = asRecord(value);
  return {
    messages: Array.isArray(raw.messages) ? raw.messages : [],
    nextCursor: stringValue(raw.nextCursor) || null,
    hasMore: raw.hasMore === true,
  };
};

const formatBytes = (size: number) => size >= 1024 * 1024
  ? `${(size / (1024 * 1024)).toFixed(1)} MB`
  : `${Math.max(1, Math.round(size / 1024))} KB`;

const Messages = () => {
  const { id: chatId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [receipts, setReceipts] = useState<ReadReceipt[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentChatIdRef = useRef("");

  const markRead = useCallback(async (messageId?: string) => {
    if (!chatId || document.visibilityState !== "visible") return;
    try { await api.post(`/chat/${chatId}/read`, { messageId: messageId || null }); }
    catch (markError) { console.error("[Messages] mark read", markError); }
  }, [chatId]);

  const loadConversation = useCallback(async () => {
    if (!chatId) return;
    setMessages([]); setError(null); setLoading(true); setNextCursor(null); setHasMore(false);
    try {
      const [messageResult, receiptResult] = await Promise.all([
        api.get(`/messages/${chatId}`, { params: { limit: 50 } }),
        api.get(`/chat/${chatId}/reads`),
      ]);
      const page = pageData(messageResult.data);
      const normalized = page.messages.map(normalizeMessage);
      setMessages(normalized); setNextCursor(page.nextCursor); setHasMore(page.hasMore);
      const rawReceipts = Array.isArray(receiptResult.data?.receipts) ? receiptResult.data.receipts : [];
      setReceipts(rawReceipts.map((item: unknown) => {
        const raw = asRecord(item); const profile = asRecord(raw.profile);
        return { userId: stringValue(raw.userId, raw.user_id), lastReadAt: stringValue(raw.lastReadAt, raw.last_read_at), username: stringValue(profile.username) || "Member" };
      }).filter((item: ReadReceipt) => item.userId && item.lastReadAt));
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }));
      const latest = normalized.at(-1);
      if (latest) void markRead(latest._id);
    } catch (loadError) {
      console.error("[Messages] fetch", loadError);
      setError(getApiErrorMessage(loadError, "Failed to load messages."));
    } finally { setLoading(false); }
  }, [chatId, markRead]);

  useEffect(() => {
    if (!chatId) return;
    currentChatIdRef.current = chatId;
    setAttachments([]); setReplyingTo(null); setEditingId(null); setNewMessage("");
    void loadConversation();
  }, [chatId, loadConversation]);

  useEffect(() => {
    if (!user?._id) return;
    const join = () => { if (chatId) socket.emit("join chat", chatId); };
    socket.on("connect", join); socket.on("connected", join); socket.connect();
    if (socket.connected) join();
    return () => { socket.off("connect", join); socket.off("connected", join); };
  }, [chatId, user?._id]);

  useEffect(() => {
    const onReceived = (raw: unknown) => {
      const message = normalizeMessage(raw);
      if (message.chatId && message.chatId !== currentChatIdRef.current) return;
      setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
      void markRead(message._id);
    };
    const onUpdated = (raw: unknown) => {
      const updated = normalizeMessage(raw);
      setMessages((current) => current.map((message) => message._id === updated._id ? updated : message));
    };
    const onDeleted = (raw: unknown) => {
      const deleted = normalizeMessage(raw);
      setMessages((current) => current.map((message) => message._id === deleted._id
        ? { ...message, content: "", deletedAt: deleted.deletedAt || new Date().toISOString(), reactions: [], attachments: [] }
        : message));
    };
    const onReactions = (payload: { messageId?: string; reactions?: Array<{ emoji: string; user_id?: string; userId?: string }> }) => {
      if (!payload.messageId) return;
      setMessages((current) => current.map((message) => message._id === payload.messageId
        ? { ...message, reactions: (payload.reactions ?? []).map((reaction) => ({ emoji: reaction.emoji, userId: reaction.userId ?? reaction.user_id ?? "" })) }
        : message));
    };
    const onRead = (value: unknown) => {
      const raw = asRecord(value);
      if (stringValue(raw.chatId, raw.chat_id) !== currentChatIdRef.current) return;
      const next = { userId: stringValue(raw.userId, raw.user_id), lastReadAt: stringValue(raw.lastReadAt, raw.last_read_at), username: "Member" };
      if (!next.userId || !next.lastReadAt) return;
      setReceipts((current) => [...current.filter((receipt) => receipt.userId !== next.userId), { ...next, username: current.find((receipt) => receipt.userId === next.userId)?.username || next.username }]);
    };
    socket.on("message received", onReceived); socket.on("message updated", onUpdated);
    socket.on("message deleted", onDeleted); socket.on("message reactions", onReactions); socket.on("chat read", onRead);
    return () => {
      socket.off("message received", onReceived); socket.off("message updated", onUpdated);
      socket.off("message deleted", onDeleted); socket.off("message reactions", onReactions); socket.off("chat read", onRead);
    };
  }, [markRead]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") void markRead(messages.at(-1)?._id); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [markRead, messages]);

  const loadOlder = async () => {
    if (!chatId || !nextCursor || loadingOlder) return;
    const container = scrollRef.current;
    const oldHeight = container?.scrollHeight ?? 0;
    setLoadingOlder(true);
    try {
      const { data } = await api.get(`/messages/${chatId}`, { params: { limit: 50, cursor: nextCursor } });
      const page = pageData(data);
      const older = page.messages.map(normalizeMessage);
      setMessages((current) => [...older.filter((candidate) => !current.some((item) => item._id === candidate._id)), ...current]);
      setNextCursor(page.nextCursor); setHasMore(page.hasMore);
      requestAnimationFrame(() => { if (container) container.scrollTop += container.scrollHeight - oldHeight; });
    } catch (olderError) { toast.error(getApiErrorMessage(olderError, "Older messages could not be loaded.")); }
    finally { setLoadingOlder(false); }
  };

  const chooseFiles = async (list: FileList | null) => {
    if (!list || !chatId || uploading) return;
    const selected = Array.from(list).slice(0, Math.max(0, MAX_FILES - attachments.length));
    if (selected.length === 0) { toast.error(`You can attach up to ${MAX_FILES} files.`); return; }
    setUploading(true);
    for (const file of selected) {
      let fileId = "";
      try {
        if (!ALLOWED_TYPES.has(file.type) || file.size < 1 || file.size > MAX_FILE_BYTES) throw new Error("Use an image, document, PDF, text, or spreadsheet up to 10 MB.");
        const prepared = await api.post("/files/upload-url", { chatId, fileName: file.name, mimeType: file.type, sizeBytes: file.size });
        fileId = prepared.data.fileId;
        const { error: uploadError } = await supabase.storage.from("chat-files").uploadToSignedUrl(prepared.data.path, prepared.data.token, file, { contentType: file.type });
        if (uploadError) throw uploadError;
        const completed = await api.post(`/files/${fileId}/complete`);
        setAttachments((current) => [...current, normalizeAttachment(completed.data.attachment)]);
      } catch (uploadError) {
        if (fileId) await api.delete(`/files/${fileId}`).catch(() => undefined);
        toast.error(getApiErrorMessage(uploadError, `Could not upload ${file.name}.`));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
  };

  const removeAttachment = async (attachment: Attachment) => {
    setAttachments((current) => current.filter((item) => item.id !== attachment.id));
    try { await api.delete(`/files/${attachment.id}`); }
    catch { setAttachments((current) => current.some((item) => item.id === attachment.id) ? current : [...current, attachment]); toast.error("Attachment could not be removed."); }
  };

  const handleSend = async () => {
    const content = newMessage.trim();
    if ((!content && attachments.length === 0) || !chatId || uploading) return;
    if (editingId) {
      if (!content) return;
      try {
        const { data } = await api.patch(`/messages/${editingId}`, { content });
        setMessages((current) => current.map((message) => message._id === editingId ? normalizeMessage(data) : message));
        setEditingId(null); setNewMessage(""); toast.success("Message updated.");
      } catch (editError) { toast.error(getApiErrorMessage(editError, "Message could not be updated.")); }
      return;
    }
    const pendingAttachments = attachments;
    const optimistic: Message = {
      _id: crypto.randomUUID(), content, chatId, createdAt: new Date().toISOString(), attachments: pendingAttachments,
      sender: { _id: user?._id ?? "", username: user?.username ?? "You", photo: user?.photo },
      replyTo: replyingTo ? { _id: replyingTo._id, content: replyingTo.content, deletedAt: replyingTo.deletedAt, senderName: replyingTo.sender.username } : undefined,
      reactions: [],
    };
    setMessages((current) => [...current, optimistic]); setNewMessage("");
    requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
    try {
      const { data } = await api.post("/messages", { content, chatId, replyToId: replyingTo?._id || null, attachmentIds: pendingAttachments.map((item) => item.id) });
      const confirmed = normalizeMessage(data);
      setMessages((current) => current.map((message) => message._id === optimistic._id ? confirmed : message));
      setAttachments([]); setReplyingTo(null);
      socket.emit("new message", { id: confirmed._id, chat_id: confirmed.chatId });
    } catch (sendError) {
      setMessages((current) => current.filter((message) => message._id !== optimistic._id));
      setNewMessage(content);
      toast.error(getApiErrorMessage(sendError, "Message could not be sent. Please try again."));
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      const { data } = await api.post(`/messages/${messageId}/reactions`, { emoji });
      setMessages((current) => current.map((message) => message._id === messageId
        ? { ...message, reactions: (data.reactions ?? []).map((reaction: { emoji: string; user_id?: string; userId?: string }) => ({ emoji: reaction.emoji, userId: reaction.userId ?? reaction.user_id ?? "" })) }
        : message));
    } catch { toast.error("Reaction could not be updated."); }
  };

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages((current) => current.map((message) => message._id === messageId ? { ...message, content: "", deletedAt: new Date().toISOString(), reactions: [], attachments: [] } : message));
    } catch { toast.error("Message could not be deleted."); }
  };

  const groups: Record<string, Message[]> = {};
  messages.forEach((message) => { const date = new Date(message.createdAt).toLocaleDateString(); (groups[date] ??= []).push(message); });
  const latestOwnId = [...messages].reverse().find((message) => message.sender._id === user?._id && !message.deletedAt)?._id;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-transparent">
      <div ref={scrollRef} className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-6">
        {!loading && hasMore && <div className="flex justify-center"><Button variant="outline" size="sm" onClick={() => void loadOlder()} disabled={loadingOlder} className="rounded-full">{loadingOlder && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Load older messages</Button></div>}
        {loading && <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
        {!loading && error && <div className="flex h-full flex-col items-center justify-center gap-3 text-center"><AlertCircle className="h-10 w-10 text-red-500" /><p className="font-medium text-red-500">{error}</p><Button variant="outline" size="sm" onClick={() => void loadConversation()}>Retry</Button></div>}
        {!loading && !error && messages.length === 0 && <div className="flex h-full flex-col items-center justify-center space-y-3 text-muted-foreground"><div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-elevated"><MessageCircle className="h-7 w-7" /></div><p className="font-medium text-foreground">No messages yet</p><p className="text-sm">Be the first to start the conversation.</p></div>}

        {!loading && !error && Object.entries(groups).map(([date, datedMessages]) => <div key={date}>
          <div className="my-4 flex items-center gap-4"><div className="h-px flex-1 bg-border" /><span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{date}</span><div className="h-px flex-1 bg-border" /></div>
          <AnimatePresence initial={false}>{datedMessages.map((message, index) => {
            const isOwn = message.sender._id === user?._id;
            const previous = index > 0 ? datedMessages[index - 1] : null;
            const consecutive = !!previous && previous.sender._id === message.sender._id && new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() < 300_000;
            const seenBy = latestOwnId === message._id ? receipts.filter((receipt) => receipt.userId !== user?._id && new Date(receipt.lastReadAt).getTime() >= new Date(message.createdAt).getTime()) : [];
            return <motion.div key={message._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className={`group flex px-2 ${isOwn ? "justify-end" : "justify-start"} ${consecutive ? "mt-1" : "mt-5"}`}>
              <div className={`flex max-w-[78%] items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                {!isOwn && <div className={`h-8 w-8 shrink-0 ${consecutive ? "invisible" : ""}`}><Avatar className="h-full w-full border border-border"><AvatarImage src={message.sender.photo ?? ""} /><AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-xs text-white">{message.sender.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar></div>}
                <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {!consecutive && <div className={`mb-1 flex items-baseline gap-2 ${isOwn ? "flex-row-reverse" : ""}`}><span className="text-[13px] font-semibold text-foreground">{message.sender.username}</span><span className="text-[11px] text-muted-foreground">{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>}
                  <div className="group/bubble relative">
                    {!message.deletedAt && <div className={`absolute top-1/2 z-20 flex -translate-y-1/2 gap-0.5 rounded-lg border border-border bg-surface p-1 text-foreground opacity-0 shadow-lg transition-opacity group-hover/bubble:opacity-100 ${isOwn ? "right-full mr-2" : "left-full ml-2"}`}>
                      <button title="Reply" onClick={() => { setReplyingTo(message); setEditingId(null); }} className="grid h-7 w-7 place-items-center rounded-md hover:bg-elevated"><Reply className="h-3.5 w-3.5" /></button>
                      <button title="React" onClick={() => void toggleReaction(message._id, "\u{1F44D}")} className="grid h-7 w-7 place-items-center rounded-md hover:bg-elevated"><Smile className="h-3.5 w-3.5" /></button>
                      {message.content && <button title="Copy" onClick={() => void navigator.clipboard.writeText(message.content).then(() => toast.success("Message copied."))} className="grid h-7 w-7 place-items-center rounded-md hover:bg-elevated"><Copy className="h-3.5 w-3.5" /></button>}
                      {isOwn && <><button title="Edit" disabled={!message.content} onClick={() => { setEditingId(message._id); setReplyingTo(null); setNewMessage(message.content); }} className="grid h-7 w-7 place-items-center rounded-md hover:bg-elevated disabled:opacity-40"><Pencil className="h-3.5 w-3.5" /></button><button title="Delete" onClick={() => void deleteMessage(message._id)} className="grid h-7 w-7 place-items-center rounded-md text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button></>}
                    </div>}
                    <div className={`min-w-28 rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${isOwn ? "rounded-tr-sm bg-gradient-to-tr from-indigo-600 to-purple-600 text-white" : "rounded-tl-sm border border-border bg-surface text-foreground"}`}>
                      {message.replyTo && <div className={`mb-2 rounded-lg border-l-2 px-2 py-1.5 text-xs ${isOwn ? "border-white/60 bg-black/10 text-indigo-50" : "border-primary bg-elevated text-muted-foreground"}`}><p className="font-semibold">{message.replyTo.senderName}</p><p className="mt-0.5 max-w-64 truncate">{message.replyTo.deletedAt ? "Deleted message" : message.replyTo.content}</p></div>}
                      {message.deletedAt ? <span className={isOwn ? "italic text-white/70" : "italic text-muted-foreground"}>Message deleted</span> : <>{message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}{message.attachments.length > 0 && <div className={`${message.content ? "mt-2" : ""} grid gap-2`}>{message.attachments.map((attachment) => attachment.mimeType.startsWith("image/")
                        ? <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-white/20 bg-black/10"><img src={attachment.url} alt={attachment.name} loading="lazy" className="max-h-72 w-full object-cover transition-transform hover:scale-[1.02]" /><span className="flex items-center gap-1.5 px-2 py-1 text-[11px]"><ImageIcon className="h-3 w-3" />{attachment.name}</span></a>
                        : <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className={`flex min-w-52 items-center gap-3 rounded-xl border p-3 transition ${isOwn ? "border-white/20 bg-white/10 hover:bg-white/15" : "border-border bg-elevated hover:border-primary/30"}`}><File className="h-5 w-5 shrink-0" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{attachment.name}</span><span className="block text-[10px] opacity-70">{formatBytes(attachment.sizeBytes)}</span></span><Download className="h-4 w-4 shrink-0" /></a>)}</div>}</>}
                      {message.editedAt && !message.deletedAt && <span className={`ml-2 text-[10px] ${isOwn ? "text-white/65" : "text-muted-foreground"}`}>(edited)</span>}
                    </div>
                    {message.reactions.length > 0 && <div className={`mt-1 flex flex-wrap gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>{Object.entries(message.reactions.reduce<Record<string, string[]>>((acc, reaction) => { (acc[reaction.emoji] ??= []).push(reaction.userId); return acc; }, {})).map(([emoji, users]) => <button key={emoji} onClick={() => void toggleReaction(message._id, emoji)} className={`rounded-full border px-2 py-0.5 text-xs shadow-sm ${users.includes(user?._id || "") ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-surface text-foreground"}`}>{emoji} {users.length}</button>)}</div>}
                  </div>
                  {seenBy.length > 0 && <span className="mt-1 text-[10px] text-muted-foreground" title={seenBy.map((receipt) => receipt.username).join(", ")}>Seen by {seenBy.length}</span>}
                </div>
              </div>
            </motion.div>;
          })}</AnimatePresence>
        </div>)}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      <div className="shrink-0 p-4"><div className="mx-auto max-w-4xl"><div className="overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-xl shadow-black/10 backdrop-blur-xl transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
        {(replyingTo || editingId) && <div className="flex items-center justify-between gap-3 border-b border-border bg-primary/6 px-4 py-2.5 text-sm"><div className="min-w-0"><p className="font-semibold text-primary">{editingId ? "Editing message" : `Replying to ${replyingTo?.sender.username}`}</p>{replyingTo && <p className="truncate text-xs text-muted-foreground">{replyingTo.content || "Attachment"}</p>}</div><button onClick={() => { setReplyingTo(null); if (editingId) setNewMessage(""); setEditingId(null); }} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground"><X className="h-4 w-4" /></button></div>}
        {attachments.length > 0 && <div className="flex gap-2 overflow-x-auto border-b border-border bg-elevated/45 px-3 py-2">{attachments.map((attachment) => <div key={attachment.id} className="flex max-w-60 shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2 text-xs"><Paperclip className="h-3.5 w-3.5 text-primary" /><span className="truncate">{attachment.name}</span><button title="Remove attachment" onClick={() => void removeAttachment(attachment)} className="text-muted-foreground hover:text-red-500"><X className="h-3.5 w-3.5" /></button></div>)}</div>}
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="hidden" onChange={(event) => void chooseFiles(event.target.files)} />
        <div className="flex items-end gap-1 px-2 py-2">
          <Button title="Attach files" variant="ghost" size="icon" disabled={uploading || !!editingId || attachments.length >= MAX_FILES} onClick={() => fileInputRef.current?.click()} className="h-9 w-9 shrink-0 rounded-xl">{uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}</Button>
          <textarea placeholder={editingId ? "Edit your message…" : replyingTo ? "Write a reply…" : "Message workspace…"} value={newMessage} onChange={(event) => setNewMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} disabled={!chatId || loading} rows={1} className="custom-scrollbar min-h-[44px] max-h-32 flex-1 resize-none bg-transparent px-2 py-3 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50" onInput={(event) => { const target = event.target as HTMLTextAreaElement; target.style.height = "auto"; target.style.height = `${Math.min(target.scrollHeight, 128)}px`; }} />
          <div className="flex shrink-0 items-center gap-1"><Button disabled title="Mentions coming soon" variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><AtSign className="h-5 w-5" /></Button><Button disabled title="Emoji picker coming soon" variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><Smile className="h-5 w-5" /></Button><div className="mx-1 h-5 w-px bg-border" /><Button onClick={() => void handleSend()} disabled={(!newMessage.trim() && attachments.length === 0) || !chatId || loading || uploading} className={`h-9 w-9 rounded-xl transition-all ${(newMessage.trim() || attachments.length > 0) ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500" : "bg-elevated text-muted-foreground"}`}><Send className="h-4 w-4" /></Button></div>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-elevated/65 px-4 py-1.5"><div className="flex items-center gap-4"><button disabled className="flex cursor-not-allowed items-center gap-1 text-xs text-muted-foreground"><Bot className="h-3.5 w-3.5" /> Ask AI</button><button onClick={() => fileInputRef.current?.click()} disabled={uploading || !!editingId || attachments.length >= MAX_FILES} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"><Paperclip className="h-3.5 w-3.5" /> Attach</button><button disabled className="flex cursor-not-allowed items-center gap-1 text-xs text-muted-foreground"><Mic className="h-3.5 w-3.5" /> Voice</button></div><span className="text-[10px] text-muted-foreground"><strong className="text-foreground/70">Shift+Enter</strong> new line</span></div>
      </div></div></div>
    </div>
  );
};

export default Messages;
