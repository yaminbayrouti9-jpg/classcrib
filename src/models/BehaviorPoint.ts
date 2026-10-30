import mongoose, { Schema } from "mongoose";

const BehaviorPointSchema = new Schema({
  school: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  class: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true, maxlength: 80 },
  points: { type: Number, required: true, min: -100, max: 100 },
  reason: { type: String, required: true, minlength: 5, maxlength: 500 },
  coinDelta: { type: Number, default: 0 },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Approved", index: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  rejectedBy: { type: Schema.Types.ObjectId, ref: "User" },
  idempotencyKey: { type: String, required: true },
  reversalOf: { type: Schema.Types.ObjectId, ref: "BehaviorPoint" },
  reversedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reversedAt: { type: Date },
}, { timestamps: true });

BehaviorPointSchema.index({ teacher: 1, idempotencyKey: 1 }, { unique: true });

export default mongoose.models.BehaviorPoint || mongoose.model("BehaviorPoint", BehaviorPointSchema);
