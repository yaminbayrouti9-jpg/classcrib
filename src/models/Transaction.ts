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
  }
}, { timestamps: true });

if (mongoose.models.Transaction) {
  delete mongoose.models.Transaction;
}
const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
