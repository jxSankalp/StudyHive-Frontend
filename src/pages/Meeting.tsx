"use client";

import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
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
import type { Call } from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "../../styles/meeting.css"; // create this to add layout styles if needed
import { useParams } from "react-router-dom";

const MeetingPage = () => {
  const { callId } = useParams();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
//   const [call, setCall] = useState<StreamCall | null>(null);
  const [call, setCall] = useState<Call | null>(null);

  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const initCall = async () => {
    try {

      const userRes = await fetch("/api/users/me");
      if (!userRes.ok) throw new Error("Failed to fetch user");

      const dbUser = await userRes.json();

      const tokenRes = await fetch("/api/meet/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: dbUser.clerkId }),
      });

      const { token } = await tokenRes.json();

    //   const client = new StreamVideoClient({
    //     apiKey: import.meta.env.REACT_APP_STREAM_API_KEY!,
    //     user: {
    //       id: dbUser.clerkId,
    //       name: dbUser.username,
    //       image: dbUser.image,
    //     },
    //     token,
    //   });
        const client = StreamVideoClient.getOrCreateInstance({
        apiKey: import.meta.env.REACT_APP_STREAM_API_KEY!,
        user: {
          id: dbUser.clerkId,
          name: dbUser.username,
          image: dbUser.image,
        },
        token,
      });

      console.log(dbUser);
      console.log(callId);
      const call = client.call("default", callId as string);
      await call.join({ create: true });

      setClient(client);
      setCall(call);
      setIsLoading(false);
    } catch (err) {
      console.error("Error initializing call:", err);
    }
  };

  initCall();

  return () => {
    client?.disconnectUser();
  };
}, [callId]);


  if (isLoading || !call) {
    return <div className="text-white p-4">Joining the meeting...</div>;
  }

  return (
    <StreamVideo client={client!}>
      <StreamTheme>
        <StreamCall call={call}>
          <MeetingUI />
        </StreamCall>
      </StreamTheme>
    </StreamVideo>
  );
};

const MeetingUI = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) {
    return <div className="text-white p-4">Connecting to participants...</div>;
  }

  return (
    <>
      <SpeakerLayout participantsBarPosition="bottom" />
      <CallControls />
    </>
  );
};

export default MeetingPage;
