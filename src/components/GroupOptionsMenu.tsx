import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { IUser } from "@/types";
import api from "@/lib/axiosInstance";

export function GroupOptionsMenu() {
  const { id } = useParams();
  const [showOptions, setShowOptions] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const query = addUsername.trim();
      if (query) {
        api
          .get(`/users/search`, {
            params: { query },
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
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [addUsername]);

  const handleRename = async () => {
    if (!newGroupName) return;

    try {
      const { data } = await api.put(`/chat/rename`, {
        chatId: id,
        chatName: newGroupName,
      });

      toast.success("Renamed the group !");
      console.log(data._id);
    } catch (error) {
      toast.error("Failed to rename the group !");
    }
    setNewGroupName("");
  };

  const handleSelectUser = (user: IUser) => {
    if (!selectedUsers.find((u: IUser) => u._id === user._id)) {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setAddUsername("");
    setSearchResults([]);
  };

  const handleRemoveUser = (id: String) => {
    setSelectedUsers((prev) => prev.filter((u: IUser) => u._id !== id));
  };

  const handleAddUsers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const userIds = selectedUsers.map((user) => user._id);

      console.log(id);
      console.log(userIds);
      const data = await api.put(`/chat/groupadd`, {
        chatId: id,
        userIds,
      });

      console.log(data);

      toast.success("Users added successfully!");
      setSelectedUsers([]);
      setAddUsername("");
      setShowOptions(false);
    } catch (error) {
      toast.error("Failed to add users!");
    }
  };

  return (
    <div className="flex items-center space-x-2 absolute top-[5vh] right-[5vh] z-50">
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400"
          onClick={() => setShowOptions((v) => !v)}
          aria-label="Show group options"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
        {showOptions && (
          <>
            <div
              className="fixed inset-0 z-40 flex items-start justify-end pt-[10vh]"
              onClick={() => setShowOptions(false)} 
            >
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                }}
                className=" w-64 bg-gray-900 border border-gray-700 shadow-xl rounded-xl py-2"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-base font-semibold text-white px-4 py-2 border-b border-gray-800">
                  Group Options
                </h2>

                {/* Add users */}
                <div className="px-4 pt-2">
                  <label className="block text-gray-300 text-sm mb-2">
                    Add users
                  </label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        value={addUsername}
                        onChange={(e) => setAddUsername(e.target.value)}
                        placeholder="Search by username or email"
                        className="flex-1 bg-gray-800 border-gray-700 text-white"
                      />
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleAddUsers}
                      >
                        Add
                      </Button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <ul className="bg-gray-800 border border-gray-700 rounded-lg mt-1 max-h-40 overflow-y-auto">
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

                    {/* Selected Users */}
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
                  </div>
                </div>

                {/* Rename group */}
                <div className="px-4 pb-2">
                  <label className="block text-gray-300 text-sm mb-2">
                    Rename group
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="New group name"
                      className="flex-1 bg-gray-800 border-gray-700 text-white"
                    />
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        handleRename();
                        setShowOptions(false);
                      }}
                    >
                      ✏️
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
