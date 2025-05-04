import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    bio: { type: String },
    education: {
        school: { name: String, enteringYear: String, passingYear: String },
        college: { name: String, enteringYear: String, passingYear: String },
        university: { name: String, enteringYear: String, passingYear: String },
    },
    skills: [String],
    languageSkills: [{ language: String, proficiency: String }],
    profilePic: { type: String },
    address: { type: String },
    country: { type: String },
    phoneNumber: { type: String },
    goals: { type: String },
    questions: [String],
    resume: { type: String },
    linkedInProfile: { type: String },
    socialMediaLink: { type: String },
    freelanceExperience: { type: String }, // Added field for freelance experience
    paymentType: { type: String }, // Added field for payment type preference
    fixedRate: { type: String }, // Added field for fixed rate
    hourlyRate: { type: String }, // Added field for hourly rate
    weeklyAvailability: { type: String }, // Added field for weekly availability
    openToContractToHire: { type: Boolean, default: false }, // Added field for contract-to-hire preference
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
    appliedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'job'
    }],
    savedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'job'
    }],
    // Add ID verification fields
    idVerification: {
        frontImage: { type: String },
        backImage: { type: String },
        status: { 
            type: String, 
            enum: ['pending', 'verified', 'rejected']
        },
        submittedAt: { type: Date },
        verifiedAt: { type: Date },
        notes: { type: String } // Admin notes about verification
    }
}, { timestamps: true });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;

// Update the updateEmployeeProfile controller function
const updateEmployeeProfile = async (req, res) => {
    try {
        const { resumeUrl } = req.body;
        const updatedProfile = {
            resume: resumeUrl
        };
        // Other update logic here
    } catch (error) {
        res.status(500).send({ error: "An error occurred while updating the profile." });
    }
};