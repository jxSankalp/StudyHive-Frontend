import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDays,
  addHours,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Video,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";
import type { ApiChat, CalendarEvent, CalendarEventColor, Meeting } from "@/types";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/theme";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CalendarPageProps = { chatId?: string };
type WorkspaceOption = { id: string; name: string };

type EventDraft = {
  title: string;
  description: string;
  location: string;
  chatId: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  color: CalendarEventColor;
  meetingId: string;
};

const COLORS: Array<{ value: CalendarEventColor; label: string; dot: string }> = [
  { value: "indigo", label: "Indigo", dot: "bg-indigo-500" },
  { value: "emerald", label: "Emerald", dot: "bg-emerald-500" },
  { value: "amber", label: "Amber", dot: "bg-amber-500" },
  { value: "rose", label: "Rose", dot: "bg-rose-500" },
  { value: "sky", label: "Sky", dot: "bg-sky-500" },
  { value: "violet", label: "Violet", dot: "bg-violet-500" },
];

const EVENT_STYLES: Record<CalendarEventColor, string> = {
  indigo: "border-indigo-400/70 bg-indigo-200/80 !text-indigo-950 dark:border-indigo-400/45 dark:bg-indigo-500/25 dark:!text-indigo-50",
  emerald: "border-emerald-400/70 bg-emerald-200/80 !text-emerald-950 dark:border-emerald-400/45 dark:bg-emerald-500/25 dark:!text-emerald-50",
  amber: "border-amber-400/75 bg-amber-200/85 !text-amber-950 dark:border-amber-400/45 dark:bg-amber-500/25 dark:!text-amber-50",
  rose: "border-rose-400/70 bg-rose-200/80 !text-rose-950 dark:border-rose-400/45 dark:bg-rose-500/25 dark:!text-rose-50",
  sky: "border-sky-400/70 bg-sky-200/80 !text-sky-950 dark:border-sky-400/45 dark:bg-sky-500/25 dark:!text-sky-50",
  violet: "border-violet-400/70 bg-violet-200/80 !text-violet-950 dark:border-violet-400/45 dark:bg-violet-500/25 dark:!text-violet-50",
};

const toLocalDateTime = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");
const toLocalDate = (date: Date) => format(date, "yyyy-MM-dd");

const createDraft = (day: Date, selectedChatId = ""): EventDraft => {
  const now = new Date();
  const base = isSameDay(day, now) && now > day
    ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.min(now.getHours() + 1, 23))
    : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9);
  return {
    title: "",
    description: "",
    location: "",
    chatId: selectedChatId,
    startsAt: toLocalDateTime(base),
    endsAt: toLocalDateTime(addHours(base, 1)),
    allDay: false,
    color: "indigo",
    meetingId: "",
  };
};

const eventToDraft = (event: CalendarEvent): EventDraft => ({
  title: event.title,
  description: event.description,
  location: event.location,
  chatId: event.chatId,
  startsAt: event.allDay ? toLocalDate(new Date(event.startsAt)) : toLocalDateTime(new Date(event.startsAt)),
  endsAt: event.allDay
    ? toLocalDate(subDays(new Date(event.endsAt), 1))
    : toLocalDateTime(new Date(event.endsAt)),
  allDay: event.allDay,
  color: event.color,
  meetingId: event.meetingId ?? "",
});

export default function CalendarPage({ chatId }: CalendarPageProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(chatId ?? "all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [draft, setDraft] = useState<EventDraft>(() => createDraft(new Date(), chatId));
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const rangeStart = useMemo(() => startOfWeek(startOfMonth(currentMonth)), [currentMonth]);
  const rangeEnd = useMemo(() => endOfWeek(endOfMonth(currentMonth)), [currentMonth]);
  const days = useMemo(
    () => eachDayOfInterval({ start: rangeStart, end: rangeEnd }),
    [rangeStart, rangeEnd]
  );

  const loadWorkspaces = useCallback(async () => {
    const { data } = await api.get<{ chats: ApiChat[] }>("/chat");
    const options = (data.chats ?? []).map((workspace) => ({
      id: workspace.id,
      name: workspace.chat_name,
    }));
    setWorkspaces(options);
    if (chatId && !options.some((workspace) => workspace.id === chatId)) {
      setLoadError("This workspace is no longer available.");
    }
  }, [chatId]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const activeChatId = chatId ?? (selectedWorkspace === "all" ? undefined : selectedWorkspace);
      const { data } = await api.get<{ events: CalendarEvent[] }>("/calendar", {
        params: {
          start: rangeStart.toISOString(),
          end: addDays(rangeEnd, 1).toISOString(),
          chatId: activeChatId,
        },
      });
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      setEvents([]);
      setLoadError(getApiErrorMessage(error, "Calendar events could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [chatId, rangeEnd, rangeStart, selectedWorkspace]);

  useEffect(() => {
    void loadWorkspaces().catch((error) =>
      setLoadError(getApiErrorMessage(error, "Workspaces could not be loaded."))
    );
  }, [loadWorkspaces]);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  useEffect(() => {
    if (!modalOpen || !draft.chatId) {
      setMeetings([]);
      return;
    }
    void api.get<Meeting[]>(`/meet/${draft.chatId}`)
      .then(({ data }) => setMeetings((data ?? []).filter((meeting) => meeting.status !== "ended")))
      .catch(() => setMeetings([]));
  }, [draft.chatId, modalOpen]);

  const eventsForDay = useCallback(
    (day: Date) => events.filter((event) => {
      const start = startOfDay(new Date(event.startsAt));
      const inclusiveEnd = event.allDay
        ? startOfDay(subDays(new Date(event.endsAt), 1))
        : startOfDay(new Date(event.endsAt));
      return day >= start && day <= inclusiveEnd;
    }),
    [events]
  );

  const upcomingEvents = useMemo(() => events
    .filter((event) => new Date(event.endsAt) >= new Date())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 6), [events]);

  const openCreate = (day = new Date()) => {
    const defaultChat = chatId ?? (selectedWorkspace !== "all" ? selectedWorkspace : workspaces[0]?.id ?? "");
    setEditingEvent(null);
    setDraft(createDraft(day, defaultChat));
    setModalOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setDraft(eventToDraft(event));
    setModalOpen(true);
  };

  const toggleAllDay = (checked: boolean) => {
    setDraft((current) => ({
      ...current,
      allDay: checked,
      startsAt: checked ? current.startsAt.slice(0, 10) : `${current.startsAt.slice(0, 10)}T09:00`,
      endsAt: checked ? current.endsAt.slice(0, 10) : `${current.endsAt.slice(0, 10)}T10:00`,
    }));
  };

  const saveEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.chatId) {
      toast.error("Choose a workspace first.");
      return;
    }
    const start = new Date(draft.allDay ? `${draft.startsAt}T00:00:00` : draft.startsAt);
    const end = draft.allDay
      ? addDays(new Date(`${draft.endsAt}T00:00:00`), 1)
      : new Date(draft.endsAt);
    if (!draft.title.trim() || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      toast.error("Enter a title and a valid end time after the start time.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...draft,
        title: draft.title.trim(),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        meetingId: draft.meetingId || null,
      };
      if (editingEvent) await api.put(`/calendar/${editingEvent.id}`, payload);
      else await api.post("/calendar", payload);
      toast.success(editingEvent ? "Event updated." : "Event added to the calendar.");
      setModalOpen(false);
      await loadEvents();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Calendar event could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async () => {
    if (!editingEvent || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/calendar/${editingEvent.id}`);
      toast.success("Event deleted.");
      setModalOpen(false);
      await loadEvents();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Calendar event could not be deleted."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-full bg-background p-4 sm:p-6 lg:p-8">
      <Toaster richColors theme={theme} />
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
              <CalendarDays className="h-4 w-4" /> StudyHive Calendar
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Plan your work clearly</h1>
            <p className="mt-2 text-muted-foreground">Events, meetings, and deadlines across your workspaces.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!chatId && (
              <select
                value={selectedWorkspace}
                onChange={(event) => setSelectedWorkspace(event.target.value)}
                className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-foreground shadow-sm"
              >
                <option value="all">All workspaces</option>
                {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
              </select>
            )}
            <Button variant="outline" className="rounded-xl" onClick={() => { setCurrentMonth(startOfMonth(new Date())); }}>
              Today
            </Button>
            <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20" onClick={() => openCreate()} disabled={workspaces.length === 0}>
              <Plus className="h-4 w-4" /> New event
            </Button>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            <span>{loadError}</span>
            <button onClick={() => void loadEvents()} className="inline-flex items-center gap-1 font-semibold"><RefreshCw className="h-4 w-4" /> Retry</button>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_18px_55px_-32px_rgba(37,55,95,0.35)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
              <h2 className="text-xl font-bold text-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentMonth((month) => subMonths(month, 1))} className="rounded-lg p-2 text-muted-foreground hover:bg-elevated hover:text-foreground" aria-label="Previous month"><ChevronLeft className="h-5 w-5" /></button>
                <button onClick={() => setCurrentMonth((month) => addMonths(month, 1))} className="rounded-lg p-2 text-muted-foreground hover:bg-elevated hover:text-foreground" aria-label="Next month"><ChevronRight className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-7 border-b border-border bg-elevated/60">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {days.map((day) => {
                    const dayEvents = eventsForDay(day);
                    return (
                      <div
                        key={day.toISOString()}
                        role="button"
                        tabIndex={0}
                        onClick={() => openCreate(day)}
                        onKeyDown={(event) => { if (event.key === "Enter") openCreate(day); }}
                        className={`group min-h-32 border-b border-r border-border p-2 text-left align-top transition hover:bg-primary/[0.035] ${!isSameMonth(day, currentMonth) ? "bg-elevated/30 text-muted-foreground" : "bg-surface"}`}
                      >
                        <span className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${isToday(day) ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "text-foreground group-hover:bg-elevated"}`}>
                          {format(day, "d")}
                        </span>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((calendarEvent) => (
                            <button
                              type="button"
                              key={calendarEvent.id}
                              onClick={(clickEvent) => { clickEvent.stopPropagation(); openEdit(calendarEvent); }}
                              className={`block w-full truncate rounded-md border px-2 py-1 text-left text-xs font-bold leading-4 shadow-sm transition hover:brightness-[0.97] ${EVENT_STYLES[calendarEvent.color]}`}
                              title={`${calendarEvent.title} — ${calendarEvent.workspace.name}`}
                            >
                              {!calendarEvent.allDay && <span className="mr-1 font-extrabold tabular-nums">{format(new Date(calendarEvent.startsAt), "HH:mm")}</span>}
                              {calendarEvent.title}
                            </button>
                          ))}
                          {dayEvents.length > 3 && <span className="block px-1 text-xs font-semibold text-muted-foreground">+{dayEvents.length - 3} more</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>}
          </section>

          <aside className="rounded-2xl border border-border bg-surface p-5 shadow-[0_18px_55px_-32px_rgba(37,55,95,0.35)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-foreground">Coming up</h2>
                <p className="text-xs text-muted-foreground">This calendar view</p>
              </div>
              <Clock3 className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-elevated/40 px-4 py-10 text-center">
                  <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-semibold text-foreground">Your schedule is clear</p>
                  <p className="mt-1 text-xs text-muted-foreground">Add an event to start planning.</p>
                </div>
              ) : upcomingEvents.map((calendarEvent) => (
                <button key={calendarEvent.id} onClick={() => openEdit(calendarEvent)} className="w-full rounded-xl border border-border bg-background/60 p-3 text-left transition hover:border-primary/30 hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-9 w-1 rounded-full ${COLORS.find((color) => color.value === calendarEvent.color)?.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{calendarEvent.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{calendarEvent.allDay ? format(new Date(calendarEvent.startsAt), "EEE, MMM d · All day") : format(new Date(calendarEvent.startsAt), "EEE, MMM d · h:mm a")}</p>
                      <p className="mt-1 truncate text-xs font-medium text-primary">{calendarEvent.workspace.name}</p>
                    </div>
                    {calendarEvent.canManage && <Pencil className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!saving && !deleting) setModalOpen(open); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-surface sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? (editingEvent.canManage ? "Edit calendar event" : "Calendar event") : "Create calendar event"}</DialogTitle>
            <DialogDescription>{editingEvent ? (editingEvent.canManage ? "Update the shared event details." : "This event is shared with your workspace.") : "Add an event visible to everyone in the workspace."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEvent} className="space-y-5">
            <fieldset disabled={Boolean(editingEvent && !editingEvent.canManage)} className="space-y-5 disabled:opacity-80">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Title</label>
              <input autoFocus maxLength={120} required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-foreground" placeholder="Study session, deadline, presentation…" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Workspace</label>
                <select disabled={Boolean(editingEvent) || Boolean(chatId)} value={draft.chatId} onChange={(event) => setDraft({ ...draft, chatId: event.target.value, meetingId: "" })} className="h-10 w-full rounded-xl border border-border bg-background px-3 disabled:opacity-70" required>
                  <option value="">Choose workspace</option>
                  {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Linked meeting <span className="font-normal text-muted-foreground">(optional)</span></label>
                <select value={draft.meetingId} onChange={(event) => setDraft({ ...draft, meetingId: event.target.value })} className="h-10 w-full rounded-xl border border-border bg-background px-3">
                  <option value="">No linked meeting</option>
                  {meetings.filter((meeting) => meeting.meetingDbId).map((meeting) => <option key={meeting.meetingDbId} value={meeting.meetingDbId}>{meeting.name}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={draft.allDay} onChange={(event) => toggleAllDay(event.target.checked)} className="h-4 w-4 rounded border-border accent-primary" /> All-day event
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-sm font-semibold">Starts</label><input type={draft.allDay ? "date" : "datetime-local"} required value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} className="h-10 w-full rounded-xl border border-border bg-background px-3" /></div>
              <div><label className="mb-1.5 block text-sm font-semibold">Ends</label><input type={draft.allDay ? "date" : "datetime-local"} required value={draft.endsAt} min={draft.startsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })} className="h-10 w-full rounded-xl border border-border bg-background px-3" /></div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Color</label>
              <div className="flex flex-wrap gap-2">{COLORS.map((color) => <button type="button" key={color.value} onClick={() => setDraft({ ...draft, color: color.value })} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${draft.color === color.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}><span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />{color.label}</button>)}</div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Location</label>
              <div className="relative"><MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input maxLength={200} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3" placeholder="Library, Room 204, online…" /></div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Notes</label>
              <textarea maxLength={2000} rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="w-full resize-none rounded-xl border border-border bg-background p-3" placeholder="Add context, preparation notes, or an agenda." />
            </div>
            </fieldset>
            {editingEvent?.meeting && editingEvent.meeting.status !== "ended" && (
              <button type="button" onClick={() => navigate(`/meeting/${editingEvent.meeting?.callId}`)} className="flex w-full items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                <span className="inline-flex items-center gap-2"><Video className="h-4 w-4" /> Join {editingEvent.meeting.name}</span><ExternalLink className="h-4 w-4" />
              </button>
            )}
            <DialogFooter className="items-center border-t border-border pt-4">
              {editingEvent?.canManage && <Button type="button" variant="outline" onClick={deleteEvent} disabled={deleting || saving} className="mr-auto border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300"><Trash2 className="h-4 w-4" />{deleting ? "Deleting…" : "Delete"}</Button>}
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving || deleting}>Cancel</Button>
              {(!editingEvent || editingEvent.canManage) && <Button type="submit" disabled={saving || deleting}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editingEvent ? "Save changes" : "Create event"}</Button>}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
