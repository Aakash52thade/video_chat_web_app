import express from 'express';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import { createServer } from "http";  
// We need Node's raw HTTP server because Socket.io attaches to it directly.
// app.listen() creates one internally, but we need a reference to it.
import { Server } from "socket.io"; // Socket.io server class

import authRoutes from "./routes/auth.route.js"
import userRoutes from "./routes/user.route.js"
import chatRoutes from "./routes/chat.route.js"

import cors from "cors";
import path from "path";
import { connectDB } from "./lib/db.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const __dirname = path.resolve();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000"
];

// ── All your existing middleware — UNTOUCHED ──────────────────
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));
app.use(express.json());
app.use((req, res, next) => {
  console.log("Incoming body:", req.body);
  next();
});
app.use(cookieParser());

// ── All your existing routes — UNTOUCHED ─────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/my-project/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/my-project", "dist", "index.html"));
  });
}

// ── NEW: Wrap Express app in a raw HTTP server ────────────────
// Socket.io needs to "upgrade" HTTP connections to WebSocket.
// That upgrade happens at the HTTP server level, not the Express level.
// So instead of: app.listen(PORT)
// We do: createServer(app) → then attach Socket.io → then listen.
const httpServer = createServer(app);

// ── NEW: Create Socket.io server ─────────────────────────────
const io = new Server(httpServer, {
  cors: {
    // Socket.io has its own CORS config separate from Express.
    // This is because WebSocket connections bypass Express middleware.
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// ── NEW: Track who is online ──────────────────────────────────
// Map<userId, socketId>
// When user logs in → we store their userId → socketId mapping.
// This lets us find WHICH socket to send a call to, given a userId.
const onlineUsers = new Map();

// ── NEW: Track rooms for WebRTC ───────────────────────────────
// Map<roomId, Set<socketId>>
// A "room" is just a shared ID that both callers join.
// Socket.io uses rooms internally to group sockets.
const rooms = new Map();

// io.on("connection") fires every time a new client connects
io.on("connection", (socket) => {
  // 'socket' represents ONE connected client (one browser tab)
  console.log("New socket connected:", socket.id);

  // ── PRESENCE: user comes online ──────────────────────────────
  // Frontend emits this right after connecting, passing their userId.
  // We store the mapping so we can find this socket later by userId.
  socket.on("user:online", (userId) => {
    if (!userId) return;
    onlineUsers.set(userId, socket.id);
    socket.data.userId = userId; // store on socket for cleanup on disconnect

    // Broadcast updated online list to ALL connected clients
    // so any component showing "online" indicators updates in real time
    io.emit("users:online", Array.from(onlineUsers.keys()));
  });

  // Frontend can ask "who's online right now?" at any time
  socket.on("users:get-online", () => {
    socket.emit("users:online", Array.from(onlineUsers.keys()));
  });

  // ── CALL SIGNALING ────────────────────────────────────────────
  // These 4 events handle the "phone ringing" phase BEFORE WebRTC starts.
  // WebRTC needs both users to agree to connect first.

  // Step 1: Caller clicks "Call" button → emits this
  socket.on("call:initiate", ({ targetUserId, callerId, callerName, callerPic, roomId }) => {
    const targetSocketId = onlineUsers.get(targetUserId);
    if (targetSocketId) {
      // Forward the call notification to the target user's socket
      io.to(targetSocketId).emit("call:incoming", { callerId, callerName, callerPic, roomId });
    } else {
      // Target is not online — tell the caller immediately
      socket.emit("call:user-offline", { targetUserId });
    }
  });

  // Step 2a: Target accepts → tell the caller to proceed
  socket.on("call:accept", ({ callerId, roomId }) => {
    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call:accepted", { roomId });
    }
  });

  // Step 2b: Target rejects → tell the caller it was rejected
  socket.on("call:reject", ({ callerId }) => {
    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) io.to(callerSocketId).emit("call:rejected");
  });

  // Caller cancels before target picks up
  socket.on("call:cancel", ({ targetUserId }) => {
    const targetSocketId = onlineUsers.get(targetUserId);
    if (targetSocketId) io.to(targetSocketId).emit("call:cancelled");
  });

  // ── ROOM: both users join the same room after call is accepted ──
  socket.on("room:join", ({ roomId }) => {
    socket.join(roomId); // Socket.io built-in: adds this socket to the room

    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    const room = rooms.get(roomId);
    const existingPeers = Array.from(room); // peers already waiting in the room

    room.add(socket.id);
    socket.data.roomId = roomId;

    // Tell the newcomer about everyone already in the room.
    // The newcomer will initiate WebRTC offers TO each of those peers.
    socket.emit("room:peers", { peers: existingPeers });

    // Tell existing peers that someone new joined.
    // They'll wait for an offer from the newcomer.
    socket.to(roomId).emit("room:peer-joined", { peerId: socket.id });
  });

  // ── WEBRTC SIGNALING ──────────────────────────────────────────
  // WebRTC needs 3 things to establish a peer-to-peer connection:
  // 1. Offer  (caller → callee): "here are my connection capabilities"
  // 2. Answer (callee → caller): "here are mine"
  // 3. ICE candidates (both ways): "here are the network paths to reach me"
  // Socket.io is just the messenger — it relays these between peers.
  // The actual video data travels directly peer-to-peer, NOT through your server.

  socket.on("webrtc:offer", ({ offer, targetSocketId }) => {
    // Forward the offer to a specific peer (by their socket ID)
    io.to(targetSocketId).emit("webrtc:offer", { offer, fromSocketId: socket.id });
  });

  socket.on("webrtc:answer", ({ answer, targetSocketId }) => {
    io.to(targetSocketId).emit("webrtc:answer", { answer, fromSocketId: socket.id });
  });

  socket.on("webrtc:ice-candidate", ({ candidate, targetSocketId }) => {
    // ICE candidates trickle in continuously as the browser discovers
    // network paths. We relay each one as it arrives.
    io.to(targetSocketId).emit("webrtc:ice-candidate", { candidate, fromSocketId: socket.id });
  });

  // ── CLEANUP ───────────────────────────────────────────────────
  socket.on("room:leave", ({ roomId }) => leaveRoom(socket, roomId));

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);

    // Remove from online users map → other users see them go offline
    if (socket.data.userId) {
      onlineUsers.delete(socket.data.userId);
      io.emit("users:online", Array.from(onlineUsers.keys()));
    }

    // Clean up any room they were in → tells their peer the call ended
    if (socket.data.roomId) leaveRoom(socket, socket.data.roomId);
  });
});

// Extracted into a function because both "room:leave" and "disconnect" need it
function leaveRoom(socket, roomId) {
  socket.leave(roomId);
  // Notify remaining peers so they can close their WebRTC connection
  socket.to(roomId).emit("room:peer-left", { peerId: socket.id });

  if (rooms.has(roomId)) {
    const room = rooms.get(roomId);
    room.delete(socket.id);
    if (room.size === 0) rooms.delete(roomId); // clean up empty rooms
  }
  socket.data.roomId = null;
}

// ── Start the HTTP server (not app.listen anymore!) ───────────
// httpServer handles both regular HTTP (Express) and WebSocket (Socket.io)
// on the SAME port. No extra port needed.
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});


// ok listen al the project work well but when i try to send the friend request then the frienreqt goes but not recived and show incoming body is empty {} so check and tell me also what did i wnet wrong here is the repo link   