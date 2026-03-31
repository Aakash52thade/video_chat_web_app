import { createContext, useContext, useEffect } from "react";
import socket, { connectSocket, disconnectSocket } from "../lib/socket";
import useAuthUser from "../hooks/useAuthUser";

// Context just holds the socket instance.
// Any component that calls useSocket() gets access to the same socket.
const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { authUser } = useAuthUser();

  useEffect(() => {
    if (authUser?._id) {
      // User is logged in → connect and announce presence
      connectSocket(authUser._id);

      // If the socket reconnects (e.g. after network drop),
      // re-announce presence so the server updates onlineUsers Map
      socket.on("connect", () => {
        socket.emit("user:online", authUser._id);
      });
    } else {
      // User logged out → disconnect
      disconnectSocket();
    }

    return () => {
      socket.off("connect"); // cleanup listener on re-render
    };
  }, [authUser?._id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);