import { useEffect, useState } from "react";
import { Bell, CalendarDays, Check, Clock3, Loader2, Users, Video } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";
import { toast } from "sonner";

type Member = { id: string; username: string; photo?: string; role?: "owner" | "admin" | "member" };
type Props = { chatId: string; members?: Member[]; onSuccess?: () => void; open: boolean; onOpenChange: (open: boolean) => void };

const defaultSchedule = () => {
  const date = new Date(Date.now() + 60 * 60_000);
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

export default function CreateMeetingModal({ chatId, members = [], onSuccess, open, onOpenChange }: Props) {
  const [meetName, setMeetName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"now" | "later">("later");
  const [scheduledAt, setScheduledAt] = useState(defaultSchedule);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && participantIds.length === 0 && members.length) setParticipantIds(members.map((member) => member.id));
  }, [members, open, participantIds.length]);

  const reset = () => {
    setMeetName(""); setDescription(""); setMode("later"); setScheduledAt(defaultSchedule());
    setDurationMinutes(30); setParticipantIds([]); setNotify(true);
  };

  const handleOpenChange = (nextOpen: boolean) => { if (!nextOpen && !loading) reset(); onOpenChange(nextOpen); };

  const createMeeting = async () => {
    const name = meetName.trim();
    if (!chatId) { toast.error("Missing workspace. Please reopen it."); return; }
    if (!name) { toast.error("Enter a meeting name."); return; }
    if (participantIds.length === 0) { toast.error("Invite at least one workspace member."); return; }
    const date = mode === "now" ? new Date() : new Date(scheduledAt);
    if (Number.isNaN(date.getTime()) || (mode === "later" && date.getTime() < Date.now())) { toast.error("Choose a future meeting time."); return; }
    setLoading(true);
    try {
      await api.post("/meet/create-call", { chatId, meetName: name, description: description.trim(), scheduledAt: date.toISOString(), durationMinutes, participantIds, notify });
      toast.success(mode === "now" ? "Meeting room created." : "Meeting scheduled and invitees notified.");
      reset(); onOpenChange(false); onSuccess?.();
    } catch (error: unknown) { toast.error(getApiErrorMessage(error, "Meeting could not be created.")); }
    finally { setLoading(false); }
  };

  const allSelected = members.length > 0 && participantIds.length === members.length;
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-3xl border-border bg-surface shadow-2xl">
        <DialogHeader><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-400/10 text-emerald-600 dark:text-emerald-300"><Video className="h-5 w-5" /></span><div><DialogTitle>Plan a meeting</DialogTitle><DialogDescription className="mt-1">Create a room now or schedule it for your group.</DialogDescription></div></div></DialogHeader>
        <div className="mt-2 space-y-5">
          <div className="grid grid-cols-2 rounded-xl border border-border bg-elevated/60 p-1"><button onClick={() => setMode("now")} className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition ${mode === "now" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"}`}><Video className="h-4 w-4" /> Start now</button><button onClick={() => setMode("later")} className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition ${mode === "later" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"}`}><CalendarDays className="h-4 w-4" /> Schedule</button></div>
          <div><label className="mb-1.5 block text-sm font-semibold">Meeting name</label><input autoFocus value={meetName} onChange={(event) => setMeetName(event.target.value)} maxLength={100} className="auth-input" placeholder="Weekly revision, project sync…" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold">Description <span className="font-normal text-muted-foreground">(optional)</span></label><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={3} className="w-full resize-none rounded-xl border border-border bg-background/70 p-3 text-sm outline-none focus:border-primary" placeholder="Agenda, preparation, or useful context" /></div>
          <div className="grid gap-4 sm:grid-cols-2">{mode === "later" && <div><label className="mb-1.5 block text-sm font-semibold">Date and time</label><div className="relative"><CalendarDays className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input type="datetime-local" value={scheduledAt} min={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0,16)} onChange={(event) => setScheduledAt(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm" /></div></div>}<div className={mode === "now" ? "sm:col-span-2" : ""}><label className="mb-1.5 block text-sm font-semibold">Duration</label><div className="relative"><Clock3 className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="h-11 w-full appearance-none rounded-xl border border-border bg-background pl-9 pr-3 text-sm"><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>1 hour</option><option value={90}>1.5 hours</option><option value={120}>2 hours</option></select></div></div></div>
          <div><div className="mb-2 flex items-center justify-between"><label className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary" /> Invite people</label><button type="button" onClick={() => setParticipantIds(allSelected ? [] : members.map((member) => member.id))} className="text-xs font-semibold text-primary">{allSelected ? "Clear all" : "Select all"}</button></div><div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border bg-background/55 p-2">{members.map((member) => { const selected = participantIds.includes(member.id); return <button key={member.id} type="button" onClick={() => setParticipantIds((current) => selected ? current.filter((id) => id !== member.id) : [...current, member.id])} className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${selected ? "bg-primary/10" : "hover:bg-elevated"}`}><span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-400/10 text-xs font-bold text-primary">{member.username.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-sm font-medium">{member.username}</span>{member.role && member.role !== "member" && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">{member.role}</span>}<span className={`grid h-5 w-5 place-items-center rounded-md border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{selected && <Check className="h-3 w-3" />}</span></button>; })}{members.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Loading workspace members…</p>}</div></div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-elevated/45 p-3"><input type="checkbox" checked={notify} onChange={(event) => setNotify(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" /><Bell className="mt-0.5 h-4 w-4 text-primary" /><span><span className="block text-sm font-semibold">Notify invitees</span><span className="mt-0.5 block text-xs text-muted-foreground">People receive an in-app notification with the meeting details.</span></span></label>
          <Button disabled={loading || !meetName.trim() || participantIds.length === 0} onClick={() => void createMeeting()} className="h-12 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-cyan-700">{loading ? <Loader2 className="animate-spin" /> : mode === "now" ? <Video /> : <CalendarDays />} {loading ? "Creating…" : mode === "now" ? "Create and start" : "Schedule meeting"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
