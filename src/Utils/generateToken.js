import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN, // Ensure this is a valid value
    });
};

export default generateToken;
