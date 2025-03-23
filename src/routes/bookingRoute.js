import express from "express";
import { authorizedRoles, isAuthenticated } from "../middleware/authMiddleWare.js";
import { addFeedBack, cancelBooking, checkSlotAvailability, createBooking, deleteBookingAdmin, getAllBookingAdmin, getAllBookingprovider, getAllBookingproviderById, getBookingDetails, getBookingDetailsAdmin, getMyBookings, updateBookingStatus} from "../config/controller/bookingController.js";
const router = express.Router();


router.post("/",isAuthenticated,createBooking);
router.get("/getAllbookings",isAuthenticated,getMyBookings);
router.get("/bookingDetails/:id",isAuthenticated,getBookingDetails)
router.put("/updateBooking/:id",isAuthenticated,getBookingDetails)
router.put("/cancelBooking/:id",isAuthenticated,cancelBooking)
router.put("/:id/feedback",isAuthenticated,addFeedBack)
router.get("/availability/check",isAuthenticated,checkSlotAvailability)
router.get("/admin/getAllbooking",isAuthenticated,authorizedRoles("admin"),getAllBookingAdmin)
router.get("/admin/getBookingDetails/:id",isAuthenticated,authorizedRoles("admin"),getBookingDetailsAdmin)
router.delete("/admin/deletebooking/:id",isAuthenticated,authorizedRoles("admin"),deleteBookingAdmin)
router.get("/provider/getOwnBooking/",isAuthenticated,authorizedRoles("service-provider"),getAllBookingprovider)
router.get("/provider/getOwnBookingById/:id",isAuthenticated,authorizedRoles("service-provider"),getAllBookingproviderById)
router.put("/provider/updatedstatus/:id",isAuthenticated,authorizedRoles("service-provider"),updateBookingStatus)
export default router;
