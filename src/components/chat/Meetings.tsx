import { useState } from "react";
import { Button } from "../ui/button";
import { Video, Users, Clock, Calendar, Loader2, FileText } from "lucide-react";
import type { Meeting } from "@/types";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";

type MeetingProps = {
  meeting?: Meeting;
  onStatusChange?: () => void; // callback to refresh parent list
};

const STATUS_COLORS: Record<Meeting["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  scheduled: "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300",
  ended: "bg-muted text-muted-foreground border-border",
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
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a meeting from the sidebar to view details.</p>
      </div>
    );
  }
  const scheduledDate = meeting.scheduledAt ? new Date(meeting.scheduledAt) : null;
  const canJoin = meeting.status === "active" || (meeting.status === "scheduled" && (!scheduledDate || scheduledDate.getTime() <= Date.now() + 15 * 60_000));

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
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to update meeting status."));
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
            <h1 className="text-3xl font-bold text-foreground truncate">
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
            {meeting.status !== "ended" && canJoin && (
              <Link to={`/meeting/${meeting.id}`}>
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Video className="w-4 h-4" />
                  Join Meeting
                </Button>
              </Link>
            )}
            {meeting.status === "scheduled" && !canJoin && <Button disabled variant="outline" className="gap-2"><Clock className="h-4 w-4" /> Available 15 min before</Button>}
            {meeting.status === "active" && meeting.canManage && (
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
        <div className="bg-surface border border-border shadow-sm rounded-2xl p-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6">
            Meeting Details
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Participants</p>
                <p className="text-lg font-semibold text-foreground">
                  {meeting.participants}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
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
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p className="text-lg font-semibold text-foreground">
                  {meeting.duration}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Scheduled Time</p>
                <p className="text-lg font-semibold text-foreground">
                  {scheduledDate ? scheduledDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : meeting.scheduledTime}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-600/30 flex items-center justify-center flex-shrink-0">
                <Video className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Room ID</p>
                <p className="text-sm font-mono text-foreground/80 break-all">
                  {meeting.id}
                </p>
              </div>
            </div>
          </div>
          {meeting.description && <div className="mt-8 border-t border-border pt-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/12 text-sky-700 dark:text-sky-300"><FileText className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">Description</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{meeting.description}</p></div></div></div>}
        </div>

        {/* ── Join CTA (when active) ───────────────────────────── */}
        {meeting.status === "active" && (
          <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-emerald-700 dark:text-emerald-300 font-semibold">
                This meeting is live right now
              </p>
              <p className="text-emerald-700 dark:text-emerald-200 text-sm mt-1">
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
          <div className="rounded-2xl border border-border bg-muted/50 p-6 text-center">
            <p className="text-muted-foreground font-medium">
              This meeting has ended.
            </p>
            <p className="text-muted-foreground/80 text-sm mt-1">
              You can view the details above for reference.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Meetings;
