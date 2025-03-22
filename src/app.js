import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectMongo from "./config/mongo.js";  // MongoDB connection
import authRoute from "./routes/authRoute.js";
import bookingRoute from "./routes/bookingRoute.js"
dotenv.config({ path: "./.env" });

const app = express();

//  Connect to MongoDB
connectMongo();

//  Middleware Setup
app.use(
  cors({
    origin: "http://localhost:3000", // Change this if frontend is hosted elsewhere
    credentials: true, //  Required for cookies in Postman & frontend
  })
);
app.use(helmet());
app.use(cookieParser());
app.use(compression());
app.use(express.json());

//Routes
app.use("/api/auth", authRoute);
app.use("/api/book",bookingRoute);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
