import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    user_type: {
        type: String,
        enum: ["employee", "employer", "admin"],
        required: true,
    },
    verifyOtp: {
        type: String,
        default: "",
    },
    VerifyOtpExpireAt: {
        type: Number,
        default: 0,
    },
    isverified: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;