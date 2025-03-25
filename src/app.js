import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectMongo from "./config/mongo.js"; // MongoDB connection
import authRoute from "./routes/authRoute.js";
import bookingRoute from "./routes/bookingRoute.js";
import messageRoute from "./routes/messageRoute.js"
import Message from "./models/messageModel.js"; // Import Message model

dotenv.config({ path: "./.env" });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

//  Connect to MongoDB
connectMongo();

//  Middleware Setup
app.use(
  cors({
    origin: "http://localhost:3000", // Change this if frontend is hosted elsewhere
    credentials: true, // Required for cookies in Postman & frontend
  })
);
app.use(helmet());
app.use(cookieParser());
app.use(compression());
app.use(express.json());

// ✅ WebSocket Handling
io.on("connection", (socket) => {
  console.log(`🟢 New client connected: ${socket.id}`);

  // ✅ Receive and Save Message
  socket.on("sendMessage", async (data) => {
    try {
      if (!data.senderId || !data.receiverId || !data.message) {
        throw new Error("Missing required fields");
      }

      // Save message to MongoDB
      const newMessage = new Message({
        senderId: data.senderId,
        receiverId: data.receiverId,
        message: data.message,
      });

      const savedMessage = await newMessage.save();

      // Send message to specific receiver
      socket.to(data.receiverId).emit("receiveMessage", savedMessage);

      // Send confirmation to sender
      socket.emit("messageSent", savedMessage);
    } catch (error) {
      socket.emit("messageError", error.message);
    }
  });

  // ✅ Handle Disconnection
  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/book", bookingRoute);
app.use("api/message",messageRoute)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
