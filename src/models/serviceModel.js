import mongoose from 'mongoose';

const { Schema } = mongoose;

const serviceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price can't be negative"],
    },
    category: {
      type: String,
      required: true,
    },
    provider: { // Link to the service provider (User)
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Service = mongoose.model('Service', serviceSchema);
export default Service;