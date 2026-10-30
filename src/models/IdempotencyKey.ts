import mongoose, { Schema } from "mongoose";

const IdempotencyKeySchema = new Schema({
  key: { type: String, required: true, unique: true },
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  operation: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
}, { timestamps: false });

const IdempotencyKey = mongoose.models.IdempotencyKey
  || mongoose.model("IdempotencyKey", IdempotencyKeySchema);

export default IdempotencyKey;
