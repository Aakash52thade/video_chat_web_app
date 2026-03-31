import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import socket from "../lib/socket";

// This component lives at the ROOT of the app (in App.jsx)
// so it can show the incoming call popup on ANY page.
const IncomingCallModal = () => {
  const [incomingCall, setIncomingCall] = useState(null);
  // incomingCall = { callerId, callerName, callerPic, roomId } or null
  
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for incoming calls from the server
    socket.on("call:incoming", (callData) => {
      setIncomingCall(callData);
    });

    // If caller cancels before we pick up — dismiss the modal
    socket.on("call:cancelled", () => {
      setIncomingCall(null);
    });

    return () => {
      socket.off("call:incoming");
      socket.off("call:cancelled");
    };
  }, []);

  const handleAccept = () => {
    // Tell the server we accepted → server notifies the caller
    socket.emit("call:accept", {
      callerId: incomingCall.callerId,
      roomId: incomingCall.roomId,
    });
    setIncomingCall(null);
    // Navigate to the WebRTC call page with the shared roomId
    navigate(`/webrtc-call/${incomingCall.roomId}`);
  };

  const handleReject = () => {
    socket.emit("call:reject", { callerId: incomingCall.callerId });
    setIncomingCall(null);
  };

  // Nothing to show if no incoming call
  if (!incomingCall) return null;

  return (
    // Full screen overlay
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-2xl p-8 flex flex-col items-center gap-6 shadow-2xl w-80">
        
        {/* Caller info */}
        <img
          src={incomingCall.callerPic || "/avatar.png"}
          alt={incomingCall.callerName}
          className="w-24 h-24 rounded-full object-cover border-4 border-primary"
        />
        <div className="text-center">
          <p className="text-sm text-base-content/60 mb-1">Incoming video call from</p>
          <h3 className="text-xl font-bold">{incomingCall.callerName}</h3>
        </div>

        {/* Accept / Reject buttons */}
        <div className="flex gap-6">
          <button
            onClick={handleReject}
            className="btn btn-circle btn-error btn-lg"
            title="Reject"
          >
            ✕
          </button>
          <button
            onClick={handleAccept}
            className="btn btn-circle btn-success btn-lg"
            title="Accept"
          >
            📹
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;