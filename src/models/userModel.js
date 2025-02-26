import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
    },
    role: {
      type: String,
      enum: ["admin", "user", "service-provider"],
      default: "user",
    },
    profilePicture: {
      public_id: String,
      url: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    otp: String,
    otpExpires: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // New fields for service provider profile
    skills: {
      type: [String], // Array of skills
      default: [],
    },
    experience: {
      type: Number, // Experience in years
      default: 0,
    },
    services: {
      type: [String], // Array of services offered by the provider
      default: [],
    },
    pricing: {
      type: Number, // Pricing per hour or service
      default: 0,
    },
    location: {
      type: String, // Location of the service provider
      default: "",
    },
    bio: {
      type: String, // Short bio for the provider
      default: "",
    },
    isProfileComplete: {
      type: Boolean,
      default: false, // Track if the profile is complete or not
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
  },
  { timestamps: true }
);

// 🔑 Compare Passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// 📩 Generate Email Verification Token
userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto.createHash("sha256").update(token).digest("hex");
  this.verificationTokenExpires = Date.now() + 40 * 60 * 1000; // 40 min expiry
  return token;
};

// 🔐 Generate Password Reset Token
userSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min expiry
  return resetToken;
};

const User = mongoose.model("User", userSchema);
export default User;
