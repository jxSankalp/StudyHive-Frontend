"use client";

import { useEffect, useState } from "react";
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

// --- DARK THEME FIX ---
// Deeply customized theme ensuring every element has proper visibility
const darkTheme = {
  colors: {
    // Base colors
    background: "#121212",
    "video-background": "#121212",
    "overlay-background": "#1E1E1E",
    "panel-background": "#1E1E1E",

    // Text colors
    text: "#FFFFFF",
    "text-high-emphasis": "#FFFFFF",
    "text-low-emphasis": "#B0B0B0",
    "text-muted": "#AAAAAA",

    // Icon colors
    icon: "#FFFFFF",
    "icon-muted": "#BBBBBB",

    // Buttons
    "button-background": "#2D2D2D",
    "button-background-hover": "#3A3A3A",
    "button-text": "#FFFFFF",
    "button-icon": "#FFFFFF",

    // Menus
    "menu-background": "#2C2C2E",
    "menu-background-hover": "#3C3C3E",
    "menu-text": "#FFFFFF",

    // Participant details
    "participant-details-background": "rgba(0, 0, 0, 0.6)",

    // Status indicators
    "accent-primary": "#3B82F6",
    "accent-danger": "#EF4444",
    "accent-success": "#10B981",
  },
  variants: {
    button: {
      hangup: {
        backgroundColor: "#EF4444",
        color: "#FFFFFF",
        "&:hover": {
          backgroundColor: "#F87171",
        },
      },
    },
  },
};

// --- MEETING ROOM UI ---
// --- MEETING ROOM UI ---
const MeetingRoom = () => {
  const navigate = useNavigate();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  console.log("MeetingRoom rendering, callingState:", callingState);

  const handleLeave = () => {
    navigate(-1);
  };

  if (
    callingState === CallingState.IDLE ||
    callingState === CallingState.JOINING
  ) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-900">
        <Spinner />
        <span className="ml-2">Joining meeting...</span>
      </div>
    );
  }

  return (
    // @ts-ignore
    <StreamTheme className="h-screen w-full bg-gray-900 text-white relative">
      {/* @ts-ignore */}
      <SpeakerLayout participantsBarPosition="bottom" />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <CallControls onLeave={handleLeave} />
      </div>
    </StreamTheme>
  );
};

// --- MAIN MEETING PAGE ---
const MeetingPage = () => {
  const { callId } = useParams<{ callId: string }>();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!callId) {
      setError("Call ID is missing from the URL.");
      setIsLoading(false);
      return;
    }

    let videoClient: StreamVideoClient;
    let callInstance: Call;

    const initClientAndCall = async () => {
      try {
        const userRes = await api.get("/auth/me");
        const dbUser = userRes.data;

        const tokenRes = await api.post("/meet/get-token", { userId: dbUser._id });
        const { token } = tokenRes.data;

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        if (!apiKey) throw new Error("Stream API key is not configured.");

        const user: User = {
          id: dbUser._id,
          name: dbUser.username,
          image: dbUser.image,
        };

        videoClient = new StreamVideoClient({ apiKey, user, token });
        callInstance = videoClient.call("default", callId);

        await callInstance.join({ create: true });

        setClient(videoClient);
        setCall(callInstance);
      } catch (err: any) {
        console.error("Error setting up the meeting:", err);
        setError(err.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    initClientAndCall();

    return () => {
      const cleanup = async () => {
        if (callInstance) await callInstance.leave();
        if (videoClient) await videoClient.disconnectUser();
      };

      cleanup();
      setClient(null);
      setCall(null);
    };
  }, [callId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-900">
        <Spinner />
        <span className="ml-2">Preparing meeting room...</span>
      </div>
    );
  }

  if (error || !client || !call) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500 bg-gray-900">
        Error: {error || "Could not connect to the meeting. Please try again."}
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <MeetingRoom />
      </StreamCall>
    </StreamVideo>
  );
};

export default MeetingPage;
