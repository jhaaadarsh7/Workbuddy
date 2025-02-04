import express from "express";
import { registerUser } from "../config/controller/authcontroller.js";
import upload from "../middleware/uploadMiddleware.js";


const router = express.Router();

router.post("/register",upload.single("profilePicture"),registerUser)


export default router;