"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Video } from "lucide-react";
import api from "@/lib/axiosInstance";
import { toast } from "sonner";

type Props = {
  chatId: string;
  onSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CreateMeetingModal = ({ chatId, onSuccess, open, onOpenChange }: Props) => {
  const [meetName, setMeetName] = useState("");
  const [loading, setLoading] = useState(false);

  const createMeeting = useCallback(async () => {
    const trimmedName = meetName.trim();

    if (!chatId) {
      toast.error("Missing workspace. Please reopen the workspace.");
      return;
    }

    if (!trimmedName) {
      toast.error("Please enter a meeting name.");
      return;
    }

    if (trimmedName.length > 100) {
      toast.error("Meeting name must be 100 characters or fewer.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/meet/create-call", {
        chatId,
        meetName: trimmedName,
      });
      toast.success("Meeting created successfully!");
      onOpenChange(false);
      setMeetName("");
      onSuccess?.();
    } catch (err: any) {
      console.error("[CreateMeetingModal] error:", err);
      const message =
        err?.response?.data?.error ||
        "Failed to create meeting. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [chatId, meetName, onOpenChange, onSuccess]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && meetName.trim()) {
      createMeeting();
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setMeetName("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-green-600/20 border border-green-600/30 flex items-center justify-center">
              <Video className="w-5 h-5 text-green-400" />
            </div>
            <DialogTitle className="text-lg text-white font-semibold">
              Create New Meeting
            </DialogTitle>
          </div>
          <p className="text-gray-400 text-sm">
            A video call room will be created for this workspace.
          </p>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div>
            <label
              htmlFor="meeting-name"
              className="block text-sm text-gray-400 mb-1.5"
            >
              Meeting Name
            </label>
            <Input
              id="meeting-name"
              value={meetName}
              onChange={(e) => setMeetName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Weekly Sync"
              className="text-white bg-gray-800 border-gray-700 placeholder:text-gray-600 focus:border-green-500"
              maxLength={100}
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-gray-600 mt-1 text-right">
              {meetName.length}/100
            </p>
          </div>

          <Button
            disabled={loading || !meetName.trim()}
            onClick={createMeeting}
            className="w-full bg-green-600 hover:bg-green-700 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                Create Meeting
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMeetingModal;
