import mongoose, { Schema } from "mongoose";

const ParentLinkSchema = new Schema({
  parent: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  school: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  weeklyEmail: { type: Boolean, default: false },
  alerts: { type: Boolean, default: false },
  lastWeeklyEmailAt: { type: Date },
  verifiedAt: { type: Date, default: Date.now },
}, { timestamps: true });

ParentLinkSchema.index({ parent: 1, student: 1 }, { unique: true });

export default mongoose.models.ParentLink || mongoose.model("ParentLink", ParentLinkSchema);
