import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import type { Call, User } from "@stream-io/video-react-sdk";
import { LogOut, OctagonX } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import api, { getApiErrorMessage } from "@/lib/axiosInstance";
import "@stream-io/video-react-sdk/dist/css/styles.css";

type MeetingSession = {
  client: StreamVideoClient;
  call: Call;
  ready: Promise<void>;
  references: number;
  cleanupTimer?: ReturnType<typeof setTimeout>;
};

const sessions = new Map<string, MeetingSession>();

const acquireSession = (apiKey: string, user: User, token: string, callId: string) => {
  const key = `${apiKey}:${user.id}:${callId}`;
  const existing = sessions.get(key);
  if (existing) {
    if (existing.cleanupTimer) clearTimeout(existing.cleanupTimer);
    existing.cleanupTimer = undefined;
    existing.references += 1;
    return { key, session: existing };
  }

  const client = StreamVideoClient.getOrCreateInstance({ apiKey, user, token });
  const call = client.call("default", callId);
  const session: MeetingSession = {
    client,
    call,
    references: 1,
    ready: call.join({ create: false }).then(() => undefined),
  };
  // Register before awaiting join so concurrent React effects share one call.
  sessions.set(key, session);
  return { key, session };
};

const releaseSession = (key: string) => {
  const session = sessions.get(key);
  if (!session) return;
  session.references = Math.max(0, session.references - 1);
  if (session.references > 0) return;

  // Strict Mode remounts immediately in development. A short grace period lets
  // that remount reuse the same SDK session instead of publishing a second feed.
  session.cleanupTimer = setTimeout(() => {
    if (session.references > 0) return;
    sessions.delete(key);
    void session.ready
      .catch(() => undefined)
      .then(() => session.call.leave().catch(() => undefined))
      .then(() => session.client.disconnectUser().catch(() => undefined));
  }, 300);
};

type MeetingRoomProps = {
  canManage: boolean;
  ending: boolean;
  onLeave: () => void;
  onEnd: () => void;
};

const MeetingRoom = ({ canManage, ending, onLeave, onEnd }: MeetingRoomProps) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  if (callingState === CallingState.IDLE || callingState === CallingState.JOINING) {
    return <MeetingNotice><Spinner /><span>Joining meeting…</span></MeetingNotice>;
  }

  if (callingState === CallingState.LEFT) {
    return (
      <MeetingNotice>
        <p className="text-lg font-medium">This meeting has ended or you have left.</p>
        <button onClick={onLeave} className="meeting-primary-button">Return to workspace</button>
      </MeetingNotice>
    );
  }

  return (
    <StreamTheme className="meeting-theme relative h-screen w-full">
      <SpeakerLayout participantsBarPosition="bottom" />
      <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3">
        <CallControls onLeave={onLeave} />
        {canManage && (
          <button
            type="button"
            onClick={onEnd}
            disabled={ending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-red-600 px-4 text-sm font-semibold text-white shadow-lg hover:bg-red-500 disabled:cursor-wait disabled:opacity-60"
            title="End this meeting for everyone"
          >
            <OctagonX className="h-4 w-4" />
            {ending ? "Ending…" : "End for all"}
          </button>
        )}
      </div>
    </StreamTheme>
  );
};

const MeetingNotice = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
    {children}
  </div>
);

const MeetingPage = () => {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [meetingDbId, setMeetingDbId] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [ending, setEnding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLeave = useCallback(() => navigate(-1), [navigate]);

  const handleEnd = useCallback(async () => {
    if (!meetingDbId || ending) return;
    setEnding(true);
    try {
      await api.patch(`/meet/${meetingDbId}/status`, { status: "ended" });
      navigate(-1);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not end the meeting."));
      setEnding(false);
    }
  }, [ending, meetingDbId, navigate]);

  useEffect(() => {
    if (!callId) {
      setError("Call ID is missing from the URL.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let acquiredKey: string | null = null;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const initialize = async () => {
      try {
        const [userResponse, tokenResponse] = await Promise.all([
          api.get("/users/me", { signal: controller.signal }),
          api.post("/meet/get-token", { callId }, { signal: controller.signal }),
        ]);
        if (cancelled) return;

        const dbUser = userResponse.data;
        const { token, meetingDbId: dbId, canManage: mayManage } = tokenResponse.data;
        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        if (!dbUser?._id) throw new Error("Could not load your user profile.");
        if (!token) throw new Error("Failed to obtain a meeting token.");
        if (!apiKey) throw new Error("Stream API key is not configured.");

        const user: User = {
          id: dbUser._id,
          name: dbUser.username || "Unknown",
          image: dbUser.photo || undefined,
        };
        const acquired = acquireSession(apiKey, user, token, callId);
        acquiredKey = acquired.key;
        await acquired.session.ready;
        if (cancelled) return;

        setClient(acquired.session.client);
        setCall(acquired.session.call);
        setMeetingDbId(dbId ?? null);
        setCanManage(Boolean(mayManage));
      } catch (err) {
        if (cancelled) return;
        setError(getApiErrorMessage(err, "Could not join the meeting."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
      controller.abort();
      if (acquiredKey) releaseSession(acquiredKey);
    };
  }, [callId]);

  if (isLoading) return <MeetingNotice><Spinner /><span>Preparing meeting room…</span></MeetingNotice>;

  if (error || !client || !call) {
    return (
      <MeetingNotice>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-500"><LogOut /></div>
        <h2 className="text-xl font-semibold">Could not join the meeting</h2>
        <p className="max-w-sm text-muted-foreground">{error || "An unexpected error occurred."}</p>
        <button onClick={handleLeave} className="meeting-primary-button">Go back</button>
      </MeetingNotice>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <MeetingRoom canManage={canManage} ending={ending} onLeave={handleLeave} onEnd={handleEnd} />
      </StreamCall>
    </StreamVideo>
  );
};

export default MeetingPage;
