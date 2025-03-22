import express from "express";
import { isAuthenticated } from "../middleware/authMiddleWare.js";
import { addFeedBack, cancelBooking, createBooking, getBookingDetails, getMyBookings} from "../config/controller/bookingController.js";
const router = express.Router();


router.post("/",isAuthenticated,createBooking);
router.get("/getAllbookings",isAuthenticated,getMyBookings);
router.put("/updateBooking/:id",isAuthenticated,getBookingDetails)
router.put("/cancelBooking/:id",isAuthenticated,cancelBooking)
router.put("/:id/feedback",isAuthenticated,addFeedBack)

export default router;
