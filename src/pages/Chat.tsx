"use client";

import React, { useEffect } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  FileText,
  Video,
  PenTool,
  Search,
  MoreVertical,
  Users,
  Clock,
  MessageCircle,
} from "lucide-react";
import WhiteboardComponent from '@/components/chat/Whiteboards'; // Import the new component
import CreateWhiteboardModal from '@/components/CreateWhiteBoardModal'; // Import the new modal

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Messages from "@/components/chat/Messages";
import Notes from "@/components/chat/Notes";
import Meetings from "@/components/chat/Meetings";
// import Whiteboards from "@/components/chat/Whiteboards";
import type { Note, Meeting, Whiteboard } from "@/types";
import { GroupOptionsMenu } from "@/components/GroupOptionsMenu";
import { Toaster } from "sonner";
import CreateNotesModal from "@/components/CreateNotesModal";
import axios from "axios";
import { format } from "date-fns";
import CreateMeetingModal from "@/components/CreateMeetingModal";

// const workspaceData: {
//   meetings: Meeting[];
//   whiteboards: Whiteboard[];
// } = {
  
//   meetings: [
//     {
//       id: "room-1",
//       name: "Daily Standup",
//       participants: 8,
//       status: "active",
//       scheduledTime: "9:00 AM",
//       duration: "30 min",
//     },
//     {
//       id: "room-2",
//       name: "Design Review",
//       participants: 5,
//       status: "scheduled",
//       scheduledTime: "2:00 PM",
//       duration: "1 hour",
//     },
//     {
//       id: "room-3",
//       name: "Client Presentation",
//       participants: 12,
//       status: "ended",
//       scheduledTime: "Yesterday",
//       duration: "45 min",
//     },
//   ],
//   whiteboards: [
//     {
//       id: "board-1",
//       title: "System Architecture",
//       lastModified: "1 hour ago",
//       collaborators: 4,
//       thumbnail: "/placeholder.svg?height=60&width=80",
//     },
//     {
//       id: "board-2",
//       title: "User Flow Diagram",
//       lastModified: "5 hours ago",
//       collaborators: 3,
//       thumbnail: "/placeholder.svg?height=60&width=80",
//     },
//     {
//       id: "board-3",
//       title: "Brainstorming Session",
//       lastModified: "2 days ago",
//       collaborators: 6,
//       thumbnail: "/placeholder.svg?height=60&width=80",
//     },
//   ],
// };

type TabType = "chat" | "notes" | "meetings" | "whiteboards";

export default function WorkspacePage() {

  const navigate = useNavigate();
  const {id:chatId} = useParams();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showWhiteboardModal, setShowWhiteboardModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [allNotesData , setAllNotesData] = useState<Note[]>([]);
  const [allMeetData , setAllMeetData] = useState<Meeting[]>([]);
  const [noteData, setNoteData] = useState<Note | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [allWhiteboardsData, setAllWhiteboardsData] = useState<Whiteboard[]>([]);

  const tabs = [
    {
      id: "chat" as TabType,
      label: "Chat",
      icon: MessageCircle,
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "notes" as TabType,
      label: "Notes",
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "meetings" as TabType,
      label: "Meeting Rooms",
      icon: Video,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "whiteboards" as TabType,
      label: "Whiteboards",
      icon: PenTool,
      color: "from-purple-500 to-pink-500",
    },
  ];

  const fetchNoteById = async (noteId: string) => {
    try {
      const res = await axios.get(`/api/notes/${noteId}`, {
        params: {
          noteId,
        },
      });
  
      const notedata = res.data.data as Note;

      if (!notedata) {
        console.error(`Note with ID ${noteId} not found`);
        return
      }
      setNoteData(notedata);

    } catch (error) {
      console.error(`Failed to fetch note with ID ${noteId}:`, error);
    }
  };
  
const fetchData = async (tab: TabType) => {
  try {
    if (tab === "chat" ) {
      return;
    }

    let res;

    if (tab === "meetings") {
      res = await axios.get(`/api/meet/${chatId}`);
      setAllMeetData(res.data || []); // Make sure this state setter exists
    } 
    else if (tab === "notes") {
      res = await axios.get(`/api/notes`, { params: { chatId } });
      setAllNotesData(res.data.data || []);
    } else if (tab === "whiteboards") { // New case
      res = await axios.get(`/api/whiteboards/group/${chatId}`);
      setAllWhiteboardsData(res.data.data || []);
    }
  } catch (error) {
    console.error(`Failed to fetch data for ${tab}:`, error);
  }
};


  useEffect(() => {
      fetchData(activeTab);
  }, [activeTab, refreshKey]);

  const handleCreateNew = (type: TabType) => {
    console.log(`Creating new ${type}`);

    if (type === "notes") {
      setShowNotesModal(true);
    }
    else if (type === "meetings") {
      setShowMeetingModal(true);
    }
    else if (type === "whiteboards") {
    setShowWhiteboardModal(true); // New condition
  }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "chat":
        return (
          <div className="p-4">
            <div className="text-center text-gray-400 text-sm mb-4">
              Chat is displayed on the right side
            </div>
          </div>
        );

      case "notes":
        return allNotesData.map((note) => (
          <div
            key={note._id}
            onClick={() => {
              setSelectedItem(note._id);
              fetchNoteById(note._id);
            }}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 group ${
              selectedItem === note._id
                ? "bg-gray-700/50 "
                : "hover:bg-gray-800/30"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-white font-medium truncate flex-1">
                {note.name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
              {note.content}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>by {note.createdBy.username}</span>
              <span>
                {format(new Date(note.createdAt), "dd MMM yyyy, hh:mm a")}
              </span>
            </div>
          </div>
        ));

      case "meetings":
        return allMeetData.map((room) => (
          <div
            key={room.id}
            onClick={() => setSelectedItem(room.id)}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 group ${
              selectedItem === room.id
                ? "bg-gray-700/50 "
                : "hover:bg-gray-800/30"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-white font-medium truncate flex-1">
                {room.name}
              </h3>
              <div
                className={`w-2 h-2 rounded-full ${
                  room.status === "active"
                    ? "bg-green-500"
                    : room.status === "scheduled"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
                }`}
              />
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{room.participants}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{room.duration}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="capitalize">{room.status}</span>
              <span>{room.scheduledTime}</span>
            </div>
          </div>
        ));

      case "whiteboards":
      return allWhiteboardsData.map((board) => ( // Use the new state
        <div
          key={board._id}
          onClick={() => setSelectedItem(board._id)}
          className={`p-4 rounded-xl cursor-pointer transition-all duration-200 group ${
            selectedItem === board._id
              ? "bg-gray-700/50 "
              : "hover:bg-gray-800/30"
          }`}
        >
          <div className="flex space-x-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-white font-medium truncate">
                  {board.title}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span>Created by {board.createdBy?.username || 'unknown'}</span>
                <span>{new Date(board.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      ));

      default:
        return null;
    }
  };

  const getCurrentTabData = () => {
    if (activeTab === "chat" || activeTab  === "notes") return [];
    return [];
  };

  const renderMainContent = () => {
    // Always show chat when chat tab is active
    if (activeTab === "chat") {
      return <Messages />;
    }

    // Show workspace content for other tabs
    if (!selectedItem) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              {tabs.find((tab) => tab.id === activeTab)?.icon &&
                React.createElement(
                  tabs.find((tab) => tab.id === activeTab)!.icon,
                  {
                    className: "w-12 h-12 text-gray-600",
                  }
                )}
            </div>
            <h3 className="text-2xl font-bold text-gray-400 mb-2">
              Select a {activeTab.slice(0, -1)} to get started
            </h3>
            <p className="text-gray-500 mb-6">
              Choose from the {activeTab} in the sidebar or create a new one
            </p>
            <Button
              onClick={() => handleCreateNew(activeTab)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New{" "}
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
            </Button>
          </div>
        </div>
      );
    }

    // Render content based on selected item and active tab
    if (activeTab === "notes") {
      
      return <Notes note={noteData} setRefreshKey={setRefreshKey} />;
    }

    if (activeTab === "meetings") {
      const meeting = allMeetData.find((m) => m.id === selectedItem);
      return <Meetings meeting={meeting} />;
    }


if (activeTab === "whiteboards") {
        const whiteboard = allWhiteboardsData.find(
            (w) => w._id === selectedItem
        );

        if (!selectedItem) {
            // This case handles the "select a whiteboard" message
            // or the "create new" button.
            return (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            {tabs.find((tab) => tab.id === activeTab)?.icon &&
                                React.createElement(
                                    tabs.find((tab) => tab.id === activeTab)!.icon,
                                    {
                                        className: "w-12 h-12 text-gray-600",
                                    }
                                )}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-400 mb-2">
                            Select a whiteboard to get started
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Choose from the whiteboards in the sidebar or create a new one
                        </p>
                        <Button
                            onClick={() => handleCreateNew(activeTab)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Whiteboard
                        </Button>
                    </div>
                </div>
            );
        }
        
        // This case handles a valid whiteboard being selected.
        if (whiteboard) {
            return <WhiteboardComponent whiteboard={whiteboard} />;
        }
        
        // This case handles when an item is selected but not found (e.g., loading or doesn't exist).
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-400 mb-2">
                        Whiteboard not found or still loading
                    </h3>
                </div>
            </div>
        );
    }

    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-400 mb-2">
            {(activeTab as string).charAt(0).toUpperCase() +
              (activeTab as string).slice(1)}{" "}
            Content
          </h3>
          <p className="text-gray-500">
            Content for selected {(activeTab as string).slice(0, -1)} will
            appear here
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-gray-900/40 backdrop-blur-xl border-r border-gray-700/30 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-700/30">
          <div className="flex items-center space-x-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/`)}
              className="text-gray-400"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold text-white">Workspace</h2>
          </div>

          {/* Tab Navigation */}
          <div className="space-y-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  layout
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedItem(null);
                    fetchData(tab.id);
                  }}
                  initial={false}
                  animate={{
                    backgroundColor: isActive
                      ? "rgba(55, 65, 81, 0.5)"
                      : "transparent",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl ${
                    !isActive ? "hover:bg-gray-800/30" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-r ${tab.color} flex items-center justify-center`}
                  >
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white font-medium">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Search and Create */}
        {activeTab !== "chat" && (
          <div className="p-4 border-b border-gray-700/30">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500"
              />
            </div>
            <Button
              onClick={() => handleCreateNew(activeTab)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </div>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {renderTabContent()}
        </div>
      </div>

      <Toaster richColors />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-900/60 backdrop-blur-xl border-b border-gray-700/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${
                  tabs.find((tab) => tab.id === activeTab)?.color
                } flex items-center justify-center`}
              >
                {tabs.find((tab) => tab.id === activeTab)?.icon &&
                  React.createElement(
                    tabs.find((tab) => tab.id === activeTab)!.icon,
                    {
                      className: "w-6 h-6 text-white",
                    }
                  )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {tabs.find((tab) => tab.id === activeTab)?.label}
                </h1>
                <p className="text-gray-400">
                  {activeTab === "chat"
                    ? "1,247 members • 89 online"
                    : `${getCurrentTabData().length} ${activeTab} available`}
                </p>
              </div>
            </div>
          </div>
        </div>
        <GroupOptionsMenu />
        {/* Main Content */}
        {renderMainContent()}

        <CreateNotesModal
          showModal={showNotesModal}
          setShowModal={setShowNotesModal}
          setRefreshKey={setRefreshKey}
        />
        <CreateMeetingModal
  chatId={chatId||""} // ✅ Pass the current chat ID here
  // clerkId={clerkId} // ✅ Pass the logged-in user’s Clerk ID
  open={showMeetingModal}
  onOpenChange={setShowMeetingModal}
  onSuccess={() => setRefreshKey((k) => k + 1)} // optional callback
/>
          <CreateWhiteboardModal
            showModal={showWhiteboardModal}
            setShowModal={setShowWhiteboardModal}
            setRefreshKey={setRefreshKey}
          />

      </div>
    </div>
  );
}
