import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckSquare, FileText, Loader2, MessageCircle, Search, X } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";

export type WorkspaceSearchResult = {
  type: "message" | "note" | "task" | "meeting";
  id: string;
  title: string;
  snippet: string;
  occurredAt: string;
  rank: number;
};

type SearchPage = {
  results: WorkspaceSearchResult[];
  hasMore: boolean;
  nextCursor: string | null;
};

const filters = [
  { type: "message", label: "Messages", icon: MessageCircle },
  { type: "note", label: "Notes", icon: FileText },
  { type: "task", label: "Tasks", icon: CheckSquare },
  { type: "meeting", label: "Meetings", icon: CalendarClock },
] as const;

const HighlightedSnippet = ({ value }: { value: string }) => {
  const parts = useMemo(() => value.split(/(<mark>.*?<\/mark>)/gi), [value]);
  return <>{parts.map((part, index) => /^<mark>/i.test(part)
    ? <mark key={index} className="rounded bg-amber-300/50 px-0.5 text-foreground">{part.replace(/<\/?mark>/gi, "")}</mark>
    : <span key={index}>{part}</span>)}</>;
};

export function WorkspaceSearch({ chatId, onSelect }: { chatId: string; onSelect: (result: WorkspaceSearchResult) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Array<WorkspaceSearchResult["type"]>>([]);
  const [results, setResults] = useState<WorkspaceSearchResult[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeKey = selectedTypes.slice().sort().join(",");
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]); setNextCursor(null); setHasMore(false); setError(null); setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        const { data } = await api.get<SearchPage>(`/search/${chatId}`, {
          params: { q: trimmed, types: typeKey || undefined, limit: 12 },
          signal: controller.signal,
        });
        setResults(data.results); setNextCursor(data.nextCursor); setHasMore(data.hasMore);
      } catch (searchError) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(searchError, "Search is temporarily unavailable."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [chatId, query, typeKey]);

  const toggleType = (type: WorkspaceSearchResult["type"]) => {
    setSelectedTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  };

  const loadMore = async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const { data } = await api.get<SearchPage>(`/search/${chatId}`, { params: { q: query.trim(), types: typeKey || undefined, limit: 12, cursor: nextCursor } });
      setResults((current) => [...current, ...data.results]);
      setNextCursor(data.nextCursor); setHasMore(data.hasMore);
    } catch (searchError) { setError(getApiErrorMessage(searchError, "More results could not be loaded.")); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative z-50 hidden w-[min(34rem,42vw)] md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input value={query} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 150)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} placeholder="Search this workspace…" className="h-10 w-full rounded-xl border border-border bg-elevated/70 pl-9 pr-9 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10" />
      {query && <button type="button" onClick={() => { setQuery(""); setResults([]); }} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>}

      {open && query.trim().length >= 2 && <section onMouseDown={(event) => event.preventDefault()} className="absolute right-0 top-12 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/20">
        <div className="flex flex-wrap gap-1.5 border-b border-border p-3">{filters.map(({ type, label, icon: Icon }) => <button key={type} type="button" onClick={() => toggleType(type)} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${selectedTypes.includes(type) ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}><Icon className="h-3 w-3" />{label}</button>)}</div>
        <div className="custom-scrollbar max-h-[28rem] overflow-y-auto p-2">
          {results.map((result) => { const filter = filters.find((item) => item.type === result.type)!; const Icon = filter.icon; return <button key={`${result.type}:${result.id}`} type="button" onClick={() => { setOpen(false); onSelect(result); }} className="flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-muted"><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{result.title}</span><span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground"><HighlightedSnippet value={result.snippet} /></span><span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{result.type} · {new Date(result.occurredAt).toLocaleDateString()}</span></span></button>; })}
          {!loading && !error && results.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">No matching messages, notes, tasks, or meetings.</p>}
          {error && <p className="px-4 py-5 text-center text-sm text-red-500">{error}</p>}
          {loading && results.length === 0 && <div className="grid place-items-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {hasMore && <button type="button" disabled={loading} onClick={() => void loadMore()} className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl p-2 text-xs font-semibold text-primary hover:bg-primary/10">{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Load more results</button>}
        </div>
      </section>}
    </div>
  );
}
