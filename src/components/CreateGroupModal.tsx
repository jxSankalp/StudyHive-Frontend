import api, { getApiErrorMessage } from "@/lib/axiosInstance";
import type { CreateGroupModalProps, IUser } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { reportFrontendError } from "@/lib/telemetry";

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  showModal,
  setShowModal,
  onGroupCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced API call
  useEffect(() => {
    const controller = new AbortController();
    const delayDebounce = setTimeout(() => {
      const query = searchQuery.trim();
      if (query) {
        api
          .get(`/users/search`, {
            params: { query },
            signal: controller.signal,
          })
          .then((res) => {
            setSearchResults(res.data.users || []);
          })
          .catch(() => {
            setSearchResults([]);
          });
      } else {
        setSearchResults([]);
      }
    }, 300); // debounce for 300ms

    return () => {
      clearTimeout(delayDebounce);
      controller.abort();
    };
  }, [searchQuery]);

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (
      form.elements.namedItem("name") as HTMLInputElement
    )?.value.trim();
    const description = (
      form.elements.namedItem("description") as HTMLTextAreaElement
    )?.value.trim();
    if (!name || selectedUsers.length === 0) {
      toast.warning("Please fill all fields and select at least one member");
      return;
    }

    try {
      setIsSubmitting(true);
      const userIds = selectedUsers.map((user) => user._id);

      await api.post("/chat", {
        name,
        description,
        users: userIds,
      });

      toast.success("Group created successfully!");
      onGroupCreated();
      setShowModal(false);
      form.reset();
      setSelectedUsers([]);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error: unknown) {
      reportFrontendError("workspace.create.failed", error);
      toast.error(getApiErrorMessage(error, "Failed to create group. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectUser = (user: IUser) => {
    if (!selectedUsers.find((u: IUser) => u._id === user._id)) {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveUser = (id: string) => {
    setSelectedUsers((prev) => prev.filter((u: IUser) => u._id !== id));
  };

  return (
    showModal && (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full relative border border-gray-700">
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold text-white mb-4">
            Create New Group
          </h2>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <input
              name="name"
              placeholder="Group Name"
              className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 placeholder-gray-500 focus:outline-none"
            />
            <textarea
              name="description"
              placeholder="Group Description"
              className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 placeholder-gray-500 focus:outline-none"
            />

            {/* User Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Add members by username"
                className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 placeholder-gray-500 focus:outline-none"
              />
              {searchResults.length > 0 && (
                <ul className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-lg mt-1 max-h-40 overflow-y-auto">
                  {searchResults.map((user: IUser) => (
                    <li
                      key={user._id}
                      className="p-2 hover:bg-gray-700 text-white cursor-pointer"
                      onClick={() => handleSelectUser(user)}
                    >
                      {user.username}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Selected Members */}
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center bg-gray-700 text-white px-3 py-1 rounded-full text-sm"
                >
                  {user.username}
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(user._id)}
                    className="ml-2 text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              {isSubmitting ? "Creating..." : "Create Group"}
            </button>
          </form>
        </div>
      </div>
    )
  );
};

export default CreateGroupModal;
