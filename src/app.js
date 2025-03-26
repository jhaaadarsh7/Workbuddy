import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectMongo from "./config/mongo.js"; // MongoDB connection
import authRoute from "./routes/authRoute.js";
import bookingRoute from "./routes/bookingRoute.js";
import Pusher from "pusher"
import Message from "./models/messageModel.js";
import { isAuthenticated } from "./middleware/authMiddleWare.js";
dotenv.config({ path: "./.env" });

const app = express();

//  Connect to MongoDB
connectMongo();
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
})

export {pusher};

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



// Routes
app.use("/api/auth", authRoute);
app.use("/api/book", bookingRoute);

app.post("/api/send-message",isAuthenticated,async(req,res)=>{
  try {
    const {senderId,receiverId,message} = req.body;


    const newMessage = new Message({
      senderId,
      receiverId,
      message,
    });

    await newMessage.save();
    pusher.trigger(`chat-${receiverId}`,"new-message",{
      senderId,
      message,
    })
    res.status(200).json({success:true,message:"Message sent!"})
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });

  }
})
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
