import { useState } from "react";
import { Button } from "../ui/button";
import { Video, Users, Clock, Calendar, Loader2 } from "lucide-react";
import type { Meeting } from "@/types";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/axiosInstance";

type MeetingProps = {
  meeting?: Meeting;
  onStatusChange?: () => void; // callback to refresh parent list
};

const STATUS_COLORS: Record<Meeting["status"], string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  scheduled: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  ended: "bg-gray-600/20 text-gray-400 border-gray-600/30",
};

const STATUS_DOT: Record<Meeting["status"], string> = {
  active: "bg-emerald-500",
  scheduled: "bg-amber-500",
  ended: "bg-gray-500",
};

const Meetings = ({ meeting, onStatusChange }: MeetingProps) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!meeting) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select a meeting from the sidebar to view details.</p>
      </div>
    );
  }

  const handleMarkEnded = async () => {
    if (!meeting.meetingDbId) {
      toast.error("Meeting ID not available — refresh and try again.");
      return;
    }
    setUpdatingStatus(true);
    try {
      await api.patch(`/meet/${meeting.meetingDbId}/status`, {
        status: "ended",
      });
      toast.success("Meeting marked as ended.");
      onStatusChange?.();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error || "Failed to update meeting status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white truncate">
              {meeting.name}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                  STATUS_COLORS[meeting.status] ?? STATUS_COLORS.scheduled
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    STATUS_DOT[meeting.status] ?? STATUS_DOT.scheduled
                  } animate-pulse`}
                />
                {meeting.status.charAt(0).toUpperCase() +
                  meeting.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {meeting.status !== "ended" && (
              <Link to={`/meeting/${meeting.id}`}>
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Video className="w-4 h-4" />
                  Join Meeting
                </Button>
              </Link>
            )}
            {meeting.status === "active" && (
              <Button
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-900/30 gap-2"
                onClick={handleMarkEnded}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                End Meeting
              </Button>
            )}
          </div>
        </div>

        {/* ── Details Card ────────────────────────────────────── */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
            Meeting Details
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Participants</p>
                <p className="text-lg font-semibold text-white">
                  {meeting.participants}{" "}
                  <span className="text-sm font-normal text-gray-400">
                    {meeting.participants === 1 ? "person" : "people"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-600/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Duration</p>
                <p className="text-lg font-semibold text-white">
                  {meeting.duration}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Scheduled Time</p>
                <p className="text-lg font-semibold text-white">
                  {meeting.scheduledTime}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-600/30 flex items-center justify-center flex-shrink-0">
                <Video className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Room ID</p>
                <p className="text-sm font-mono text-gray-300 break-all">
                  {meeting.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Join CTA (when active) ───────────────────────────── */}
        {meeting.status === "active" && (
          <div className="rounded-2xl border border-emerald-600/30 bg-emerald-950/30 p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-emerald-300 font-semibold">
                This meeting is live right now
              </p>
              <p className="text-emerald-700 text-sm mt-1">
                Click Join Meeting to enter the video call.
              </p>
            </div>
            <Link to={`/meeting/${meeting.id}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 whitespace-nowrap">
                <Video className="w-4 h-4" />
                Join Now
              </Button>
            </Link>
          </div>
        )}

        {/* ── Ended state ─────────────────────────────────────── */}
        {meeting.status === "ended" && (
          <div className="rounded-2xl border border-gray-700/30 bg-gray-900/30 p-6 text-center">
            <p className="text-gray-500 font-medium">
              This meeting has ended.
            </p>
            <p className="text-gray-600 text-sm mt-1">
              You can view the details above for reference.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Meetings;
