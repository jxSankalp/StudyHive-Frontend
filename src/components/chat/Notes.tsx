import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bold, Check, CheckSquare, Clipboard, Code2, Download, FileText,
  Hash, Heading1, Italic, List, ListOrdered, Loader2, Pin, PinOff,
  Quote, Redo2, Save, Search, Tags, Trash2, Undo2, X,
} from "lucide-react";
import type { Note } from "@/types";
import { toast } from "sonner";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";
import { socket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { Button } from "../ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../ui/dialog";

type SaveState = "saved" | "unsaved" | "saving" | "error";

type NoteCardProps = {
  note: Note | null;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  setSelectedItem: (id: string | null) => void;
};

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const legacyMarkdownToHtml = (markdown: string) => markdown.split("\n").map((line) => {
  const inline = escapeHtml(line)
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
  if (inline.startsWith("### ")) return `<h3>${inline.slice(4)}</h3>`;
  if (inline.startsWith("## ")) return `<h2>${inline.slice(3)}</h2>`;
  if (inline.startsWith("# ")) return `<h1>${inline.slice(2)}</h1>`;
  if (inline.startsWith("> ")) return `<blockquote>${inline.slice(2)}</blockquote>`;
  if (!inline) return "<p><br></p>";
  return `<p>${inline}</p>`;
}).join("");

const sanitizeEditorHtml = (value: string) => {
  const documentNode = new DOMParser().parseFromString(value, "text/html");
  const allowed = new Set(["P", "DIV", "H1", "H2", "H3", "STRONG", "B", "EM", "I", "U", "S", "UL", "OL", "LI", "BLOCKQUOTE", "PRE", "CODE", "BR"]);
  const clean = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        if (!allowed.has(element.tagName)) {
          element.replaceWith(...Array.from(element.childNodes));
          continue;
        }
        for (const attribute of Array.from(element.attributes)) element.removeAttribute(attribute.name);
      }
      clean(child);
    }
  };
  clean(documentNode.body);
  return documentNode.body.innerHTML;
};

const toEditorHtml = (value: string) => sanitizeEditorHtml(/<\/?(?:p|div|h[1-6]|strong|em|ul|ol|li|blockquote|pre|code|br)\b/i.test(value) ? value : legacyMarkdownToHtml(value));

export default function Notes({ note, setRefreshKey, setSelectedItem }: NoteCardProps) {
  const { user } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);
  const contentSaveSequenceRef = useRef(0);
  const lastSavedContentRef = useRef("");
  const lastSavedTitleRef = useRef("");
  const contentRef = useRef("");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findCursor, setFindCursor] = useState(0);
  const [pendingRemote, setPendingRemote] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const plainText = useMemo(() => new DOMParser().parseFromString(content, "text/html").body.textContent ?? "", [content]);
  const words = useMemo(() => plainText.trim() ? plainText.trim().split(/\s+/).length : 0, [plainText]);
  const matchCount = useMemo(() => findQuery ? plainText.toLowerCase().split(findQuery.toLowerCase()).length - 1 : 0, [plainText, findQuery]);
  const draftKey = note?._id ? `studyhive-note-draft:${note._id}` : "";

  useEffect(() => {
    if (!note?._id) return;
    let initialContent = toEditorHtml(note.content || "");
    try {
      const stored = localStorage.getItem(`studyhive-note-draft:${note._id}`);
      if (stored) {
        const draft = JSON.parse(stored) as { content?: string; savedAt?: string };
        if (typeof draft.content === "string" && draft.content !== initialContent && new Date(draft.savedAt || 0) > new Date(note.updatedAt)) {
          initialContent = toEditorHtml(draft.content);
          toast.info("Recovered your unsaved note draft.");
        }
      }
    } catch { localStorage.removeItem(`studyhive-note-draft:${note._id}`); }

    setContent(initialContent);
    contentRef.current = initialContent;
    lastSavedContentRef.current = toEditorHtml(note.content || "");
    setTitle(note.name || "Untitled Note");
    lastSavedTitleRef.current = note.name || "Untitled Note";
    setTags(Array.isArray(note.tags) ? note.tags : []);
    setIsPinned(note.isPinned === true);
    setLastUpdated(note.updatedAt);
    setSaveState(initialContent === toEditorHtml(note.content || "") ? "saved" : "unsaved");
    setPendingRemote(null);
    setFindOpen(false);
    window.requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = initialContent;
    });
  }, [note?._id, note?.content, note?.isPinned, note?.name, note?.tags, note?.updatedAt]);

  useEffect(() => {
    if (!note?._id) return;
    const joinNote = () => socket.emit("note:join", note._id);
    socket.on("connect", joinNote);
    socket.on("connected", joinNote);
    socket.connect();
    if (socket.connected) joinNote();
    return () => {
      socket.emit("note:leave", note._id);
      socket.off("connect", joinNote);
      socket.off("connected", joinNote);
    };
  }, [note?._id]);

  const persist = async (updates: Record<string, unknown>, notify = false) => {
    if (!note?._id) return false;
    const savesContent = typeof updates.content === "string";
    const contentSequence = savesContent ? ++contentSaveSequenceRef.current : 0;
    if (savesContent) setSaveState("saving");
    try {
      const { data } = await api.put(`/notes/${note._id}`, updates);
      if (savesContent && contentSequence === contentSaveSequenceRef.current) {
        lastSavedContentRef.current = updates.content as string;
        localStorage.removeItem(draftKey);
        setSaveState("saved");
      }
      const updated = data?.data as Note | undefined;
      if (updated) {
        setTitle(updated.name);
        lastSavedTitleRef.current = updated.name;
        setTags(updated.tags || []);
        setIsPinned(updated.isPinned === true);
        setLastUpdated(updated.updatedAt);
      }
      if (notify) toast.success("Note saved.");
      return true;
    } catch (error: unknown) {
      if (savesContent && contentSequence === contentSaveSequenceRef.current) setSaveState("error");
      if (notify) toast.error(getApiErrorMessage(error, "Note could not be saved."));
      return false;
    }
  };

  useEffect(() => {
    if (!note?._id || content === lastSavedContentRef.current) return;
    localStorage.setItem(draftKey, JSON.stringify({ content, savedAt: new Date().toISOString() }));
    setSaveState("unsaved");
    const timer = window.setTimeout(() => void persist({ content }), 1100);
    return () => window.clearTimeout(timer);
  // persist intentionally uses the current note and is only triggered by content changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, draftKey, note?._id]);

  useEffect(() => {
    const updateListener = ({ noteId, content: remoteContent }: { noteId: string; content: string }) => {
      if (note?._id !== noteId || remoteContent === contentRef.current) return;
      if (contentRef.current !== lastSavedContentRef.current) setPendingRemote(remoteContent);
      else {
        const safeRemoteContent = toEditorHtml(remoteContent);
        setContent(safeRemoteContent);
        contentRef.current = safeRemoteContent;
        lastSavedContentRef.current = safeRemoteContent;
        if (editorRef.current) editorRef.current.innerHTML = safeRemoteContent;
        setSaveState("saved");
      }
    };
    socket.on("note:content-update", updateListener);
    return () => { socket.off("note:content-update", updateListener); };
  }, [note?._id]);

  const updateContent = (nextContent: string, broadcast = true) => {
    setContent(nextContent);
    contentRef.current = nextContent;
    if (broadcast && note?._id) socket.emit("note:update", { noteId: note._id, content: nextContent });
  };

  const runEditorCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    const next = sanitizeEditorHtml(editorRef.current?.innerHTML ?? "");
    if (editorRef.current && editorRef.current.innerHTML !== next) editorRef.current.innerHTML = next;
    updateContent(next);
  };

  const addTag = async () => {
    const tag = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!tag || tags.includes(tag)) { setTagInput(""); return; }
    if (tag.length > 24 || tags.length >= 10) { toast.error("Use up to 10 tags, each 24 characters or fewer."); return; }
    const nextTags = [...tags, tag];
    setTags(nextTags);
    setTagInput("");
    if (await persist({ tags: nextTags })) setRefreshKey((key) => key + 1);
  };

  const removeTag = async (tag: string) => {
    const nextTags = tags.filter((candidate) => candidate !== tag);
    setTags(nextTags);
    if (await persist({ tags: nextTags })) setRefreshKey((key) => key + 1);
  };

  const saveTitle = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) { setTitle(note?.name || "Untitled Note"); return; }
    if (cleanTitle === lastSavedTitleRef.current) return;
    if (await persist({ name: cleanTitle })) setRefreshKey((key) => key + 1);
  };

  const togglePinned = async () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    if (await persist({ isPinned: nextPinned })) {
      setRefreshKey((key) => key + 1);
      toast.success(nextPinned ? "Note pinned." : "Note unpinned.");
    } else setIsPinned(!nextPinned);
  };

  const findNext = () => {
    if (!findQuery || !editorRef.current) return;
    const normalized = editorRef.current.innerText.toLowerCase();
    let index = normalized.indexOf(findQuery.toLowerCase(), findCursor);
    if (index === -1) index = normalized.indexOf(findQuery.toLowerCase());
    if (index === -1) return;
    window.requestAnimationFrame(() => {
      const root = editorRef.current;
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let offset = 0;
      let startNode: Node | null = null;
      let startOffset = 0;
      let endNode: Node | null = null;
      let endOffset = 0;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const length = node.textContent?.length ?? 0;
        if (!startNode && index <= offset + length) { startNode = node; startOffset = index - offset; }
        if (startNode && index + findQuery.length <= offset + length) { endNode = node; endOffset = index + findQuery.length - offset; break; }
        offset += length;
      }
      if (startNode && endNode) {
        const range = document.createRange();
        range.setStart(startNode, Math.max(0, startOffset));
        range.setEnd(endNode, Math.max(0, endOffset));
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        root.focus();
      }
      setFindCursor(index + findQuery.length);
    });
  };

  const exportNote = () => {
    const blob = new Blob([`<!doctype html><meta charset="utf-8"><title>${escapeHtml(title)}</title><h1>${escapeHtml(title)}</h1>${sanitizeEditorHtml(content)}`], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "note"}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const deleteNote = async () => {
    if (!note?._id) return;
    setDeleting(true);
    try {
      await api.delete(`/notes/${note._id}`);
      toast.success("Note deleted.");
      setSelectedItem(null);
      setRefreshKey((key) => key + 1);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Note could not be deleted."));
    } finally { setDeleting(false); setDeleteOpen(false); }
  };

  if (!note) return <div className="flex flex-1 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading note…</div>;

  const tools = [
    { label: "Heading", icon: Heading1, action: () => runEditorCommand("formatBlock", "h2") },
    { label: "Bold", icon: Bold, action: () => runEditorCommand("bold") },
    { label: "Italic", icon: Italic, action: () => runEditorCommand("italic") },
    { label: "Bullet list", icon: List, action: () => runEditorCommand("insertUnorderedList") },
    { label: "Numbered list", icon: ListOrdered, action: () => runEditorCommand("insertOrderedList") },
    { label: "Checklist", icon: CheckSquare, action: () => runEditorCommand("insertText", "☐ ") },
    { label: "Quote", icon: Quote, action: () => runEditorCommand("formatBlock", "blockquote") },
    { label: "Code block", icon: Code2, action: () => runEditorCommand("formatBlock", "pre") },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
      <header className="border-b border-border bg-surface/80 px-5 py-4 backdrop-blur-xl sm:px-7">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <input value={title} onChange={(event) => setTitle(event.target.value)} onBlur={() => void saveTitle()} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} maxLength={100} className="w-full truncate bg-transparent text-2xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground sm:text-3xl" aria-label="Note title" />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {words} words · {plainText.length.toLocaleString()} characters</span>
                <span aria-hidden>•</span>
                <span>Updated {formatDistanceToNow(new Date(lastUpdated || note.updatedAt), { addSuffix: true })}</span>
                <span aria-hidden>•</span>
                <span className={`flex items-center gap-1.5 font-semibold ${saveState === "error" ? "text-red-500" : saveState === "saved" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {saveState === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saveState === "saved" ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                  {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Unsaved"}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button variant="ghost" size="icon" onClick={() => void togglePinned()} title={isPinned ? "Unpin note" : "Pin note"} className={isPinned ? "text-primary" : "text-muted-foreground"}>{isPinned ? <PinOff /> : <Pin />}</Button>
              <Button variant="ghost" size="icon" onClick={() => { setFindOpen((open) => !open); setTimeout(() => editorRef.current?.focus(), 0); }} title="Find in note"><Search /></Button>
              <Button variant="ghost" size="icon" onClick={async () => { await navigator.clipboard.writeText(plainText); toast.success("Note copied."); }} title="Copy note"><Clipboard /></Button>
              <Button variant="ghost" size="icon" onClick={exportNote} title="Download Markdown"><Download /></Button>
              <Button onClick={() => void persist({ content }, true)} className="hidden rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground shadow-lg shadow-primary/20 sm:inline-flex"><Save className="h-4 w-4" /> Save</Button>
              {note.createdBy?._id === user?._id && <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500" onClick={() => setDeleteOpen(true)} title="Delete note"><Trash2 /></Button>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Tags className="mr-1 h-4 w-4 text-muted-foreground" />
            {tags.map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">#{tag}<button onClick={() => void removeTag(tag)} aria-label={`Remove ${tag} tag`} className="rounded-full hover:bg-primary/10"><X className="h-3 w-3" /></button></span>)}
            <div className="flex items-center"><Hash className="-mr-5 ml-2 h-3 w-3 text-muted-foreground" /><input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); void addTag(); } }} onBlur={() => { if (tagInput.trim()) void addTag(); }} placeholder="Add tag" maxLength={24} className="h-7 w-24 rounded-full border border-dashed border-border bg-transparent pl-5 pr-2 text-xs outline-none transition focus:w-32 focus:border-primary" /></div>
          </div>
        </div>
      </header>

      {pendingRemote && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-400/30 bg-amber-500/10 px-6 py-2.5 text-sm"><span>A collaborator changed this note while you had unsaved edits.</span><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setPendingRemote(null)}>Keep mine</Button><Button size="sm" onClick={() => { const safe = toEditorHtml(pendingRemote); updateContent(safe, false); lastSavedContentRef.current = safe; if (editorRef.current) editorRef.current.innerHTML = safe; setPendingRemote(null); setSaveState("saved"); }}>Load theirs</Button></div></div>}

      {findOpen && <div className="flex items-center gap-2 border-b border-border bg-elevated/70 px-5 py-2"><Search className="h-4 w-4 text-muted-foreground" /><input autoFocus value={findQuery} onChange={(event) => { setFindQuery(event.target.value); setFindCursor(0); }} onKeyDown={(event) => { if (event.key === "Enter") findNext(); if (event.key === "Escape") setFindOpen(false); }} placeholder="Find in this note" className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none" /><span className="text-xs text-muted-foreground">{matchCount} {matchCount === 1 ? "match" : "matches"}</span><Button size="sm" variant="ghost" onClick={findNext}>Next</Button><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setFindOpen(false)}><X /></Button></div>}

      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface/65 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {tools.map(({ label, icon: Icon, action }) => <button key={label} type="button" onMouseDown={(event) => { event.preventDefault(); action(); }} title={label} aria-label={label} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-elevated hover:text-foreground"><Icon className="h-4 w-4" /></button>)}<span className="mx-1 h-5 w-px bg-border" /><button type="button" onMouseDown={(event) => { event.preventDefault(); runEditorCommand("undo"); }} title="Undo" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-elevated"><Undo2 className="h-4 w-4" /></button><button type="button" onMouseDown={(event) => { event.preventDefault(); runEditorCommand("redo"); }} title="Redo" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-elevated"><Redo2 className="h-4 w-4" /></button>
        </div>
        <span className="hidden shrink-0 text-xs font-semibold text-muted-foreground sm:inline">Rich text editor</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-7">
        <div className="mx-auto min-h-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-[0_24px_65px_-42px_var(--shadow-soft)]">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Note content"
            data-placeholder="Start writing your note…"
            spellCheck
            onInput={(event) => updateContent(sanitizeEditorHtml(event.currentTarget.innerHTML))}
            onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); void persist({ content: sanitizeEditorHtml(event.currentTarget.innerHTML) }, true); } }}
            onPaste={(event) => { event.preventDefault(); document.execCommand("insertText", false, event.clipboardData.getData("text/plain")); }}
            className="min-h-[560px] w-full bg-transparent p-6 text-[16px] leading-7 text-foreground outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] sm:p-10 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-elevated [&_code]:px-1.5 [&_h1]:my-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:my-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:my-3 [&_h3]:text-xl [&_h3]:font-bold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-7 [&_p]:my-2 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-slate-100 [&_strong]:font-bold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-7"
          />
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent className="bg-surface"><DialogHeader><DialogTitle>Delete “{title}”?</DialogTitle><DialogDescription>This permanently removes the note for everyone in this workspace. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button onClick={() => void deleteNote()} disabled={deleting} className="bg-red-600 text-white hover:bg-red-700">{deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete note</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
