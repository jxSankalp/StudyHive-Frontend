import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import type { Note } from "@/types";
import { useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";
import { socket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";

type NoteCardProps = {
  note: Note | null;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  setSelectedItem: (id: string | null) => void;
};

const Notes = ({ note, setRefreshKey, setSelectedItem }: NoteCardProps) => {
  const { user } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(note?.content || "");
  const contentRef = useRef(note?.content || "");
  const lastSentContentRef = useRef("");
  const lastSavedContentRef = useRef<string>("");

  const handleDelete = async () => {
    if (!note?._id) return;

    try {
      await api.delete(`/notes/${note._id}`, {
        params: {
          noteId: note._id,
        },
      });
      toast.success("Note deleted successfully");
      setRefreshKey((prev: number) => prev + 1);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete note"
      );
    }
  };

  // Join note room on mount or note change
  useEffect(() => {
    if (!note?._id) return;

    const joinNote = () => socket.emit("note:join", note._id);
    socket.on("connect", joinNote);
    socket.on("connected", joinNote);
    socket.connect();
    if (socket.connected) joinNote();
    const newContent = note.content || "";

    setContent(newContent);
    contentRef.current = newContent;
    lastSentContentRef.current = newContent;
    lastSavedContentRef.current = newContent;
    if (editorRef.current) {
      editorRef.current.innerText = newContent;
    }

    return () => {
      socket.emit("note:leave", note._id);
      socket.off("connect", joinNote);
      socket.off("connected", joinNote);
    };
  }, [note]);

  // Handle user edits
  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerText;
      setContent(newContent);
      contentRef.current = newContent;

      if (note?._id && newContent !== lastSentContentRef.current) {
        socket.emit("note:update", {
          noteId: note._id,
          content: newContent,
        });
        lastSentContentRef.current = newContent;
      }
    }
  };

  useEffect(() => {
    if (!note?._id) return;

    const timer = window.setTimeout(() => {
      if (content !== lastSavedContentRef.current) {
        api.put(`/notes/${note._id}`, { content })
          .then(() => { lastSavedContentRef.current = content; })
          .catch((error: unknown) => console.error("Autosave failed:", error));
      }
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [note?._id, content]);

  useEffect(() => {
    const updateListener = ({
      noteId,
      content: newContent,
    }: {
      noteId: string;
      content: string;
    }) => {
      if (note?._id === noteId && newContent !== content) {
        setContent(newContent);
        contentRef.current = newContent;
        lastSentContentRef.current = newContent;
        if (editorRef.current) {
          editorRef.current.innerText = newContent;
        }
      }
    };

    socket.on("note:content-update", updateListener);

    return () => {
      socket.off("note:content-update", updateListener);
    };
  }, [note?._id, content]);

  return (
    <div className="flex-1 px-4 py-8 sm:px-8 overflow-y-auto max-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-white break-words">
            {note?.name || "Untitled Note"}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={async () => {
                if (!note?._id) return;
                try {
                  await api.put(`/notes/${note._id}`, { content });
                  toast.success("Note saved successfully");
                  lastSavedContentRef.current = content;
                } catch (error: unknown) {
                  toast.error(getApiErrorMessage(error, "Failed to save note"));
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Save
            </Button>
            {note?.createdBy?._id === user?._id && <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-black transition duration-200"
              aria-label="Delete Note"
              onClick={handleDelete}
            >
              <Trash2 className="w-5 h-5" />
            </Button>}
          </div>
        </div>

        {/* Editable Content Area */}
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700/40 shadow-lg rounded-2xl p-6 sm:p-8">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap min-h-[400px] outline-none rounded-md"
            aria-placeholder="Start writing your note here..."
          />
        </div>
      </div>
    </div>
  );
};

export default Notes;
