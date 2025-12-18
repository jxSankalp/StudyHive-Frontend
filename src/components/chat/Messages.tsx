import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import api from "@/lib/axiosInstance";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { socket } from "@/lib/socket";

interface User {
  _id: string;
  username: string;
  photo?: string;
}

interface Message {
  _id: string;
  sender: User;
  content: string;
  createdAt: string;
}

var selectedChatCompare: string;

const Messages = () => {
  const { id: chatId } = useParams();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!chatId || !user?._id) return;

    console.log(user._id);

    socket.connect();
    socket.emit("setup", user._id);
    socket.on("connected", () => setSocketConnected(true));

  }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return;

      setLoading(true);
      try {
        const response = await api.get(`/messages/${chatId}`);
        const fetchedMessages: Message[] = response.data;

        setMessages(Array.isArray(fetchedMessages) ? fetchedMessages : []);
        socket.emit("join chat", chatId, user?._id);


      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    selectedChatCompare = chatId as string;
  }, [chatId]);

  useEffect(() => {
    if (!socketConnected || !chatId) return;
    socket.emit("join chat", chatId, user?._id);
    selectedChatCompare = chatId;
  }, [chatId, socketConnected]);
  

  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (
      newMessageRecieved: Message & { chat: { _id: string } }
    ) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare !== newMessageRecieved.chat._id
      ) {
        console.log("Message received in a different chat, not updating UI");
      } else {
        setMessages((prevMessages) => [...prevMessages, newMessageRecieved]);
        // console.log(newMessageRecieved.content);
      }
    };

    socket.on("message recieved", handleMessageReceived);

    return () => {
      socket.off("message recieved", handleMessageReceived); // Clean up on unmount
    };
  }, []);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading, messages]);

  const handleSendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !chatId) return;

    try {
      const response = await api.post("/messages", {
        content,
        chatId,
      });

      const newMsg: Message = response.data;
      setMessages((prev = []) => [...prev, newMsg]);
      setNewMessage("");

      socket.emit("new message", newMsg);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length > 0 ? (
          messages.map((message) => {
            const isOwn = message.sender._id === user?._id;
            return (
              <div
                key={message._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-2xl items-start space-x-3 ${
                    isOwn ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={message.sender.photo || "/placeholder.svg"}
                    />
                    <AvatarFallback>
                      {message.sender.username?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`${isOwn ? "text-right" : "text-left"}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-300">
                        {message.sender.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl break-words max-w-md ${
                        isOwn
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "bg-gray-700 text-gray-100"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500">No messages yet.</div>
        )}
        <div ref={messagesEndRef} />
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
              disabled={!chatId || loading}
              className="bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500 rounded-2xl py-4 px-6 text-lg resize-none disabled:opacity-50"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !chatId || loading}
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
