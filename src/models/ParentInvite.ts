import mongoose, { Schema } from "mongoose";

const ParentInviteSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  school: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  acceptedAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.ParentInvite || mongoose.model("ParentInvite", ParentInviteSchema);
