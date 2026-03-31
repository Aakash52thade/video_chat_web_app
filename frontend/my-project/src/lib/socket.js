import {io} from "socket.io-client"

//in dev, your backend runs at 5001 or whatever port;
//in production, frontend and backend are on the same domain so we use;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

//we create one socket instance for the whole app
//if we created a new socket every time a component mounts.
//we'd have dozens of duplicate connections.
const socket = io(SOCKET_URL, {
    autoConnect: false,
    //don't connect immediately on import
    //we want to connect only after the user is logged in
    //so we can send their userId with the connection
    withCredentials: true,
    //send cookies with the socket connection (same as axios withcredentials).
});

export const connectSocket = (userId) => {
    if(!socket.connected){
        socket.connect();
        //tell the server "this socket belong to userId"
        //the server stores this in the onlineUsers map
        socket.emit("user:online", userId);
    }
};

export const disconnectSocket = () => {
    if(socket.connected) {
        socket.disconnect();
    }
}

export default socket;