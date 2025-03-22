import mongoose from 'mongoose';

const { Schema } = mongoose;

// Enum for booking status
const bookingStatusEnum = ['pending', 'confirmed', 'completed', 'cancelled'];

// Schema for the Booking
const bookingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Fixed reference to 'User' model
      required: true,
    },
    serviceProvider: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Service providers are also users
      required: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    location: {
      type: String, // Location for the booking
      default: '',
      required: true, // Ensuring it's required for a valid booking
    },
    status: {
      type: String, // Corrected type from 'string' to 'String'
      enum: bookingStatusEnum,
      default: 'pending',
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String, // Corrected type from 'string' to 'String'
      enum: ['paid', 'unpaid'],
      default: 'unpaid',
    },
    feedback: {
      type: String,
      maxlength: 1000,
      default: null,
    },
    ratings: {
      type: Number,
      min: 1,
      max: 5,
      default: 1  // Change default from 0 to 1
    },
    
    transactionId: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);


const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
