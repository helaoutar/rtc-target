"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const config: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
  iceTransportPolicy: "all",
};

const socket = io("ws://signaling-862b446e30a8.herokuapp.com");

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection>();

  useEffect(() => {
    const go = async () => {
      pcRef.current = new RTCPeerConnection(config);
      pcRef.current.onicecandidate = (e) => onIceCandidate(e);
      pcRef.current.onconnectionstatechange = (e) =>
        console.log("connection change", e);
      pcRef.current.ontrack = gotRemoteStream;
      pcRef.current.onnegotiationneeded = (e) => console.log("nego needed", e);

      console.log(pcRef.current);

      socket.on("offer", async (args: RTCSessionDescriptionInit) => {
        console.log("offer", args);
        await pcRef.current!.setRemoteDescription(args);

        const desc = await pcRef.current!.createAnswer();
        await pcRef.current!.setLocalDescription(desc);
        socket.emit("signal-answer", desc);
      });

      socket.on("ice-candidate1", (args: RTCIceCandidate) => {
        console.log("received candidate from 1", args);
        pcRef.current!.addIceCandidate(args);
      });
    };

    go();
  }, []);

  const gotRemoteStream = (e: RTCTrackEvent) => {
    console.log("gotRemoteStream", e);
    if (videoRef.current!.srcObject !== e.streams[0]) {
      videoRef.current!.srcObject = e.streams[0];
    }
  };

  const onIceCandidate = (event: RTCPeerConnectionIceEvent) => {
    socket.emit("send-ice-candidate2", event.candidate);
  };

  return <video ref={videoRef} playsInline autoPlay muted></video>;
}
