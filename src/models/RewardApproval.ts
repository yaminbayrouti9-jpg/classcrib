import mongoose, { Schema } from "mongoose";

const RewardApprovalSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
  students: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  coins: { type: Number, required: true, min: 0 },
  xp: { type: Number, required: true, min: 0 },
  taskType: { type: String, enum: ["Homework", "Green", "Physical", "Activity"], required: true },
  badge: { type: Schema.Types.Mixed },
  reason: { type: String, required: true, maxlength: 500 },
  idempotencyKey: { type: String, required: true },
  source: { type: String, enum: ["teacher-award", "assignment"], default: "teacher-award" },
  submission: { type: Schema.Types.ObjectId, ref: "Submission" },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
  decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
  decidedAt: { type: Date },
}, { timestamps: true });

RewardApprovalSchema.index({ teacher: 1, idempotencyKey: 1 }, { unique: true });

export default mongoose.models.RewardApproval || mongoose.model("RewardApproval", RewardApprovalSchema);
