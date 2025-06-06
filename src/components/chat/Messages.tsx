import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Send } from "lucide-react";

const Messages = () => {
  const [newMessage, setNewMessage] = useState("");
  
  const chatMessages = [
    {
      id: 1,
      user: "Alex Chen",
      message: "Hey everyone! Just pushed the new feature to staging",
      time: "2:30 PM",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      user: "Sarah Kim",
      message: "Looks great! The UI improvements are really smooth",
      time: "2:32 PM",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      user: "Mike Johnson",
      message:
        "I found a small bug in the mobile version, creating a ticket now",
      time: "2:35 PM",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 4,
      user: "You",
      message:
        "Thanks for catching that! Let me know if you need any help debugging",
      time: "2:37 PM",
      avatar: "/placeholder.svg?height=40&width=40",
      isOwn: true,
    },
    {
      id: 5,
      user: "Emma Davis",
      message:
        "The performance improvements are incredible! Load time is down by 40%",
      time: "2:40 PM",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.isOwn ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex space-x-3 max-w-2xl ${
                message.isOwn ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={message.avatar || "/placeholder.svg"} />
                <AvatarFallback>{message.user.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className={`${message.isOwn ? "text-right" : ""}`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-300">
                    {message.user}
                  </span>
                  <span className="text-xs text-gray-500">{message.time}</span>
                </div>
                <div
                  className={`p-4 rounded-2xl ${
                    message.isOwn
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gray-800/60 text-gray-100"
                  }`}
                >
                  {message.message}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="bg-gray-900/60 backdrop-blur-xl border-t border-gray-700/30 p-6">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 rounded-2xl py-4 px-6 text-lg resize-none"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl px-8 py-4 h-auto"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Messages;
