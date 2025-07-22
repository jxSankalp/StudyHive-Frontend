"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";

type Props = {
  chatId: string;
  onSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CreateMeetingModal = ({ chatId, onSuccess, open, onOpenChange }: Props) => {
  const [meetName, setMeetName] = useState("");
  const [loading, setLoading] = useState(false);

  const createMeeting = async () => {
    setLoading(true);
    try {
      await axios.post("/api/meet/create-call", {
        chatId,
        meetName,
      });
      onOpenChange(false);
      setMeetName("");
      onSuccess?.();
    } catch (err) {
      console.error("Error creating meeting:", err);
    } 
    // finally {
    //   setLoading(false);
    // }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border border-gray-700">
        <h2 className="text-lg text-white mb-4 font-semibold">Create New Meeting</h2>
        <Input
          value={meetName}
          onChange={(e) => setMeetName(e.target.value)}
          placeholder="Enter meeting name"
          className="mb-4 text-white"
        />
        <Button
          disabled={loading || !meetName}
          onClick={createMeeting}
          className="w-full"
        >
          {loading ? "Creating..." : "Create"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMeetingModal;
