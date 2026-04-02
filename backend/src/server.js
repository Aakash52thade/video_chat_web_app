import express from 'express';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.route.js"
import userRoutes from "./routes/user.route.js"
import chatRoutes from "./routes/chat.route.js"

import cors from "cors";
import path from "path";
import { connectDB } from "./lib/db.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;
const __dirname = path.resolve();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:8001",
  process.env.FRONTEND_URL, // add your Render frontend URL here via env var
].filter(Boolean); // remove undefined if FRONTEND_URL not set

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/my-project/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/my-project", "dist", "index.html"));
  });
}

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
  // important for Render — it uses proxies
  transports: ["websocket", "polling"],
});

// ... rest of your socket code stays exactly the same
const onlineUsers = new Map();
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);

  socket.on("user:online", (userId) => {
    if (!userId) return;
    onlineUsers.set(userId, socket.id);
    socket.data.userId = userId;
    io.emit("users:online", Array.from(onlineUsers.keys()));
  });

  socket.on("users:get-online", () => {
    socket.emit("users:online", Array.from(onlineUsers.keys()));
  });

  socket.on("call:initiate", ({ targetUserId, callerId, callerName, callerPic, roomId }) => {
    const targetSocketId = onlineUsers.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:incoming", { callerId, callerName, callerPic, roomId });
    } else {
      socket.emit("call:user-offline", { targetUserId });
    }
  });

  socket.on("call:accept", ({ callerId, roomId }) => {
    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call:accepted", { roomId });
    }
  });

  socket.on("call:reject", ({ callerId }) => {
    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) io.to(callerSocketId).emit("call:rejected");
  });

  socket.on("call:cancel", ({ targetUserId }) => {
    const targetSocketId = onlineUsers.get(targetUserId);
    if (targetSocketId) io.to(targetSocketId).emit("call:cancelled");
  });

  socket.on("room:join", ({ roomId }) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    const room = rooms.get(roomId);
    const existingPeers = Array.from(room);
    room.add(socket.id);
    socket.data.roomId = roomId;
    socket.emit("room:peers", { peers: existingPeers });
    socket.to(roomId).emit("room:peer-joined", { peerId: socket.id });
  });

  socket.on("webrtc:offer", ({ offer, targetSocketId }) => {
    io.to(targetSocketId).emit("webrtc:offer", { offer, fromSocketId: socket.id });
  });

  socket.on("webrtc:answer", ({ answer, targetSocketId }) => {
    io.to(targetSocketId).emit("webrtc:answer", { answer, fromSocketId: socket.id });
  });

  socket.on("webrtc:ice-candidate", ({ candidate, targetSocketId }) => {
    io.to(targetSocketId).emit("webrtc:ice-candidate", { candidate, fromSocketId: socket.id });
  });

  socket.on("room:leave", ({ roomId }) => leaveRoom(socket, roomId));

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    if (socket.data.userId) {
      onlineUsers.delete(socket.data.userId);
      io.emit("users:online", Array.from(onlineUsers.keys()));
    }
    if (socket.data.roomId) leaveRoom(socket, socket.data.roomId);
  });
});

function leaveRoom(socket, roomId) {
  socket.leave(roomId);
  socket.to(roomId).emit("room:peer-left", { peerId: socket.id });
  if (rooms.has(roomId)) {
    const room = rooms.get(roomId);
    room.delete(socket.id);
    if (room.size === 0) rooms.delete(roomId);
  }
  socket.data.roomId = null;
}

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});