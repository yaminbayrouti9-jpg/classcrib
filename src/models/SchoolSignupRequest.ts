import mongoose, { Schema } from "mongoose";

const SchoolSignupRequestSchema = new Schema({
  schoolName: { type: String, required: true, trim: true, maxlength: 150 },
  contactEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  adminUsername: { type: String, required: true, trim: true, lowercase: true, maxlength: 32 },
  adminDisplayName: { type: String, required: true, trim: true, maxlength: 100 },
  adminPasswordHash: { type: String, select: false },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  reviewNote: { type: String, trim: true, maxlength: 500 },
  school: { type: Schema.Types.ObjectId, ref: "School" },
  administrator: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

SchoolSignupRequestSchema.index(
  { adminUsername: 1 },
  { unique: true, partialFilterExpression: { status: "Pending" } },
);
SchoolSignupRequestSchema.index(
  { contactEmail: 1 },
  { unique: true, partialFilterExpression: { status: "Pending" } },
);

export default mongoose.models.SchoolSignupRequest ||
  mongoose.model("SchoolSignupRequest", SchoolSignupRequestSchema);
