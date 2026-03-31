import { useEffect, useRef, useState, useCallback } from "react";
import socket from "../lib/socket";

// ICE servers tell WebRTC HOW to find a path between two peers.
// STUN servers help peers discover their public IP address.
// (If both peers are on the same network, this isn't needed — but always include it.)
// For production, you'd add TURN servers here too (for users behind strict firewalls).
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useWebRTC = (roomId) => {
  const [localStream, setLocalStream] = useState(null);   // our camera/mic
  const [remoteStream, setRemoteStream] = useState(null); // the other person's camera/mic
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // useRef for things that need to persist between renders
  // but whose changes should NOT trigger a re-render
  const peerConnectionRef = useRef(null); // the WebRTC connection object
  const localStreamRef = useRef(null);    // local stream (ref for access in callbacks)
  const remoteStreamRef = useRef(new MediaStream()); // collect remote tracks here

  // ── Step 1: Get camera and microphone ──────────────────────────
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      setError("Could not access camera/microphone. Check permissions.");
      throw err;
    }
  }, []);

  // ── Step 2: Create the RTCPeerConnection ───────────────────────
  const createPeerConnection = useCallback((targetSocketId) => {
    // RTCPeerConnection is the core WebRTC object.
    // It manages the entire lifecycle: signaling, codec negotiation, streaming.
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // As the browser discovers network paths (ICE candidates),
    // we immediately relay them to the other peer via Socket.io.
    // "Trickle ICE" — don't wait for all candidates, send them as they arrive.
    pc.onicecandidate = (event) => {
      if (event.candidate && targetSocketId) {
        socket.emit("webrtc:ice-candidate", {
          candidate: event.candidate,
          targetSocketId,
        });
      }
    };

    // When we receive a media track from the remote peer,
    // add it to our remoteStream so the <video> element can display it.
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });
      setRemoteStream(remoteStreamRef.current);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setIsConnected(true);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setIsConnected(false);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  // ── Step 3: Initiator creates and sends an offer ───────────────
  const initiateCall = useCallback(async (targetSocketId) => {
    const stream = await startLocalStream();
    const pc = createPeerConnection(targetSocketId);

    // Add our local tracks to the connection so the remote peer receives them
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // createOffer() generates an SDP (Session Description Protocol) blob.
    // SDP describes: what codecs we support, our media capabilities, etc.
    const offer = await pc.createOffer();

    // setLocalDescription "commits" the offer on our side
    await pc.setLocalDescription(offer);

    // Send the offer to the other peer via Socket.io
    socket.emit("webrtc:offer", { offer, targetSocketId });
  }, [startLocalStream, createPeerConnection]);

  // ── Step 4: Receiver handles incoming offer, sends answer ──────
  const handleOffer = useCallback(async (offer, fromSocketId) => {
    const stream = await startLocalStream();
    const pc = createPeerConnection(fromSocketId);

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // setRemoteDescription tells WebRTC about the caller's capabilities
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("webrtc:answer", { answer, targetSocketId: fromSocketId });
  }, [startLocalStream, createPeerConnection]);

  // ── Step 5: Caller receives the answer ────────────────────────
  const handleAnswer = useCallback(async (answer) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    }
  }, []);

  // ── Step 6: Both sides add ICE candidates as they arrive ───────
  const handleIceCandidate = useCallback(async (candidate) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    }
  }, []);

  // ── Cleanup: stop all tracks and close connection ──────────────
  const endCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (roomId) {
      socket.emit("room:leave", { roomId });
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [roomId]);

  // ── Socket.io listeners for WebRTC events ─────────────────────
  useEffect(() => {
    if (!roomId) return;

    // Join the room — server tells us who's already there (room:peers)
    socket.emit("room:join", { roomId });

    // room:peers fires once when we join — peers already in the room
    // We initiate a call TO each of them
    socket.on("room:peers", ({ peers }) => {
      peers.forEach((peerId) => initiateCall(peerId));
    });

    // room:peer-joined fires when someone joins AFTER us
    // They will send us an offer, so we just wait
    socket.on("room:peer-joined", ({ peerId }) => {
      console.log("Peer joined room:", peerId);
      // The new peer will send an offer to us, handled in webrtc:offer below
    });

    // Incoming offer → send back an answer
    socket.on("webrtc:offer", ({ offer, fromSocketId }) => {
      handleOffer(offer, fromSocketId);
    });

    // Incoming answer → complete our end of the handshake
    socket.on("webrtc:answer", ({ answer }) => {
      handleAnswer(answer);
    });

    // Incoming ICE candidate → add to our peer connection
    socket.on("webrtc:ice-candidate", ({ candidate }) => {
      handleIceCandidate(candidate);
    });

    // Other peer left → end the call
    socket.on("room:peer-left", () => {
      setIsConnected(false);
      setRemoteStream(null);
    });

    return () => {
      // Always clean up socket listeners when component unmounts
      socket.off("room:peers");
      socket.off("room:peer-joined");
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice-candidate");
      socket.off("room:peer-left");
      endCall();
    };
  }, [roomId, initiateCall, handleOffer, handleAnswer, handleIceCandidate, endCall]);

  return { localStream, remoteStream, isConnected, error, endCall };
};