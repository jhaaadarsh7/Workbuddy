import express from "express";
import { authorizedRoles, isAuthenticated } from "../middleware/authMiddleWare.js";
import { addFeedBack, cancelBooking, checkSlotAvailability, createBooking, getAllBookingAdmin, getBookingDetails, getMyBookings} from "../config/controller/bookingController.js";
const router = express.Router();


router.post("/",isAuthenticated,createBooking);
router.get("/getAllbookings",isAuthenticated,getMyBookings);
router.get("/bookingDetails/:id",isAuthenticated,getBookingDetails)
router.put("/updateBooking/:id",isAuthenticated,getBookingDetails)
router.put("/cancelBooking/:id",isAuthenticated,cancelBooking)
router.put("/:id/feedback",isAuthenticated,addFeedBack)
router.get("/availability/check",isAuthenticated,checkSlotAvailability)
router.get("/admin/getAllbooking",isAuthenticated,authorizedRoles("admin"),getAllBookingAdmin)
export default router;
