import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "workbuddy/profile_pictures", // Change as needed
    allowedFormats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

export default upload;
