import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';


// ✅ Check if user is authenticated
export const isAuthenticated = async (req, res, next) => {
  try {
    console.log("Cookies Received:", req.cookies);  // Debugging Step ✅
    
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ success: false, message: "Please login to access this resource" });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decodedData.id);

    if (!req.user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("Authenticated User:", req.user);  // Debugging Step ✅
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};


export const authorizedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized`
      });
    }
    next();
  };
};

export const socketAuth = (socketAuth,Auth)=>{
  try {
    const token = socket.handshake.query.token;
    if (!token) throw new Error("Authentication required");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));

  }
}