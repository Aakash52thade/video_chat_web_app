import express from 'express';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js"
import userRoutes from "./routes/user.route.js"
import chatRoutes from "./routes/chat.route.js"

//CORS
import cors from "cors";
import path from "path";



import {connectDB} from "./lib/db.js"
dotenv.config(); // dotenv.config() is importent to read env file;

//here we declear where request came from

const app = express();
const PORT = process.env.PORT ;

const __dirname = path.resolve();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"], // Add all your frontend ports
  credentials: true, // This is crucial for cookie-based authentication
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

app.use(express.json()); //here we do this, other wise modules 
                        //schema value will undefined for controller's

app.use((req, res, next) => {
  console.log("Incoming body:", req.body); // this will log every JSON body
  next();
});                        

app.use(cookieParser());

//we create sepcial route file for diff - different routes; ok;
app.use("/api/auth", authRoutes); // all routes starting point is {/api/auth}

app.use("/api/users", userRoutes);

app.use("/api/chat", chatRoutes);

// FIXED: Correct path for your structure
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/my-project/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/my-project", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
