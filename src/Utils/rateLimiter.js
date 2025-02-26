import rateLimit from "express-rate-limit"

export const generalLimiter = rateLimit({
    windowMs:15*60*1000,
    max:10,
    message:{
        message:"Too many requests , Please try again later"
    }
})

export const authLimiter = rateLimit({
    windowMs:10*60*1000,
    max:5,
    message:{
        message:"Too many attempts , Please try again later."
    }
})

// 📩 Email Verification Rate Limiter (Avoid Spam)
export const emailLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 3, // 📩 Only 3 email verifications per 30 minutes
    message: { message: "Too many verification attempts, please wait and try again." },
  });