"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  SpeakerLayout,
  CallControls,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import type { Call, User } from "@stream-io/video-react-sdk";
import { Spinner } from "@/components/ui/Spinner";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import api from "@/lib/axiosInstance";

// ─────────────────────────────────────────────────────────────
// MeetingRoom — rendered inside StreamCall context
// ─────────────────────────────────────────────────────────────
const MeetingRoom = ({ onLeave }: { onLeave: () => void }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  if (
    callingState === CallingState.IDLE ||
    callingState === CallingState.JOINING
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-white bg-gray-950">
        <Spinner />
        <span className="text-lg font-medium animate-pulse">
          Joining meeting…
        </span>
      </div>
    );
  }

  if (callingState === CallingState.LEFT) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-white bg-gray-950">
        <p className="text-lg">You have left the meeting.</p>
        <button
          onClick={onLeave}
          className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition"
        >
          Return to workspace
        </button>
      </div>
    );
  }

  return (
    // @ts-ignore
    <StreamTheme className="h-screen w-full bg-gray-950 text-white relative">
      {/* @ts-ignore */}
      <SpeakerLayout participantsBarPosition="bottom" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
        <CallControls onLeave={onLeave} />
      </div>
    </StreamTheme>
  );
};

// ─────────────────────────────────────────────────────────────
// MeetingPage — sets up the Stream client & joins the call
// ─────────────────────────────────────────────────────────────
const MeetingPage = () => {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs track the live instances so the cleanup closure always has fresh refs,
  // preventing "cleanup runs before client is set" race conditions.
  const clientRef = useRef<StreamVideoClient | null>(null);
  const callRef = useRef<Call | null>(null);
  // Guard against React StrictMode double-invoke / re-renders
  const initStarted = useRef(false);

  const handleLeave = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    if (!callId) {
      setError("Call ID is missing from the URL.");
      setIsLoading(false);
      return;
    }

    // Prevent duplicate initialisation (React 18 StrictMode double-effect)
    if (initStarted.current) return;
    initStarted.current = true;

    const initClientAndCall = async () => {
      try {
        // 1. Get current user profile
        const userRes = await api.get("/users/me");
        const dbUser = userRes.data;

        if (!dbUser?._id) throw new Error("Could not load your user profile.");

        // 2. Get a Stream token — backend now issues it for the authenticated user
        const tokenRes = await api.post("/meet/get-token", {});
        const { token } = tokenRes.data;
        if (!token) throw new Error("Failed to obtain a meeting token.");

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        if (!apiKey) throw new Error("Stream API key is not configured.");

        // 3. Build Stream user object
        const user: User = {
          id: dbUser._id,
          name: dbUser.username || "Unknown",
          image: dbUser.photo || "",
        };

        // 4. Create the video client and join the call
        const videoClient = new StreamVideoClient({ apiKey, user, token });
        const callInstance = videoClient.call("default", callId);

        await callInstance.join({ create: true });

        // Store in refs (for cleanup) and state (for render)
        clientRef.current = videoClient;
        callRef.current = callInstance;

        setClient(videoClient);
        setCall(callInstance);
      } catch (err: any) {
        console.error("[MeetingPage] setup error:", err);
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "An unknown error occurred."
        );
      } finally {
        setIsLoading(false);
      }
    };

    initClientAndCall();

    // Cleanup: leave call and disconnect client
    return () => {
      const cleanup = async () => {
        try {
          if (callRef.current) {
            await callRef.current.leave();
          }
        } catch (e) {
          console.warn("[MeetingPage] leave error (non-fatal):", e);
        }
        try {
          if (clientRef.current) {
            await clientRef.current.disconnectUser();
          }
        } catch (e) {
          console.warn("[MeetingPage] disconnect error (non-fatal):", e);
        }
        clientRef.current = null;
        callRef.current = null;
      };
      cleanup();
      setClient(null);
      setCall(null);
      initStarted.current = false;
    };
  }, [callId]);

  // ── Loading state ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-white bg-gray-950">
        <Spinner />
        <span className="text-lg font-medium animate-pulse">
          Preparing meeting room…
        </span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error || !client || !call) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 bg-gray-950">
        <div className="w-16 h-16 rounded-full bg-red-900/40 flex items-center justify-center text-red-400 text-3xl">
          ✕
        </div>
        <h2 className="text-xl font-semibold text-white">
          Could not join the meeting
        </h2>
        <p className="text-gray-400 text-center max-w-sm">
          {error || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={handleLeave}
          className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition"
        >
          Go back
        </button>
      </div>
    );
  }

  // ── Happy path ─────────────────────────────────────────────
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <MeetingRoom onLeave={handleLeave} />
      </StreamCall>
    </StreamVideo>
  );
};

export default MeetingPage;
