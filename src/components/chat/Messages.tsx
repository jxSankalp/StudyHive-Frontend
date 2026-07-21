import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useRef, useState } from "react";
import {
  Send, Paperclip, Smile, Mic, PlusCircle,
  Bot, AtSign, MoreHorizontal, MessageCircle, AlertCircle
} from "lucide-react";
import api from "@/lib/axiosInstance";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { socket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────
interface Sender {
  _id: string;
  username: string;
  photo?: string;
}
interface Message {
  _id: string;
  sender: Sender;
  content: string;
  createdAt: string;
  chatId: string;
}

// Backend returns snake_case — handle both shapes defensively
const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const stringValue = (...values: unknown[]): string =>
  values.find((value): value is string => typeof value === "string") ?? "";

const normalizeMessage = (value: unknown): Message => {
  const raw = asRecord(value);
  // sender can be a nested object or just an id string
  const senderObj = asRecord(raw.sender);
  const createdAt = stringValue(raw.createdAt, raw.created_at) || new Date().toISOString();
  const content = stringValue(raw.content);
  const senderId = stringValue(senderObj._id, senderObj.id, raw.sender_id);
  return {
    _id:       stringValue(raw._id, raw.id) || `${senderId}:${createdAt}:${content}`,
    content,
    createdAt,
    // chatId: backend sends flat "chat_id" field
    chatId:    stringValue(raw.chatId, raw.chat_id, senderObj.chat_id),
    sender: {
      _id: senderId,
      username: stringValue(senderObj.username) || "Unknown",
      photo: stringValue(senderObj.photo) || undefined,
    },
  };
};

// ─── Component ───────────────────────────────────────────────
const Messages = () => {
  const { id: chatId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [messages,        setMessages]        = useState<Message[]>([]);
  const [newMessage,      setNewMessage]      = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const messagesEndRef       = useRef<HTMLDivElement>(null);
  const currentChatIdRef     = useRef<string>("");

  // ── Scroll helpers ──────────────────────────────────────
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom();
  }, [loading, messages]);

  // ── Socket setup ────────────────────────────────────────
  useEffect(() => {
    if (!user?._id) return;
    const joinCurrentChat = () => {
      if (chatId) socket.emit("join chat", chatId);
    };
    socket.on("connect", joinCurrentChat);
    socket.on("connected", joinCurrentChat);
    socket.connect();
    if (socket.connected) joinCurrentChat();
    return () => {
      socket.off("connect", joinCurrentChat);
      socket.off("connected", joinCurrentChat);
    };
  }, [chatId, user?._id]);

  // ── Inbound socket messages ─────────────────────────────
  useEffect(() => {
    const onReceived = (raw: unknown) => {
      const msg = normalizeMessage(raw);
      // Accept the message if chatId matches OR if it has no chatId (older server versions)
      if (msg.chatId && msg.chatId !== currentChatIdRef.current) return;
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    };
    socket.on("message received", onReceived);
    return () => { socket.off("message received", onReceived); };
  }, []);

  // ── Fetch messages on chatId change ────────────────────
  useEffect(() => {
    if (!chatId) return;
    currentChatIdRef.current = chatId;
    setMessages([]);
    setError(null);
    setLoading(true);

    api.get(`/messages/${chatId}`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setMessages(data.map(normalizeMessage));
      })
      .catch(err => {
        console.error("[Messages] fetch error:", err);
        setError(err?.response?.data?.error ?? "Failed to load messages.");
      })
      .finally(() => setLoading(false));
  }, [chatId]);

  // ── Send message ────────────────────────────────────────
  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || !chatId) return;

    const optimistic: Message = {
      _id: crypto.randomUUID(),
      content,
      chatId,
      createdAt: new Date().toISOString(),
      sender: { _id: user?._id ?? "", username: user?.username ?? "You", photo: user?.photo },
    };

    setMessages(prev => [...prev, optimistic]);
    setNewMessage("");

    try {
      const res = await api.post("/messages", { content, chatId });
      const confirmed = normalizeMessage(res.data);
      setMessages(prev => prev.map(m => m._id === optimistic._id ? confirmed : m));
      socket.emit("new message", { ...confirmed, chat_id: confirmed.chatId });
    } catch (err: unknown) {
      console.error("[Messages] send error:", err);
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      toast.error("Message could not be sent. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Group by date ───────────────────────────────────────
  const groups: Record<string, Message[]> = {};
  messages.forEach(m => {
    const d = new Date(m.createdAt).toLocaleDateString();
    (groups[d] ??= []).push(m);
  });

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-[#0B0D10] to-[#0d1017] min-h-0">

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar min-h-0">

        {/* Loading */}
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true);
                api.get(`/messages/${chatId}`)
                  .then(r => setMessages((Array.isArray(r.data) ? r.data : []).map(normalizeMessage)))
                  .catch(e => setError(e?.response?.data?.error ?? "Failed to load messages."))
                  .finally(() => setLoading(false));
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <MessageCircle className="w-7 h-7 text-gray-600" />
            </div>
            <p className="font-medium text-gray-300">No messages yet</p>
            <p className="text-sm">Be the first to start the conversation!</p>
          </div>
        )}

        {/* Messages grouped by date */}
        {!loading && !error && Object.entries(groups).map(([date, msgs]) => (
          <div key={date}>
            {/* Date divider */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">{date}</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <AnimatePresence initial={false}>
              {msgs.map((msg, idx) => {
                const isOwn = msg.sender._id === user?._id;
                const prev = idx > 0 ? msgs[idx - 1] : null;
                const isConsecutive = !!prev &&
                  prev.sender._id === msg.sender._id &&
                  new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;

                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex group ${isOwn ? "justify-end" : "justify-start"} ${isConsecutive ? "mt-1" : "mt-5"} px-2`}
                  >
                    <div className={`flex max-w-[75%] items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>

                      {/* Avatar */}
                      {!isOwn && (
                        <div className={`w-8 h-8 shrink-0 ${isConsecutive ? "invisible" : ""}`}>
                          <Avatar className="w-full h-full border border-white/10">
                            <AvatarImage src={msg.sender.photo ?? ""} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-xs text-white">
                              {msg.sender.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}

                      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                        {/* Sender + time */}
                        {!isConsecutive && (
                          <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                            <span className="text-[13px] font-semibold text-gray-200">{msg.sender.username}</span>
                            <span className="text-[11px] text-gray-500">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        )}

                        {/* Bubble */}
                        <div className="relative group/bubble">
                          {/* Hover actions */}
                          {isOwn && (
                            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex gap-1">
                              <Button disabled title="Reactions coming soon" variant="ghost" size="icon" className="w-6 h-6 bg-[#1A1D24] rounded border border-white/5"><Smile className="w-3 h-3" /></Button>
                              <Button disabled title="Message actions coming soon" variant="ghost" size="icon" className="w-6 h-6 bg-[#1A1D24] rounded border border-white/5"><MoreHorizontal className="w-3 h-3" /></Button>
                            </div>
                          )}
                          {!isOwn && (
                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex gap-1">
                              <Button disabled title="Reactions coming soon" variant="ghost" size="icon" className="w-6 h-6 bg-[#1A1D24] rounded border border-white/5"><Smile className="w-3 h-3" /></Button>
                              <Button disabled title="Message actions coming soon" variant="ghost" size="icon" className="w-6 h-6 bg-[#1A1D24] rounded border border-white/5"><MoreHorizontal className="w-3 h-3" /></Button>
                            </div>
                          )}

                          <div className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed break-words ${
                            isOwn
                              ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-tr-sm"
                              : "bg-[#1C1F26] text-gray-100 rounded-tl-sm border border-white/5"
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}

        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* ── Composer ── */}
      <div className="shrink-0 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#15181E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
            <div className="flex items-end px-2 py-2 gap-1">
              <Button disabled title="Attachments coming soon" variant="ghost" size="icon" className="w-9 h-9 rounded-xl shrink-0">
                <PlusCircle className="w-5 h-5" />
              </Button>

              <textarea
                placeholder="Message workspace…"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!chatId || loading}
                rows={1}
                className="flex-1 min-h-[44px] max-h-32 bg-transparent text-white placeholder-gray-500 px-2 py-3 text-[15px] resize-none outline-none disabled:opacity-50 leading-relaxed custom-scrollbar"
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
                }}
              />

              <div className="flex items-center gap-1 shrink-0">
                <Button disabled title="Mentions coming soon" variant="ghost" size="icon" className="w-9 h-9 rounded-xl"><AtSign className="w-5 h-5" /></Button>
                <Button disabled title="Emoji picker coming soon" variant="ghost" size="icon" className="w-9 h-9 rounded-xl"><Smile className="w-5 h-5" /></Button>
                <div className="w-px h-5 bg-white/10 mx-1" />
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || !chatId || loading}
                  className={`w-9 h-9 rounded-xl transition-all ${
                    newMessage.trim()
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-white/5 text-gray-500"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Footer bar */}
            <div className="bg-black/20 px-4 py-1.5 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button disabled title="AI assistant coming soon" className="flex items-center text-xs text-gray-600 gap-1 cursor-not-allowed">
                  <Bot className="w-3.5 h-3.5" /> Ask AI
                </button>
                <button disabled title="Attachments coming soon" className="flex items-center text-xs text-gray-600 gap-1 cursor-not-allowed">
                  <Paperclip className="w-3.5 h-3.5" /> Attach
                </button>
                <button disabled title="Voice messages coming soon" className="flex items-center text-xs text-gray-600 gap-1 cursor-not-allowed">
                  <Mic className="w-3.5 h-3.5" /> Voice
                </button>
              </div>
              <span className="text-[10px] text-gray-600">
                <strong className="text-gray-400">Shift+Enter</strong> new line
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
