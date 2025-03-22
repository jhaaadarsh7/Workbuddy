import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "workbuddy/profile_pictures",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 500, height: 500, crop: "limit" }]
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed'), false);
    }
    cb(null, true);
  }
});

// Named export for the middleware
export const uploadMiddleware = (req, res, next) => {
  upload.single("profilePicture")(req, res, (err) => {
    if (err) {
      console.error("Upload Error:", err);
      return res.status(400).json({ 
        success: false,
        message: err.message || "File upload failed"
      });
    }
    next();
  });
};