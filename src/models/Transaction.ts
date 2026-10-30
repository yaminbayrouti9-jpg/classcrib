import mongoose, { Schema, model, models } from 'mongoose';

const TransactionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['Income', 'Expense', 'Investment'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Task', 'Need', 'Want', 'Gold', 'Business', 'Property', 'Reward'],
  },
  xpAmount: { type: Number, default: 0 },
  awardedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  awardedAt: { type: Date },
  recipient: { type: Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String },
  source: { type: String, index: true },
}, { timestamps: true });

if (mongoose.models.Transaction) {
  delete mongoose.models.Transaction;
}
const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
