import Booking from "../../models/BookingModel.js";
import Service from "../../models/serviceModel.js";
import User from "../../models/userModel.js";

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

  export const addFeedBack = async (req, res) => {
    try {
      const { feedback, rating } = req.body;
      const bookingId = req.params.id;
  
      console.log("User ID:", req.user.id); // Debug: Check user ID
      console.log("Booking ID:", bookingId); // Debug: Check booking ID
  
      // Validate rating first
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }
  
      // Find booking
      const booking = await Booking.findOne({
        _id: bookingId,
        user: req.user.id,
        status: "completed",
      });
  
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found or not eligible for feedback",
        });
      }
  
      // Update booking feedback
      booking.feedback = feedback;
      booking.rating = rating;
      const updatedBooking = await booking.save();
  
      // Update service provider's reviews
      const provider = await User.findById(booking.serviceProvider);
      
      provider.reviews.push({
        user: req.user.id,
        feedback,
        rating,
      });
  
      // Calculate new average rating
      const totalRatings = provider.reviews.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      provider.averageRating = totalRatings / provider.reviews.length;
      
      await provider.save();
  
      res.status(200).json({
        success: true,
        message: "Feedback submitted successfully",
        booking: updatedBooking,
      });
  
    } catch (error) {
      console.error("Feedback error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };

  export const checkSlotAvailability = async (req, res) => {
    try {
      const { providerId, date, startTime, endTime } = req.query;
  
      // Step 1: Validate input
      if (!providerId || !date || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameters",
        });
      }
  
      // Step 2: Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return res.status(400).json({
          success: false,
          message: "Invalid time format (use HH:MM)",
        });
      }
  
      // Step 3: Parse times to UTC
      const parsedStart = new Date(`${date}T${startTime}:00Z`);
      const parsedEnd = new Date(`${date}T${endTime}:00Z`);
  
      if (isNaN(parsedStart) || isNaN(parsedEnd)) {
        return res.status(400).json({
          success: false,
          message: "Invalid time format (use HH:MM)",
        });
      }
  
      // Step 4: Check provider's working hours (from User model)
      const provider = await User.findById(providerId).select("workingHours");
      const workingStart = new Date(`${date}T${provider.workingHours.start}:00Z`);
      const workingEnd = new Date(`${date}T${provider.workingHours.end}:00Z`);
  
      if (parsedStart < workingStart || parsedEnd > workingEnd) {
        return res.status(200).json({
          success: true,
          isAvailable: false,
          message: "Outside working hours",
        });
      }
  
      // Step 5: Check overlapping bookings
      const overlapping = await Booking.findOne({
        serviceProvider: providerId,
        $or: [
          { startTime: { $lt: parsedEnd }, endTime: { $gt: parsedStart } },
        ],
      });
  
      res.status(200).json({
        success: true,
        isAvailable: !overlapping,
        message: overlapping ? "Slot booked" : "Slot available",
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };


  export const getAllBookingAdmin = async(req,res)=>{
try {
  const bookings = await Booking.find().populate("user")
  .populate("serviceProvider");
  res.status(200).json({
    success: true,
    message: "Bookings fetched successfully",
    bookings,
  });
} catch (error) {
  console.error("Error fetching bookings:", error);
  res.status(500).json({
    success: false,
    message: "Server error",
    error: error.message,
  });
}
  }

  export const getBookingDetailsAdmin = async (req, res) => {
    try {
      const bookingDetails = await Booking.findById(req.params.id)
        .lean()
        .populate({
          path: "service",
          select: "name price duration category", // Only expose necessary service fields
        })
        .populate({
          path: "serviceProvider",
          select: "name email profilePicture", // Exclude sensitive provider fields
        });
  
      if (!bookingDetails) {
        return res.status(404).json({ 
          success: false, 
          message: "Booking not found with the given ID" 
        });
      }
  
      res.status(200).json({ 
        success: true,
        data: {
          booking: {
            id: bookingDetails._id,
            date: bookingDetails.bookingDate,
            startTime: bookingDetails.startTime,
            endTime: bookingDetails.endTime,
            status: bookingDetails.status,
            totalPrice: bookingDetails.totalPrice
          },
          service: bookingDetails.service,
          provider: bookingDetails.serviceProvider
        }
      });
  
    } catch (error) {
      // Handle invalid ID format
      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid booking ID format"
        });
      }
  
      // Handle other errors
      console.error("[ADMIN] Booking details error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching booking details",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  };

  export const deleteBookingAdmin = async (req, res) => {
    try {
      const deleteBooking = await Booking.findByIdAndDelete(req.params.id);
  
      if (!deleteBooking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found"
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Booking deleted successfully",
        deletedBooking: deleteBooking.toObject() // Convert Mongoose document to plain object
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message // Include error message for debugging
      });
    }
  };
  export const getAllBookingprovider = async (req, res) => {
    try {
      const serviceProviderId = req.user._id;
  
      // Filter bookings by service provider ID
      const bookings = await Booking.find({ serviceProvider: serviceProviderId })
        .select('user service status location') // Select only needed fields
        .populate('user', 'name email')         // Only get user's name and email
        .populate('service', 'title')           // Only get service title
        .sort({ createdAt: -1 });               // Sort by newest first
  
      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No bookings found for this service provider"
        });
      }
  
      res.status(200).json({
        success: true,
        count: bookings.length,
        bookings
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
    }
  };

  export const getAllBookingproviderById = async (req, res) => {
    try {
      const serviceProviderId = req.user._id;
      const bookingId = req.params.id;
  
      const booking = await Booking.findOne({
        _id: bookingId,
        serviceProvider: serviceProviderId
      })
      .populate({
        path: 'user',
        select: 'name email phone'
      })
      .populate({
        path: 'service',
        select: 'name description price category',
        populate: {
          path: 'provider',
          select: 'name email businessName'
        }
      })
      .lean();
  
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found or unauthorized access"
        });
      }
  
      // Remove internal version key and convert dates
      const { __v, ...bookingData } = booking;
      
      // Format dates to ISO string
      const formattedBooking = {
        ...bookingData,
        bookingDate: booking.bookingDate.toISOString(),
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString()
      };
  
      res.status(200).json({
        success: true,
        booking: formattedBooking
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
    }
  };

  // In your booking controller file
export const updateBookingStatus = async (req, res) => {
  try {
    const serviceProviderId = req.user._id;
    const bookingId = req.params.id;
    const { status } = req.body;

    // Validate allowed status values
    const allowedStatus = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
        allowedStatus
      });
    }

    // Find and update booking with authorization check
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        serviceProvider: serviceProviderId
      },
      { status },
      { new: true, runValidators: true }
    )
    .populate('user', 'name email')
    .populate('service', 'name price')
    .lean();

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or unauthorized"
      });
    }

    // Format response
    const response = {
      ...updatedBooking,
      bookingDate: updatedBooking.bookingDate.toISOString(),
      startTime: updatedBooking.startTime.toISOString(),
      endTime: updatedBooking.endTime.toISOString()
    };

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      booking: response
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};