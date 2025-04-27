import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const userAuth = (req, res, next) => {
    try {
        // Check for token in cookies
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ success: false, message: "No token, authorization denied" });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check admin special case (admin doesn't have an ID in the token)
        if (decoded.user_type === 'admin') {
            req.user = { user_type: 'admin' };
            return next();
        }
        
        // Regular user verification
        req.user = { id: decoded.id, user_type: decoded.user_type };
        next();
    } catch (error) {
        console.error("Auth error:", error);
        return res.status(401).json({ success: false, message: "Token is not valid" });
    }
};

export default userAuth;