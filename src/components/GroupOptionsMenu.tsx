import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { IUser } from "@/types";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";

interface GroupOptionsMenuProps {
  onClose: () => void;
  onChanged?: () => void;
}

export function GroupOptionsMenu({ onClose, onChanged }: GroupOptionsMenuProps) {
  const { id } = useParams();
  const [search, setSearch] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const query = search.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      api
        .get<{ users: IUser[] }>("/users/search", {
          params: { query },
          signal: controller.signal,
        })
        .then((response) => setSearchResults(response.data.users ?? []))
        .catch(() => {
          if (!controller.signal.aborted) setSearchResults([]);
        });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const handleRename = async () => {
    const chatName = newGroupName.trim();
    if (!id || !chatName) return;
    setSubmitting(true);
    try {
      await api.put("/chat/rename", { chatId: id, chatName });
      toast.success("Workspace renamed.");
      setNewGroupName("");
      onChanged?.();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to rename the workspace."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUsers = async () => {
    if (!id || selectedUsers.length === 0) return;
    setSubmitting(true);
    try {
      await api.put("/chat/groupadd", {
        chatId: id,
        userIds: selectedUsers.map((user) => user._id),
      });
      toast.success("Members added.");
      setSelectedUsers([]);
      setSearch("");
      onChanged?.();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to add members."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-end p-4 sm:p-8" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-sm bg-gray-900 border border-gray-700 shadow-2xl rounded-xl p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Workspace options</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close options">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <section className="space-y-3 mb-6">
          <label htmlFor="member-search" className="block text-gray-300 text-sm">Add members</label>
          <Input
            id="member-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search username or email"
            className="bg-gray-800 border-gray-700 text-white"
          />
          {searchResults.length > 0 && (
            <ul className="bg-gray-800 border border-gray-700 rounded-lg max-h-40 overflow-y-auto">
              {searchResults.map((candidate) => (
                <li key={candidate._id}>
                  <button
                    type="button"
                    className="w-full p-2 text-left hover:bg-gray-700 text-white"
                    onClick={() => {
                      setSelectedUsers((current) =>
                        current.some((user) => user._id === candidate._id)
                          ? current
                          : [...current, candidate]
                      );
                      setSearch("");
                    }}
                  >
                    {candidate.username} <span className="text-xs text-gray-500">{candidate.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((selected) => (
              <button
                type="button"
                key={selected._id}
                onClick={() => setSelectedUsers((current) => current.filter((user) => user._id !== selected._id))}
                className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm"
                title="Remove selection"
              >
                {selected.username} ×
              </button>
            ))}
          </div>
          <Button onClick={handleAddUsers} disabled={submitting || selectedUsers.length === 0} className="w-full">
            Add selected members
          </Button>
        </section>

        <section className="space-y-3 border-t border-gray-800 pt-5">
          <label htmlFor="workspace-name" className="block text-gray-300 text-sm">Rename workspace</label>
          <Input
            id="workspace-name"
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            placeholder="New workspace name"
            maxLength={100}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <Button onClick={handleRename} disabled={submitting || !newGroupName.trim()} className="w-full">
            Rename workspace
          </Button>
        </section>
      </motion.div>
    </div>
  );
}
