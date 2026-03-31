import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useWebRTC } from "../hooks/useWebRTC";

const WebRTCCallPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // All the WebRTC complexity lives in this hook.
  // This component just displays the streams.
  const { localStream, remoteStream, isConnected, error, endCall } = useWebRTC(roomId);

  // We use refs for <video> elements because:
  // - Video elements are controlled via the DOM (.srcObject property)
  // - We don't want re-renders when the stream changes
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleEndCall = () => {
    endCall();
    navigate("/");
  };

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-error text-xl">{error}</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-base-300 flex flex-col">
      
      {/* Status bar */}
      <div className="p-4 flex items-center justify-between bg-base-100 shadow">
        <span className="font-semibold">Video Call — Room: {roomId}</span>
        <span className={`badge ${isConnected ? "badge-success" : "badge-warning"}`}>
          {isConnected ? "Connected" : "Connecting..."}
        </span>
      </div>

      {/* Video area */}
      <div className="flex-1 relative flex items-center justify-center">
        
        {/* Remote video — full size */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Local video — picture-in-picture (bottom right) */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted          // mute your OWN audio so you don't hear yourself echo
          className="absolute bottom-6 right-6 w-48 h-36 object-cover rounded-xl border-2 border-base-100 shadow-lg"
        />

        {/* Waiting message if remote not connected yet */}
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-300/80">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg mb-4" />
              <p className="text-lg">Waiting for the other person to join...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-base-100 flex justify-center">
        <button
          onClick={handleEndCall}
          className="btn btn-error btn-lg rounded-full px-12"
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default WebRTCCallPage;