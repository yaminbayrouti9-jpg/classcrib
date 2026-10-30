import mongoose, { Schema } from "mongoose";

const BootstrapClaimSchema = new Schema({
  _id: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.BootstrapClaim || mongoose.model("BootstrapClaim", BootstrapClaimSchema);
