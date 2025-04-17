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
    profilePicture: { // New field for profile picture URL
        type: String,
        default: "",
    },
    dateOfBirth: { // New field for date of birth
        type: Date,
    },
    linkedInId: { // New field for LinkedIn ID
        type: String,
    },
    otherInfo: { // New field for additional information
        type: String,
    },
}, { timestamps: true });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;