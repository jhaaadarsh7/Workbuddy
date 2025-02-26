import User from "../../models/userModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import generateToken from "../../Utils/generateToken.js";
import cloudinary from "../cloudinary.js";
import sendEmail from "../../Utils/sendEmail.js";
//  Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Password Validation
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    // ✅ Hash Password Before Saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ Upload Profile Picture to Cloudinary (if provided)
    let profilePicture = { public_id: "", url: "" };

    if (req.file) {
      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: "WorkBuddy_ProfilePics",
      });

      profilePicture = {
        public_id: uploadedImage.public_id,
        url: uploadedImage.secure_url,
      };
    }

    // ✅ Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      profilePicture, // ✅ Store uploaded profile picture
    });

    // ✅ Generate Email Verification Token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // ✅ Send Verification Email
    const emailMessage = `Hello ${user.name},\n\nPlease verify your email by entering this code in Postman or frontend:\n\nVerification Code: ${verificationToken}\n\nThis code is valid for 40 minutes.\n\nIf you did not register, please ignore this email.`;
    await sendEmail(user.email, "Verify Your Email - WorkBuddy", emailMessage);

    res.status(201).json({
      message:
        "User registered successfully. A verification email has been sent to your email address.",
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const verifyEmail = async (req,res)=>{
  try {
    const {token } = req.body;


    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });

      }
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Email verified successfully. You can now log in!" });

  } catch (error) {
    console.error("Email Verification Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });

//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     if (!user.emailVerified) {
//       return res.status(403).json({ message: "Please verify your email before logging in." });
//     }

//     const token = generateToken(user._id);
//     res.status(200).json({
//       message: "Login successful",
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         profilePicture: user.profilePicture,
//       },
//       token,
//     });

//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    const token = generateToken(user._id);

    // ✅ Set HTTP-only Cookie (Postman will now use this automatically)
    res.cookie("token", token, {
      httpOnly: true,   // Secure cookie to prevent XSS attacks
      secure: false,    // ❌ Keep `false` for localhost testing, `true` for production
      sameSite: "lax",  // Helps with CSRF protection
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1-day expiry
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const forgotPassword = async(req,res)=>{
  try {
    const {email} = req.body;
    const user = await User.findOne({email});

    if (!user) {
      return res.status(404).json({message:"User not found"});
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    // Set expiration time (e.g., 1 hour)

    const resetExpires= Date.now()+3600000;

    //save the token and expiration to the user
    user.resetPasswordToken=hashedToken;
    user.resetPasswordExpires= resetExpires;
    await user.save();

    //send email with reset token
    const resetUrl = `http://localhost:5000/api/auth/reset-password/${resetToken}`
    const emailMessage=`Hello ${user.name},\n\nPlease click the following link to reset your password:\n\n${resetUrl}\n\nThis link is valid for 1 hour.\n\nIf you did not request a password reset, please ignore this email.`
    await sendEmail(user.email,"Password Reset Request - WorkBuddy",emailMessage)
    res.status(200).json({message:"Password reset email sent successfully"})
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export const resetPassword = async(req,res)=>{
  try {
    const {token ,newPassword} = req.body;


    const hashedToken = crypto.createHash("sha256").update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken:hashedToken,
      resetPasswordExpires:{$gt:Date.now()}// Token should be valid

    })

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    // Hash new password and save
const HashedPassword = await bcrypt.hash(newPassword,12);
user.password = HashedPassword
user.resetPasswordToken = undefined; // Clear reset token after successful reset
user.resetPasswordExpires = undefined; // Clear expiration
await user.save();
res.status(200).json({ message: "Password reset successfully. You can now log in!" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });   
  }
}


export const resendEmailVerification = async(req,res)=>{
  try {
    const {email} = req.body;

    const user = await User.findOne({email});
    if (!user) {
      return res.status(404).json({message:"User not found"}); 
    }
    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex")


    user.verificationToken = hashedToken;
    user.verificationTokenExpires =  Date.now() + 3600000; // 1 hour
    await user.save();

       // Send verification email
       const verificationUrl = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;
       const emailMessage = `Hello ${user.name},\n\nPlease verify your email by entering this code in Postman or frontend:\n\nVerification Code: ${verificationToken}\n\nThis code is valid for 1 hour.\n\nIf you did not register, please ignore this email.`;
   
       await sendEmail(user.email, "Resend Email Verification - WorkBuddy", emailMessage);
       res.status(200).json({
        message: "A new verification email has been sent successfully.",
      });
  
  } catch (error) {
    console.error("Resend Email Verification Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}


export const sendOtpToEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    await user.save();

    const message = `Your OTP is: ${otp}. It will expire in 5 minutes.`;
    await sendEmail(user.email, 'Your OTP - WorkBuddy', message);

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};


export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP is correct and not expired
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP is valid, clear OTP data
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate a JWT token after OTP verification
    const token = generateToken(user._id); // Ensure generateToken is defined

    res.status(200).json({
      message: "OTP verified successfully",
      token,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const buildProfile = async(req,res)=>{
  try {
    const {skills,experience,services,pricing,location,bio,gender}=req.body;

    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
        // Update fields
        user.skills = skills || user.skills;
        user.experience = experience || user.experience;
        user.services = services || user.services;
        user.pricing = pricing || user.pricing;
        user.location = location || user.location;
        user.bio = bio || user.bio;
        user.gender = gender || user.gender;
    
        
        user.isProfileComplete = Boolean(services&&pricing&&location);

        await user.save();
        res.status(200).json({message:"profile upadted seccessfully",user});
  } catch (error) {
    res.status(500).json({message:"Server error",error: error.message});

  }
}
export const getAllserviceProvider = async (req, res) => {
  try {
    const providers = await User.find({ role: "service-provider" });

    if (!providers || providers.length === 0) {
      return res.status(404).json({ message: "No service providers found" });
    }

    // Map over providers and remove sensitive info
    const providerDetails = providers.map(provider => {
      return {
        _id: provider._id,
        name: provider.name,
        profilePicture: provider.profilePicture,
        bio: provider.bio,
        experience: provider.experience,
        gender: provider.gender,
        isProfileComplete: provider.isProfileComplete,
        location: provider.location,
        pricing: provider.pricing,
        services: provider.services,
        skills: provider.skills
      };
    });

    res.status(200).json({ providers: providerDetails });
  } catch (error) {
    console.error("Error fetching service providers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getProfile = async(req,res)=>{
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      res.status(404).json({message:"User not found"})
    }
    res.status(200).json({user})
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}


export const updateProfile = async(req,res)=>{
  try {
    const {skills,experience,services,pricing,location,bio,gender}=req.body;
let user = await User.findById(req.user.id) ; 
if (!user) {
  return res.status(404).json({ message: "User not found" });
}
  // Update the user profile with new information
  user.skills = skills || user.skills;
  user.experience = experience || user.experience;
  user.services = services || user.services;
  user.pricing = pricing || user.pricing;
  user.location = location || user.location;
  user.bio = bio || user.bio;
  user.gender = gender || user.gender;

  user.isProfileComplete = Boolean(services && pricing && location);
  await user.save();
  res.status(200).json({message: "Profile updated successfully", user })

    }
  catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}