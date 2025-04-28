import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: [true, "Full name is required"] 
    },
    email: { 
        type: String, 
        required: [true, "Email is required"],
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    company: { 
        type: String, 
        required: [true, "Company name is required"] 
    },
    phone: { 
        type: String,
        default: ""
    },
    businessSize: { 
        type: String, 
        required: [true, "Business size is required"],
        enum: ["1-10", "11-50", "51-200", "201-500", "501+"]
    },
    serviceType: { 
        type: String, 
        required: [true, "Service type is required"],
        enum: ["enterprise", "smb", "freelancers", "custom"]
    },
    preferredDate: { 
        type: Date, 
        required: [true, "Preferred date is required"] 
    },
    preferredTime: { 
        type: String, 
        required: [true, "Preferred time is required"],
        enum: ["morning", "afternoon", "evening"]
    },
    message: { 
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "completed", "cancelled"],
        default: "pending"
    },
    consultationNotes: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const contactModel = mongoose.models.contact || mongoose.model("contact", contactSchema);
export default contactModel;