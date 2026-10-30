import mongoose, { Schema } from 'mongoose';

const ChatReportSchema = new Schema({
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  postId: { type: Schema.Types.ObjectId, required: true },
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Open', 'Reviewed', 'Dismissed'], default: 'Open' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  resolution: { type: String, maxlength: 500 },
}, { timestamps: true });

ChatReportSchema.index({ postId: 1, reporter: 1 }, { unique: true });

const ChatReport = mongoose.models.ChatReport || mongoose.model('ChatReport', ChatReportSchema);

export default ChatReport;
