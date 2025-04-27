import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "job",
        required: true,
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    bid: {
        type: Number,
        required: true,
    },
    receivedAmount: {
        type: Number,
        required: true,
    },
    duration: {
        type: String,
        enum: ["less than 1 month", "1-3 months", "3-6 months", "more than 6 months"],
        required: true,
    },
    coverLetter: {
        type: String,
        required: true,
        maxlength: 5000
    },
    attachments: [
        {
            filename: { type: String },
            path: { type: String },
        }
    ],
    status: {
        type: String,
        enum: ["pending", "shortlisted", "rejected", "accepted"],
        default: "pending"
    },
    notes: {
        type: String
    }
}, { timestamps: true });

// Create a compound index to ensure a user can't apply twice to the same job
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

const applicationModel = mongoose.models.application || mongoose.model("application", applicationSchema);
export default applicationModel;