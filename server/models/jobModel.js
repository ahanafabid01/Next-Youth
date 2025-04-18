import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    skills: {
        type: [String], // Array of strings
        default: [],    // Default to an empty array
    },
    scope: {
        type: String,
        required: true,
    },
    budgetType: {
        type: String,
        enum: ["hourly", "fixed"],
        required: true,
    },
    hourlyFrom: {
        type: Number,
        required: function () {
            return this.budgetType === "hourly";
        },
    },
    hourlyTo: {
        type: Number,
        required: function () {
            return this.budgetType === "hourly";
        },
    },
    fixedAmount: {
        type: Number,
        required: function () {
            return this.budgetType === "fixed";
        },
    },
    description: {
        type: String,
        required: true,
    },
    files: [
        {
            filename: { type: String },
            path: { type: String },
        },
    ],
}, { timestamps: true });

const jobModel = mongoose.models.job || mongoose.model("job", jobSchema);
export default jobModel;