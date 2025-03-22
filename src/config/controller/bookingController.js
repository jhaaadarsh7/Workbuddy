import Booking from "../../models/BookingModel.js";
import Service from "../../models/serviceModel.js";
export const createBooking = async (req, res) => {
  try {
    const { serviceProvider, service, bookingDate, startTime, endTime, location } = req.body;

    // Validate service and provider
    const serviceExists = await Service.findOne({ _id: service, provider: serviceProvider });
    if (!serviceExists) {
      return res.status(404).json({ success: false, message: "Service not found or invalid provider" });
    }

    // Parse times in UTC
    const parsedStartTime = new Date(`${bookingDate}T${startTime}:00Z`);
    const parsedEndTime = new Date(`${bookingDate}T${endTime}:00Z`);
    if (isNaN(parsedStartTime) || isNaN(parsedEndTime)) {
      return res.status(400).json({ success: false, message: "Invalid time format" });
    }

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      serviceProvider,
      $or: [{ startTime: { $lt: parsedEndTime }, endTime: { $gt: parsedStartTime } }],
    });
    if (overlappingBooking) {
      return res.status(409).json({ success: false, message: "Time slot unavailable" });
    }

    // Calculate totalPrice from service data
    const durationHours = (parsedEndTime - parsedStartTime) / (1000 * 60 * 60);
    const totalPrice = serviceExists.price * durationHours;

    const newBooking = new Booking({
      user: req.user.id,
      serviceProvider,
      service,
      bookingDate: new Date(bookingDate),
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      location,
      totalPrice,
    });

    const savedBooking = await newBooking.save();
    const bookingData = savedBooking.toObject();
    delete bookingData.__v; // Remove unnecessary fields

    res.status(201).json({ success: true, booking: bookingData });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message, errors: error.errors });
    }
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};


export  const getMyBookings  = async (req,res)=>{
try {
  const bookings = await Booking.find({user:req.user.id})
  .populate("serviceProvider","name email")
  .populate("service" , "name price")
  .sort({ createdAt: -1 }); 

  res.status(200).json({
    success:true,
    count:bookings.length,
    bookings
  })
} catch (error) {
  res.status(500).json({
    success: false,
    message: "Failed to fetch bookings"
  });
}
}

export const getBookingDetails = async(req,res)=>{
  try {
    const bookingDetails = await Booking.findOne({_id:req.params.id, user:req.user.id})
    .populate("serviceProvider", "name email profilePicture")
    .populate("service", "name price category duration");
    if (!bookingDetails) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or access denied",
      });
    }
    res.status(200).json({
      success:true,
      bookingDetails
    })
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }

}
export const updateBooking = async(req,res)=>{
  try {
    const{ bookingDate,startTime,endTime} = req.body;
    const bookingId= req.params.id;

    const booking = await Booking.findOne({_id:bookingId,user:req.user.id})
    if (!booking) {
      return res.status(404).json({success:false,
        message:"Booking not found or access denied"
      })
    }

    const parsedStartTime = new Date(`${bookingDate}T${startTime}:00Z`);
    const parsedEndTime = new Date(`${bookingDate}T${endTime}:00Z`);

      if (isNaN(parsedStartTime) || isNaN(parsedEndTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM (24-hour format)",
      });
    }

    const overlappingBooking = await Booking.findOne({
      serviceProvider: booking.serviceProvider,
      _id: { $ne: bookingId }, // Exclude current booking
      $or: [
        { startTime: { $lt: parsedEndTime }, endTime: { $gt: parsedStartTime } },
      ],
    })
    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message: "Time slot already booked",
      });
    }

    booking.startTime = parsedStartTime;
    booking.endTime = parsedEndTime;
    booking.bookingDate = new Date(bookingDate);


    const updatedBooking = await booking.save();

    res.status(200).json({
      success: true,
      booking: updatedBooking,
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
  }
  

  export const cancelBooking = async (req, res) => {
    try {
      const bookingId = req.params.id;
  
      // 1. Find the booking and verify ownership
      const booking = await Booking.findOne({
        _id: bookingId,
        user: req.user.id,
      });
  
      // 2. Check if booking exists
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found or access denied",
        });
      }
  
      // 3. Check if booking is already completed/cancelled
      if (booking.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "Completed bookings cannot be cancelled",
        });
      }
  
      if (booking.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Booking is already cancelled",
        });
      }
  
      // 4. Update status to "cancelled"
      booking.status = "cancelled";
      const updatedBooking = await booking.save();
  
      res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        booking: updatedBooking,
      });
  
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid booking ID",
        });
      }
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };

  export const addFeedBack = async(req,res)=>{
try {
  const{feedback,rating} = req.body;
  const bookingId = req.params.id;

  if (rating<1 || rating>5) {
    return res.status(400).json({
      success:false,
      message:"Rating must be between 1 and 5",    
    });

    const booking = await Booking.findOne({_id:bookingId,user:req.user.id,
      status:"completed",
    });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or not eligible for feedback",
      });
    }
 booking.feedback = feedback;
 booking.rating = rating;
 const updateBooking = await booking.save();
  }

  const provider = await User.findById(booking.serviceProvider);
  provider.reviews.push({user:req.user.id,
    feedback,
    rating,
  });
  provider.averageRating = provider.reviews.reduce(
    (acc,review) => acc + review.rating,0
  )/await provider.save();
  res.status(200).json({
    success: true,
    message: "Feedback submitted successfully",
    booking: updatedBooking,
  });
  res.status(200).json({
    success: true,
    message: "Feedback submitted successfully",
    booking: updatedBooking,
  });
} catch (error) {
  
}
  }

