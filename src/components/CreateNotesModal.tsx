import { useState } from "react";
import { useParams } from "react-router-dom";
import { Check, FilePlus2, FileText, Loader2, Sparkles, X } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";
import { toast } from "sonner";

interface CreateNotesModalProps {
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
}

const templates = [
  { id: "blank", label: "Blank", icon: FileText, content: "" },
  { id: "study", label: "Study notes", icon: Sparkles, content: "# Topic\n\n## Key ideas\n\n- \n\n## Questions\n\n- [ ] \n\n## Summary\n\n" },
  { id: "meeting", label: "Session notes", icon: FilePlus2, content: "# Study session\n\n## Goals\n\n- [ ] \n\n## Discussion\n\n\n## Decisions\n\n- \n\n## Next steps\n\n- [ ] \n" },
  { id: "revision", label: "Revision", icon: Check, content: "# Revision checklist\n\n## Must know\n\n- [ ] \n\n## Practice\n\n- [ ] \n\n## Review later\n\n- [ ] \n" },
];

export default function CreateNotesModal({ showModal, setShowModal, setRefreshKey }: CreateNotesModalProps) {
  const { id: chatId } = useParams();
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("blank");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const close = () => {
    setShowModal(false);
    setName("");
    setTemplateId("blank");
    setTagInput("");
    setTags([]);
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!tag || tags.includes(tag)) { setTagInput(""); return; }
    if (tag.length > 24 || tags.length >= 10) { toast.error("Use up to 10 tags, each 24 characters or fewer."); return; }
    setTags((current) => [...current, tag]);
    setTagInput("");
  };

  const handleCreateNote = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!chatId) { toast.error("Open a workspace before creating a note."); return; }
    if (!cleanName) { toast.error("Please enter a note name."); return; }
    setCreating(true);
    try {
      const template = templates.find((candidate) => candidate.id === templateId) ?? templates[0];
      const pendingTag = tagInput.trim().replace(/^#/, "").toLowerCase();
      const submittedTags = pendingTag && pendingTag.length <= 24 && !tags.includes(pendingTag) ? [...tags, pendingTag] : tags;
      await api.post("/notes", { name: cleanName, content: template.content, chatId, tags: submittedTags });
      toast.success("Note created.");
      setRefreshKey((previous) => previous + 1);
      close();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to create note."));
    } finally { setCreating(false); }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="new-note-title" className="page-enter relative w-full max-w-xl rounded-3xl border border-border bg-surface p-6 shadow-2xl shadow-black/20 sm:p-8">
        <button onClick={close} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-elevated hover:text-foreground" aria-label="Close"><X className="h-4 w-4" /></button>
        <div className="mb-6 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-cyan-400/10 text-primary"><FilePlus2 className="h-5 w-5" /></span><div><h2 id="new-note-title" className="text-2xl font-bold tracking-tight">Create a note</h2><p className="text-sm text-muted-foreground">Start blank or use a practical structure.</p></div></div>
        <form onSubmit={handleCreateNote} className="space-y-5">
          <div><label htmlFor="note-name" className="mb-2 block text-sm font-semibold">Name</label><input id="note-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="e.g. Calculus chapter 4" className="auth-input" /></div>
          <fieldset><legend className="mb-2 text-sm font-semibold">Template</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{templates.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTemplateId(id)} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${templateId === id ? "border-primary/40 bg-primary/10 text-primary shadow-sm" : "border-border bg-background/55 text-muted-foreground hover:border-primary/25 hover:text-foreground"}`}><Icon className="h-5 w-5" />{label}</button>)}</div></fieldset>
          <div><label htmlFor="note-tags" className="mb-2 block text-sm font-semibold">Tags <span className="font-normal text-muted-foreground">(optional)</span></label><div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background/60 p-2 focus-within:border-primary">{tags.map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">#{tag}<button type="button" onClick={() => setTags((current) => current.filter((value) => value !== tag))} aria-label={`Remove ${tag}`}><X className="h-3 w-3" /></button></span>)}<input id="note-tags" value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTag(); } }} onBlur={addTag} placeholder={tags.length ? "Add another" : "Add a tag and press Enter"} className="h-7 min-w-36 flex-1 bg-transparent px-1 text-sm outline-none" /></div></div>
          <button type="submit" disabled={creating || !name.trim()} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-50">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />} {creating ? "Creating…" : "Create note"}</button>
        </form>
      </div>
    </div>
  );
}
