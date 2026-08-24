import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";
import { socket } from "@/lib/socket";
import { supabase } from "@/lib/supabaseClient";
import { reportFrontendError } from "@/lib/telemetry";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, ArrowUpRight, AtSign, CheckCircle2, CircleHelp, Copy, Download, File, Image as ImageIcon,
  ListTodo, Loader2, MessageCircle, Mic, Paperclip, Pencil, PlusCircle, Reply,
  RotateCcw, Send, Smile, Sparkles, Trash2, X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";

interface Sender { _id: string; username: string; photo?: string }
interface Attachment { id: string; name: string; mimeType: string; sizeBytes: number; url: string }
interface Mention { userId: string; username: string }
type Member = { id: string; username: string; email?: string; photo?: string };
interface Message {
  _id: string;
  sender: Sender;
  content: string;
  createdAt: string;
  chatId: string;
  clientMessageId?: string;
  editedAt?: string;
  deletedAt?: string;
  replyTo?: { _id: string; content: string; deletedAt?: string; senderName: string };
  reactions: Array<{ emoji: string; userId: string }>;
  attachments: Attachment[];
  mentions: Mention[];
}
interface ReadReceipt { userId: string; lastReadAt: string; username: string }
interface DigestItem { text: string; sourceMessageId: string; owner?: string }
interface CatchUpResult {
  digest: { summary: string; decisions: DigestItem[]; actionItems: DigestItem[]; openQuestions: DigestItem[] };
  source: { messageCount: number; from: string | null; to: string | null; cached: boolean };
}

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
  const mentions = Array.isArray(raw.mentions) ? raw.mentions.map((mention) => {
    const item = asRecord(mention); const profile = asRecord(item.profile);
    return { userId: stringValue(item.userId, item.user_id, profile.id), username: stringValue(item.username, profile.username) };
  }).filter((mention) => mention.userId && mention.username) : [];
  return {
    _id: stringValue(raw._id, raw.id) || `${senderId}:${createdAt}:${content}`,
    content,
    createdAt,
    chatId: stringValue(raw.chatId, raw.chat_id),
    clientMessageId: stringValue(raw.clientMessageId, raw.client_message_id) || undefined,
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
    mentions,
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

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const renderMessageText = (message: Message) => {
  if (message.mentions.length === 0) return message.content;
  const names = message.mentions.map((mention) => mention.username).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(@(?:${names.map(escapeRegExp).join("|")}))`, "gi");
  const mentioned = new Set(names.map((name) => `@${name}`.toLowerCase()));
  return message.content.split(pattern).map((part, index) => mentioned.has(part.toLowerCase())
    ? <span key={index} className="rounded bg-white/20 px-1 font-semibold text-inherit">{part}</span>
    : <span key={index}>{part}</span>);
};

const Messages = ({ members }: { members: Member[] }) => {
  const { id: chatId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [selectedMentions, setSelectedMentions] = useState<Mention[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [loadedChatId, setLoadedChatId] = useState("");
  const [digestOpen, setDigestOpen] = useState(false);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);
  const [catchUp, setCatchUp] = useState<CatchUpResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentChatIdRef = useRef("");
  const openedTargetRef = useRef("");

  const markRead = useCallback(async (messageId?: string) => {
    if (!chatId || document.visibilityState !== "visible") return;
    try { await api.post(`/chat/${chatId}/read`, { messageId: messageId || null }); }
    catch (markError) { reportFrontendError("messages.read-receipt.failed", markError, { chatId }); }
  }, [chatId]);

  const loadConversation = useCallback(async () => {
    if (!chatId) return;
    setMessages([]); setError(null); setLoading(true); setLoadedChatId(""); setNextCursor(null); setHasMore(false);
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
      reportFrontendError("messages.load.failed", loadError, { chatId });
      setError(getApiErrorMessage(loadError, "Failed to load messages."));
    } finally { setLoading(false); setLoadedChatId(chatId); }
  }, [chatId, markRead]);

  useEffect(() => {
    if (!chatId) return;
    currentChatIdRef.current = chatId;
    setAttachments([]); setReplyingTo(null); setEditingId(null); setNewMessage(""); setSelectedMentions([]); setMentionQuery(null); setCatchUp(null); setDigestError(null); setDigestOpen(false); openedTargetRef.current = "";
    void loadConversation();
  }, [chatId, loadConversation]);

  const targetMessageId = searchParams.get("message");
  useEffect(() => {
    if (!chatId || loadedChatId !== chatId || loading || error || !targetMessageId || openedTargetRef.current === targetMessageId) return;
    openedTargetRef.current = targetMessageId;
    const openTarget = async () => {
      let target = messages.find((message) => message._id === targetMessageId);
      if (!target) {
        try {
          const { data } = await api.get(`/messages/${chatId}/${targetMessageId}`);
          target = normalizeMessage(data.message);
          setMessages((current) => current.some((message) => message._id === targetMessageId)
            ? current
            : [...current, target!].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        } catch (targetError) {
          openedTargetRef.current = "";
          toast.error(getApiErrorMessage(targetError, "The linked message could not be opened."));
          return;
        }
      }
      setHighlightedMessageId(targetMessageId);
      window.setTimeout(() => document.getElementById(`message-${targetMessageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      window.setTimeout(() => setHighlightedMessageId((current) => current === targetMessageId ? null : current), 3500);
    };
    void openTarget();
  }, [chatId, error, loadedChatId, loading, messages, targetMessageId]);

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
      setMessages((current) => {
        const index = current.findIndex((item) => item._id === message._id || (message.clientMessageId && item.clientMessageId === message.clientMessageId));
        if (index < 0) return [...current, message];
        const next = [...current]; next[index] = message; return next;
      });
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

  const mentionCandidates = mentionQuery === null ? [] : members
    .filter((member) => member.id !== user?._id && member.username.toLowerCase().includes(mentionQuery.toLowerCase()))
    .slice(0, 6);

  const updateMentionState = (value: string, cursor: number) => {
    const prefix = value.slice(0, cursor);
    const match = prefix.match(/(?:^|\s)@([^\s@]*)$/);
    if (!match) { setMentionQuery(null); setMentionStart(null); return; }
    setMentionQuery(match[1]);
    setMentionStart(cursor - match[1].length - 1);
    setMentionIndex(0);
  };

  const changeMessage = (value: string, cursor: number) => {
    setNewMessage(value);
    setSelectedMentions((current) => current.filter((mention) => value.includes(`@${mention.username}`)));
    updateMentionState(value, cursor);
  };

  const chooseMention = (member: Member) => {
    const textarea = textareaRef.current;
    if (mentionStart === null || !textarea) return;
    const cursor = textarea.selectionStart;
    const next = `${newMessage.slice(0, mentionStart)}@${member.username} ${newMessage.slice(cursor)}`;
    const nextCursor = mentionStart + member.username.length + 2;
    setNewMessage(next);
    setSelectedMentions((current) => current.some((mention) => mention.userId === member.id)
      ? current
      : [...current, { userId: member.id, username: member.username }]);
    setMentionQuery(null); setMentionStart(null);
    requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(nextCursor, nextCursor); });
  };

  const insertMentionTrigger = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart;
    const needsSpace = cursor > 0 && !/\s/.test(newMessage[cursor - 1]);
    const inserted = `${needsSpace ? " " : ""}@`;
    const next = newMessage.slice(0, cursor) + inserted + newMessage.slice(cursor);
    const nextCursor = cursor + inserted.length;
    setNewMessage(next); setMentionQuery(""); setMentionStart(nextCursor - 1); setMentionIndex(0);
    requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(nextCursor, nextCursor); });
  };

  const composerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && mentionCandidates.length > 0) {
      if (event.key === "ArrowDown") { event.preventDefault(); setMentionIndex((index) => (index + 1) % mentionCandidates.length); return; }
      if (event.key === "ArrowUp") { event.preventDefault(); setMentionIndex((index) => (index - 1 + mentionCandidates.length) % mentionCandidates.length); return; }
      if (event.key === "Escape") { event.preventDefault(); setMentionQuery(null); return; }
      if (event.key === "Enter" || event.key === "Tab") { event.preventDefault(); chooseMention(mentionCandidates[mentionIndex] ?? mentionCandidates[0]); return; }
    }
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSend(); }
  };

  const beginEditing = (message: Message) => {
    setEditingId(message._id); setReplyingTo(null); setNewMessage(message.content);
    setSelectedMentions(message.mentions); setMentionQuery(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleSend = async () => {
    const content = newMessage.trim();
    if ((!content && attachments.length === 0) || !chatId || uploading) return;
    if (editingId) {
      if (!content) return;
      try {
        const { data } = await api.patch(`/messages/${editingId}`, { content, mentionedUserIds: selectedMentions.map((mention) => mention.userId) });
        setMessages((current) => current.map((message) => message._id === editingId ? normalizeMessage(data) : message));
        setEditingId(null); setNewMessage(""); setSelectedMentions([]); toast.success("Message updated.");
      } catch (editError) { toast.error(getApiErrorMessage(editError, "Message could not be updated.")); }
      return;
    }
    const pendingAttachments = attachments;
    const clientMessageId = crypto.randomUUID();
    const optimistic: Message = {
      _id: `optimistic:${clientMessageId}`, clientMessageId, content, chatId, createdAt: new Date().toISOString(), attachments: pendingAttachments,
      sender: { _id: user?._id ?? "", username: user?.username ?? "You", photo: user?.photo },
      replyTo: replyingTo ? { _id: replyingTo._id, content: replyingTo.content, deletedAt: replyingTo.deletedAt, senderName: replyingTo.sender.username } : undefined,
      reactions: [], mentions: selectedMentions,
    };
    setMessages((current) => [...current, optimistic]); setNewMessage("");
    requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
    try {
      const { data } = await api.post("/messages", { content, chatId, clientMessageId, replyToId: replyingTo?._id || null, attachmentIds: pendingAttachments.map((item) => item.id), mentionedUserIds: selectedMentions.map((mention) => mention.userId) });
      const confirmed = normalizeMessage(data);
      setMessages((current) => current.map((message) => message._id === optimistic._id || message.clientMessageId === confirmed.clientMessageId ? confirmed : message));
      setAttachments([]); setReplyingTo(null); setSelectedMentions([]); setMentionQuery(null);
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

  const createDigest = async () => {
    if (!chatId || digestLoading) return;
    setDigestOpen(true); setDigestLoading(true); setDigestError(null);
    try {
      const { data } = await api.post<CatchUpResult>(`/messages/${chatId}/catch-up`);
      setCatchUp(data);
    } catch (digestRequestError) {
      reportFrontendError("ai.digest.request.failed", digestRequestError, { chatId });
      setDigestError(getApiErrorMessage(digestRequestError, "The catch-up digest could not be created."));
    } finally { setDigestLoading(false); }
  };

  const openDigestSource = (messageId: string) => {
    setDigestOpen(false);
    const next = new URLSearchParams(searchParams);
    next.set("tab", "chat"); next.set("message", messageId);
    setSearchParams(next);
    setHighlightedMessageId(messageId);
    window.setTimeout(() => document.getElementById(`message-${messageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 180);
    window.setTimeout(() => setHighlightedMessageId((current) => current === messageId ? null : current), 3500);
  };

  const groups: Record<string, Message[]> = {};
  messages.forEach((message) => { const date = new Date(message.createdAt).toLocaleDateString(); (groups[date] ??= []).push(message); });
  const latestOwnId = [...messages].reverse().find((message) => message.sender._id === user?._id && !message.deletedAt)?._id;

  const digestSections = catchUp ? [
    { title: "Decisions", icon: CheckCircle2, items: catchUp.digest.decisions, tone: "text-emerald-600 dark:text-emerald-300", surface: "bg-emerald-500/10" },
    { title: "Action items", icon: ListTodo, items: catchUp.digest.actionItems, tone: "text-indigo-600 dark:text-indigo-300", surface: "bg-indigo-500/10" },
    { title: "Open questions", icon: CircleHelp, items: catchUp.digest.openQuestions, tone: "text-amber-700 dark:text-amber-300", surface: "bg-amber-500/10" },
  ] : [];

  return (<>
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
            return <motion.div id={`message-${message._id}`} key={message._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className={`group flex rounded-xl px-2 transition-shadow ${isOwn ? "justify-end" : "justify-start"} ${consecutive ? "mt-1" : "mt-5"} ${highlightedMessageId === message._id ? "ring-4 ring-primary/25" : ""}`}>
              <div className={`flex max-w-[78%] items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                {!isOwn && <div className={`h-8 w-8 shrink-0 ${consecutive ? "invisible" : ""}`}><Avatar className="h-full w-full border border-border"><AvatarImage src={message.sender.photo ?? ""} /><AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-xs text-white">{message.sender.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar></div>}
                <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {!consecutive && <div className={`mb-1 flex items-baseline gap-2 ${isOwn ? "flex-row-reverse" : ""}`}><span className="text-[13px] font-semibold text-foreground">{message.sender.username}</span><span className="text-[11px] text-muted-foreground">{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>}
                  <div className="group/bubble relative">
                    {!message.deletedAt && <div className={`absolute top-1/2 z-20 flex -translate-y-1/2 gap-0.5 rounded-lg border border-border bg-surface p-1 text-foreground opacity-0 shadow-lg transition-opacity group-hover/bubble:opacity-100 ${isOwn ? "right-full mr-2" : "left-full ml-2"}`}>
                      <button title="Reply" onClick={() => { setReplyingTo(message); setEditingId(null); }} className="grid h-7 w-7 place-items-center rounded-md hover:bg-elevated"><Reply className="h-3.5 w-3.5" /></button>
                      <button title="React" onClick={() => void toggleReaction(message._id, "\u{1F44D}")} className="grid h-7 w-7 place-items-center rounded-md hover:bg-elevated"><Smile className="h-3.5 w-3.5" /></button>
                      {message.content && <button title="Copy" onClick={() => void navigator.clipboard.writeText(message.content).then(() => toast.success("Message copied."))} className="grid h-7 w-7 place-items-center rounded-md hover:bg-elevated"><Copy className="h-3.5 w-3.5" /></button>}
                      {isOwn && <><button title="Edit" disabled={!message.content} onClick={() => beginEditing(message)} className="grid h-7 w-7 place-items-center rounded-md hover:bg-elevated disabled:opacity-40"><Pencil className="h-3.5 w-3.5" /></button><button title="Delete" onClick={() => void deleteMessage(message._id)} className="grid h-7 w-7 place-items-center rounded-md text-red-500 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button></>}
                    </div>}
                    <div className={`min-w-28 rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${isOwn ? "rounded-tr-sm bg-gradient-to-tr from-indigo-600 to-purple-600 text-white" : "rounded-tl-sm border border-border bg-surface text-foreground"}`}>
                      {message.replyTo && <div className={`mb-2 rounded-lg border-l-2 px-2 py-1.5 text-xs ${isOwn ? "border-white/60 bg-black/10 text-indigo-50" : "border-primary bg-elevated text-muted-foreground"}`}><p className="font-semibold">{message.replyTo.senderName}</p><p className="mt-0.5 max-w-64 truncate">{message.replyTo.deletedAt ? "Deleted message" : message.replyTo.content}</p></div>}
                      {message.deletedAt ? <span className={isOwn ? "italic text-white/70" : "italic text-muted-foreground"}>Message deleted</span> : <>{message.content && <p className="whitespace-pre-wrap break-words">{renderMessageText(message)}</p>}{message.attachments.length > 0 && <div className={`${message.content ? "mt-2" : ""} grid gap-2`}>{message.attachments.map((attachment) => attachment.mimeType.startsWith("image/")
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

      <div className="shrink-0 p-4"><div className="mx-auto max-w-4xl"><div className="relative overflow-visible rounded-2xl border border-border bg-surface/90 shadow-xl shadow-black/10 backdrop-blur-xl transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
        {(replyingTo || editingId) && <div className="flex items-center justify-between gap-3 border-b border-border bg-primary/6 px-4 py-2.5 text-sm"><div className="min-w-0"><p className="font-semibold text-primary">{editingId ? "Editing message" : `Replying to ${replyingTo?.sender.username}`}</p>{replyingTo && <p className="truncate text-xs text-muted-foreground">{replyingTo.content || "Attachment"}</p>}</div><button onClick={() => { setReplyingTo(null); if (editingId) setNewMessage(""); setEditingId(null); setSelectedMentions([]); setMentionQuery(null); }} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground"><X className="h-4 w-4" /></button></div>}
        {attachments.length > 0 && <div className="flex gap-2 overflow-x-auto border-b border-border bg-elevated/45 px-3 py-2">{attachments.map((attachment) => <div key={attachment.id} className="flex max-w-60 shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2 text-xs"><Paperclip className="h-3.5 w-3.5 text-primary" /><span className="truncate">{attachment.name}</span><button title="Remove attachment" onClick={() => void removeAttachment(attachment)} className="text-muted-foreground hover:text-red-500"><X className="h-3.5 w-3.5" /></button></div>)}</div>}
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="hidden" onChange={(event) => void chooseFiles(event.target.files)} />
        {mentionQuery !== null && <div className="absolute bottom-[3.75rem] left-12 z-30 w-72 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-2xl">
          {mentionCandidates.length > 0 ? mentionCandidates.map((member, index) => <button type="button" key={member.id} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseMention(member)} className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm ${index === mentionIndex ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"}`}><Avatar className="h-7 w-7"><AvatarImage src={member.photo || ""} /><AvatarFallback className="text-[10px]">{member.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar><span className="min-w-0 flex-1 truncate font-semibold">{member.username}</span><span className="text-[10px] text-muted-foreground">Mention</span></button>) : <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matching workspace member</p>}
        </div>}
        <div className="flex items-end gap-1 px-2 py-2">
          <Button title="Attach files" variant="ghost" size="icon" disabled={uploading || !!editingId || attachments.length >= MAX_FILES} onClick={() => fileInputRef.current?.click()} className="h-9 w-9 shrink-0 rounded-xl">{uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}</Button>
          <textarea ref={textareaRef} placeholder={editingId ? "Edit your message…" : replyingTo ? "Write a reply…" : "Message workspace…"} value={newMessage} onChange={(event) => changeMessage(event.target.value, event.target.selectionStart)} onClick={(event) => updateMentionState(event.currentTarget.value, event.currentTarget.selectionStart)} onKeyDown={composerKeyDown} disabled={!chatId || loading} rows={1} className="custom-scrollbar min-h-[44px] max-h-32 flex-1 resize-none bg-transparent px-2 py-3 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50" onInput={(event) => { const target = event.target as HTMLTextAreaElement; target.style.height = "auto"; target.style.height = `${Math.min(target.scrollHeight, 128)}px`; }} />
          <div className="flex shrink-0 items-center gap-1"><Button type="button" title="Mention a workspace member" variant="ghost" size="icon" onClick={insertMentionTrigger} className="h-9 w-9 rounded-xl"><AtSign className="h-5 w-5" /></Button><Button disabled title="Emoji picker coming soon" variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><Smile className="h-5 w-5" /></Button><div className="mx-1 h-5 w-px bg-border" /><Button onClick={() => void handleSend()} disabled={(!newMessage.trim() && attachments.length === 0) || !chatId || loading || uploading} className={`h-9 w-9 rounded-xl transition-all ${(newMessage.trim() || attachments.length > 0) ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500" : "bg-elevated text-muted-foreground"}`}><Send className="h-4 w-4" /></Button></div>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-elevated/65 px-4 py-1.5"><div className="flex items-center gap-4"><button type="button" onClick={() => void createDigest()} disabled={!chatId || digestLoading || loading || messages.length === 0} className="flex items-center gap-1 text-xs font-medium text-primary transition hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-50">{digestLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Catch me up</button><button onClick={() => fileInputRef.current?.click()} disabled={uploading || !!editingId || attachments.length >= MAX_FILES} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"><Paperclip className="h-3.5 w-3.5" /> Attach</button><button disabled className="flex cursor-not-allowed items-center gap-1 text-xs text-muted-foreground"><Mic className="h-3.5 w-3.5" /> Voice</button></div><span className="text-[10px] text-muted-foreground"><strong className="text-foreground/70">Shift+Enter</strong> new line</span></div>
      </div></div></div>
    </div>
    <Dialog open={digestOpen} onOpenChange={setDigestOpen}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl border-border bg-surface p-0 shadow-2xl sm:max-w-2xl">
        <div className="border-b border-border bg-gradient-to-br from-primary/12 via-surface to-violet-500/10 px-6 py-5 pr-14">
          <DialogHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><Sparkles className="h-5 w-5" /></div>
            <DialogTitle className="text-xl">Catch me up</DialogTitle>
            <DialogDescription>A grounded digest of the latest conversation—not a replacement for the source messages.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-5 px-6 pb-6">
          {digestLoading && <div className="space-y-3 py-4" aria-live="polite"><div className="h-4 w-2/3 animate-pulse rounded bg-elevated" /><div className="h-4 w-full animate-pulse rounded bg-elevated" /><div className="h-24 animate-pulse rounded-2xl bg-elevated" /><p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reading the recent conversation…</p></div>}
          {!digestLoading && digestError && <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4" role="alert"><div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-300" /><div><p className="font-semibold text-foreground">Digest unavailable</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{digestError}</p><Button type="button" variant="outline" size="sm" onClick={() => void createDigest()} className="mt-3 rounded-xl"><RotateCcw className="h-3.5 w-3.5" /> Try again</Button></div></div></div>}
          {!digestLoading && !digestError && catchUp && <>
            <section><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">In short</p><p className="text-[15px] leading-7 text-foreground">{catchUp.digest.summary}</p></section>
            <div className="grid gap-3 sm:grid-cols-3">
              {digestSections.map(({ title, icon: Icon, items, tone, surface }) => <section key={title} className="rounded-2xl border border-border bg-background/70 p-4"><div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-xl ${surface} ${tone}`}><Icon className="h-4 w-4" /></div><h3 className="text-sm font-semibold text-foreground">{title}</h3><div className="mt-3 space-y-3">{items.length === 0 ? <p className="text-xs leading-5 text-muted-foreground">Nothing explicit found.</p> : items.map((item, index) => <button type="button" key={`${item.sourceMessageId}:${index}`} onClick={() => openDigestSource(item.sourceMessageId)} className="group block w-full text-left"><span className="block text-xs leading-5 text-foreground">{item.text}</span>{item.owner && <span className="mt-1 block text-[11px] font-medium text-muted-foreground">Owner: {item.owner}</span>}<span className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold ${tone}`}>View source <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span></button>)}</div></section>)}
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-elevated/70 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>AI-generated from {catchUp.source.messageCount} recent message{catchUp.source.messageCount === 1 ? "" : "s"}. Verify important details.</span>{catchUp.source.cached && <span className="font-medium text-foreground/70">Reused recent digest</span>}</div>
            <p className="text-[11px] leading-5 text-muted-foreground">When requested, message text is sent to Gemini. Attachments, profile emails, tokens, and file URLs are not included.</p>
          </>}
        </div>
      </DialogContent>
    </Dialog>
  </>);
};

export default Messages;
