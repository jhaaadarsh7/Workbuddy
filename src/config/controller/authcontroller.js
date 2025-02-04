import User from "../../models/userModel.js";
import generateToken from "../../Utils/generateToken.js";
import cloudinary from "../cloudinary.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body; // Profile pic req.file se aayega

    // Check if user already exists
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    let profilePic = {}; // Default empty profile pic

    // Upload profile picture if provided
    if (req.file) {
      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: "workbuddy/users",
        width: 150,
        crop: "scale",
      });

      profilePic = {
        public_id: uploadedImage.public_id,
        url: uploadedImage.secure_url,
      };
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
      profilePicture: profilePic, // Always set profilePicture
    });

    // Generate Token
    const token = generateToken(user._id);

    // Send Response
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      token,
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
