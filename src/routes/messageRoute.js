import express from "express";

import { getMessage } from "../config/controller/messageController.js";

const router = express.Router();

router.get(":userId/:receiveId",getMessage)

export default router