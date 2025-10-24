import api from "@/lib/axiosInstance";
import type { CreateGroupModalProps, IUser } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  showModal,
  setShowModal,
  onGroupCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);

  // Debounced API call
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const query = searchQuery.trim();
      if (query) {
        api
          .get(`/api/users/search`, {
            params: { query },
          })
          .then((res) => {
            setSearchResults(res.data.users || []);
            console.log(res.data.users);
          })
          .catch(() => {
            setSearchResults([]);
          });
      } else {
        setSearchResults([]);
      }
    }, 300); // debounce for 300ms

    return () => clearTimeout(delayDebounce);
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
      const clerkIds = selectedUsers.map((user) => user.clerkId);

      const res = await api.post("/api/chat", {
        name,
        description,
        users: clerkIds,
      });

      console.log("hii1");

      const createdGroup = res.data.chat;
      console.log("hii2");
      console.log(createdGroup);

      console.log("hii3");
      toast.success("Group created successfully!");
      onGroupCreated();
      setShowModal(false);
      form.reset();
      setSelectedUsers([]);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error: any) {
      console.error("Group creation failed:", error);
      toast.error("Failed to create group. Please try again.");
    }
  };

  const handleSelectUser = (user: IUser) => {
    if (!selectedUsers.find((u: IUser) => u.clerkId === user.clerkId)) {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveUser = (id: String) => {
    setSelectedUsers((prev) => prev.filter((u: IUser) => u.clerkId !== id));
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
                      key={user.clerkId}
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
                  key={user.clerkId}
                  className="flex items-center bg-gray-700 text-white px-3 py-1 rounded-full text-sm"
                >
                  {user.username}
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(user.clerkId)}
                    className="ml-2 text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Create Group
            </button>
          </form>
        </div>
      </div>
    )
  );
};

export default CreateGroupModal;
