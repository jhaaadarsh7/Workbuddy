import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => /\S+@\S+\.\S+/.test(v),
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    password: { 
      type: String, 
      required: true, 
      minlength: 8, 
      select: false 
    },
    role: { 
      type: String, 
      enum: ["admin", "user", "service-provider"], 
      default: "user" 
    },
    profilePicture: { 
      public_id: String, 
      url: String 
    },
    emailVerified: { 
      type: Boolean, 
      default: false 
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    otp: String,
    otpExpires: Date,
    isDeleted: { 
      type: Boolean, 
      default: false 
    },

    // Service Provider Specific Fields
    skills: { 
      type: [String], 
      default: [], 
      select: false 
    },
    experience: { 
      type: Number, 
      default: 0, 
      select: false 
    },
   
    pricing: { 
      type: Number, 
      default: 0, 
      select: false 
    },
    location: { 
      type: String, 
      default: "", 
      select: false 
    },
    bio: { 
      type: String, 
      default: "", 
      select: false 
    },
    isProfileComplete: { 
      type: Boolean, 
      default: false 
    },
    gender: { 
      type: String, 
      enum: ["male", "female", "other"], 
      default: "other" 
    },
services: [{
  type: Schema.Types.ObjectId,
  ref: "Service"
}],
    reviews: [
      {
        user: { 
          type: Schema.Types.ObjectId, 
          ref: "User" 
        },
        feedback: { 
          type: String, 
          maxlength: 1000, 
          required: true 
        },
        rating: { 
          type: Number, 
          min: 1, 
          max: 5, 
          required: true 
        },
        createdAt: { 
          type: Date, 
          default: Date.now 
        },
      },
    ],
    averageRating: { 
      type: Number, 
      min: 1, 

      max: 5, 
      default: 1 
    },
  },
  { timestamps: true }
);

// Password comparison method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Email verification token generation
userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto.createHash("sha256").update(token).digest("hex");
  this.verificationTokenExpires = Date.now() + 40 * 60 * 1000; // 40 minutes
  return token;
};

// Password reset token generation
userSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  return resetToken;
};

// Average rating calculation
userSchema.methods.calculateAverageRating = function () {
  if (this.reviews.length === 0) return 1;
  return this.reviews.reduce((acc, review) => acc + review.rating, 0) / this.reviews.length;
};

const User = mongoose.model("User", userSchema);
export default User;