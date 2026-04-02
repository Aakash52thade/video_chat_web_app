import {io} from "socket.io-client"

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
// In production on Render, frontend + backend are same domain
// so window.location.origin automatically gives the right URL

const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket", "polling"], // try websocket first, fallback to polling
});

export const connectSocket = (userId) => {
    if(!socket.connected){
        socket.connect();
        socket.emit("user:online", userId);
    }
};

export const disconnectSocket = () => {
    if(socket.connected) {
        socket.disconnect();
    }
}

export default socket;