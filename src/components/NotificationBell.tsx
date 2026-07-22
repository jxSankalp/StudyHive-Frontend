import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CalendarClock, CheckCheck, ClipboardCheck, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axiosInstance";
import { socket } from "@/lib/socket";

type Notification = {
  id: string;
  chatId?: string | null;
  type: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  readAt?: string | null;
  createdAt: string;
};

const notificationIcon = (type: string) => {
  if (type.includes("meeting")) return CalendarClock;
  if (type.includes("task")) return ClipboardCheck;
  return MessageCircle;
};

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ notifications: Notification[] }>("/notifications");
      setNotifications(data.notifications);
    } catch (error) {
      console.error("[NotificationBell] failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const handleNotification = (notification: Notification & Record<string, unknown>) => {
      const normalized: Notification = {
        ...notification,
        chatId: notification.chatId ?? (notification.chat_id as string | undefined),
        entityType: notification.entityType ?? (notification.entity_type as string | undefined),
        entityId: notification.entityId ?? (notification.entity_id as string | undefined),
        readAt: notification.readAt ?? (notification.read_at as string | undefined),
        createdAt: notification.createdAt ?? (notification.created_at as string | undefined) ?? new Date().toISOString(),
      };
      setNotifications((current) => [normalized, ...current.filter((item) => item.id !== normalized.id)].slice(0, 50));
    };
    socket.on("notification:new", handleNotification);
    if (!socket.connected) socket.connect();
    return () => { socket.off("notification:new", handleNotification); };
  }, [loadNotifications]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.readAt).length, [notifications]);

  const markAllRead = async () => {
    const now = new Date().toISOString();
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? now })));
    try {
      await api.patch("/notifications/read-all");
    } catch {
      void loadNotifications();
    }
  };

  const openNotification = async (notification: Notification) => {
    setOpen(false);
    if (!notification.readAt) {
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
      void api.patch(`/notifications/${notification.id}/read`).catch(() => loadNotifications());
    }
    if (!notification.chatId) return;
    const tab = notification.entityType === "meeting" ? "meetings" : notification.entityType === "task" ? "tasks" : "chat";
    navigate(`/chat/${notification.chatId}?tab=${tab}`);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-elevated text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-muted"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <section className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-slate-900/15">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="font-semibold text-foreground">Notifications</h2>
                <p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</p>
              </div>
              {unreadCount > 0 && (
                <button type="button" onClick={() => void markAllRead()} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[28rem] overflow-y-auto p-2">
              {loading && notifications.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">Loading notifications…</p>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">Nothing new yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Meeting invitations and task assignments will appear here.</p>
                </div>
              ) : notifications.map((notification) => {
                const Icon = notificationIcon(notification.type);
                return (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => void openNotification(notification)}
                    className={`mb-1 flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-muted ${notification.readAt ? "" : "bg-primary/[0.07]"}`}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className="flex-1 text-sm font-semibold leading-5 text-foreground">{notification.title}</span>
                        {!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </span>
                      {notification.body && <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-muted-foreground">{notification.body}</span>}
                      <span className="mt-1 block text-[11px] font-medium text-muted-foreground">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
