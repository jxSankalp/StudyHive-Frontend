import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import type { Note } from "@/types";
import { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "sonner";

type NoteCardProps = {
  note: Note | null;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
};

const socket = io(import.meta.env.VITE_BACKEND_URL);

const Notes = ({ note, setRefreshKey }: NoteCardProps) => {
  const { userId } = useAuth();

  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(note?.content || "");
  const [lastSentContent, setLastSentContent] = useState("");
  const lastSavedContentRef = useRef<string>("");

  const handleDelete = async () => {
    if (!note?._id) return;

    try {
      await axios.delete(`/api/notes/${note._id}`, {
        params: {
          noteId: note._id,
        },
      });
      console.log("Note deleted successfully");
      toast.success("Note deleted successfully");
      setRefreshKey((prev: number) => prev + 1);
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

    socket.emit("note:join", note._id, userId);
    const newContent = note.content || "";

    setContent(newContent);
    setLastSentContent(newContent);
    if (editorRef.current) {
      editorRef.current.innerText = newContent;
    }

    return () => {
      socket.emit("note:leave", note._id);
    };
  }, [note]);

  // Handle user edits
  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerText;
      setContent(newContent);

      if (note?._id && newContent !== lastSentContent) {
        socket.emit("note:update", {
          noteId: note._id,
          content: newContent,
        });
        setLastSentContent(newContent);
      }
    }
  };

  useEffect(() => {
    if (!note?._id) return;

    const interval = setInterval(() => {
      if (content !== lastSavedContentRef.current) {
        socket.emit("note:save", {
          noteId: note._id,
          content,
        });
        lastSavedContentRef.current = content;
      }
    }, 2000);

    return () => clearInterval(interval);
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
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-black transition duration-200"
              aria-label="Delete Note"
              onClick={handleDelete}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
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
