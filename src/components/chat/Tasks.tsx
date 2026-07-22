import { useCallback, useEffect, useMemo, useState } from "react";
import { format, isPast } from "date-fns";
import { CalendarDays, CheckCircle2, ChevronRight, Circle, Clock3, Loader2, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import type { WorkspaceTask } from "@/types";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

type Member = { id: string; username: string; photo?: string; role?: "owner" | "admin" | "member" };
type Props = { chatId: string; members: Member[]; currentUserId?: string; canManage: boolean };

const columns: Array<{ status: WorkspaceTask["status"]; label: string; icon: typeof Circle }> = [
  { status: "todo", label: "To do", icon: Circle },
  { status: "in_progress", label: "In progress", icon: Clock3 },
  { status: "done", label: "Done", icon: CheckCircle2 },
];
const priorityStyle: Record<WorkspaceTask["priority"], string> = {
  low: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  medium: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  high: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
};

export default function Tasks({ chatId, members, currentUserId, canManage }: Props) {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<"all" | WorkspaceTask["priority"]>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", priority: "medium" as WorkspaceTask["priority"], dueAt: "", assigneeId: "" });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ tasks: WorkspaceTask[] }>(`/tasks/${chatId}`);
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (error: unknown) { toast.error(getApiErrorMessage(error, "Tasks could not be loaded.")); }
    finally { setLoading(false); }
  }, [chatId]);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const filtered = useMemo(() => tasks.filter((task) => {
    const matchesQuery = !query.trim() || `${task.title} ${task.description} ${task.assignee?.username ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (priority === "all" || task.priority === priority);
  }), [priority, query, tasks]);

  const createTask = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post<{ task: WorkspaceTask }>("/tasks", { chatId, title: draft.title.trim(), description: draft.description.trim(), priority: draft.priority, dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : null, assigneeId: draft.assigneeId || null });
      setTasks((current) => [data.task, ...current]);
      setDraft({ title: "", description: "", priority: "medium", dueAt: "", assigneeId: "" });
      setCreateOpen(false);
      toast.success("Task created.");
    } catch (error: unknown) { toast.error(getApiErrorMessage(error, "Task could not be created.")); }
    finally { setSaving(false); }
  };

  const updateStatus = async (task: WorkspaceTask, status: WorkspaceTask["status"]) => {
    const previous = tasks;
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status, completedAt: status === "done" ? new Date().toISOString() : null } : item));
    try {
      const { data } = await api.patch<{ task: WorkspaceTask }>(`/tasks/${task.id}`, { status });
      setTasks((current) => current.map((item) => item.id === task.id ? data.task : item));
    } catch (error: unknown) { setTasks(previous); toast.error(getApiErrorMessage(error, "Task status could not be updated.")); }
  };

  const deleteTask = async (task: WorkspaceTask) => {
    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks((current) => current.filter((item) => item.id !== task.id));
      toast.success("Task deleted.");
    } catch (error: unknown) { toast.error(getApiErrorMessage(error, "Task could not be deleted.")); }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="border-b border-border bg-surface/75 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold tracking-tight">Workspace tasks</h1><p className="mt-1 text-sm text-muted-foreground">Assign work, track progress, and keep deadlines visible.</p></div><Button onClick={() => setCreateOpen(true)} className="rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground shadow-lg shadow-primary/20"><Plus /> New task</Button></div>
        <div className="mx-auto mt-5 flex max-w-7xl flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks or assignees" className="h-10 w-full rounded-xl border border-border bg-background/65 pl-9 pr-3 text-sm outline-none focus:border-primary" /></div><select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} className="h-10 rounded-xl border border-border bg-background px-3 text-sm"><option value="all">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
      </header>

      <div className="flex-1 overflow-auto p-5 sm:p-7">
        {loading ? <div className="grid h-full place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">{columns.map(({ status, label, icon: Icon }) => { const columnTasks = filtered.filter((task) => task.status === status); return <section key={status} className="min-h-72 rounded-2xl border border-border bg-surface/60 p-3 shadow-sm"><div className="mb-3 flex items-center justify-between px-2 py-1"><h2 className="flex items-center gap-2 text-sm font-bold"><Icon className={`h-4 w-4 ${status === "done" ? "text-emerald-500" : status === "in_progress" ? "text-amber-500" : "text-muted-foreground"}`} />{label}</h2><span className="rounded-full bg-elevated px-2 py-0.5 text-xs font-semibold text-muted-foreground">{columnTasks.length}</span></div><div className="space-y-3">{columnTasks.map((task) => { const canEdit = canManage || task.createdById === currentUserId || task.assigneeId === currentUserId; const overdue = task.dueAt && task.status !== "done" && isPast(new Date(task.dueAt)); return <article key={task.id} className="group rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${priorityStyle[task.priority]}`}>{task.priority}</span><h3 className={`mt-2 font-semibold leading-5 ${task.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.title}</h3></div>{(canManage || task.createdById === currentUserId) && <button onClick={() => void deleteTask(task)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100" title="Delete task"><Trash2 className="h-3.5 w-3.5" /></button>}</div>{task.description && <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{task.description}</p>}<div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">{task.assignee && <span className="flex items-center gap-1 rounded-full bg-elevated px-2 py-1"><UserRound className="h-3 w-3" />{task.assignee.username}</span>}{task.dueAt && <span className={`flex items-center gap-1 rounded-full px-2 py-1 ${overdue ? "bg-red-500/10 font-semibold text-red-600 dark:text-red-300" : "bg-elevated"}`}><CalendarDays className="h-3 w-3" />{format(new Date(task.dueAt), "MMM d, h:mm a")}</span>}</div>{canEdit && <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">{columns.filter((column) => column.status !== status).map((column) => <button key={column.status} onClick={() => void updateStatus(task, column.status)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-primary">Move to {column.label}<ChevronRight className="h-3 w-3" /></button>)}</div>}</article>; })}{columnTasks.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">No {label.toLowerCase()} tasks</div>}</div></section>; })}</div>}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="max-w-lg bg-surface"><DialogHeader><DialogTitle>Create a task</DialogTitle><DialogDescription>Add an owner and deadline so the next action is clear.</DialogDescription></DialogHeader><div className="space-y-4"><div><label className="mb-1.5 block text-sm font-semibold">Title</label><input autoFocus maxLength={160} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="auth-input" placeholder="What needs to be done?" /></div><div><label className="mb-1.5 block text-sm font-semibold">Description</label><textarea rows={3} maxLength={4000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" placeholder="Add useful context or acceptance criteria" /></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-semibold">Assignee</label><select value={draft.assigneeId} onChange={(event) => setDraft({ ...draft, assigneeId: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="">Unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.username}</option>)}</select></div><div><label className="mb-1.5 block text-sm font-semibold">Priority</label><select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as WorkspaceTask["priority"] })} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div></div><div><label className="mb-1.5 block text-sm font-semibold">Due date</label><input type="datetime-local" value={draft.dueAt} onChange={(event) => setDraft({ ...draft, dueAt: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></div></div><DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}><X /> Cancel</Button><Button disabled={saving || !draft.title.trim()} onClick={() => void createTask()}>{saving && <Loader2 className="animate-spin" />} Create task</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
