import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const userAuth = async (req, res, next) => {
    const { token } = req.cookies;

    // Check if token exists
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach userId to the request object
        req.userId = decoded.id;

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Token verification error:", error.message || error);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

export default userAuth;