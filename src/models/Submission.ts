import mongoose, { Schema, model, models } from 'mongoose';

const SubmissionSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  task: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
  },
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
  },
  proofType: {
    type: String,
    enum: ['text', 'link', 'file'],
    required: true,
  },
  content: {
    type: String, // Link, Text, or File path (Base64 for now)
    required: true,
  },
  fileName: {
    type: String,
  },
  note: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  feedback: {
    type: String,
  },
  verifiedAt: {
    type: Date,
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

if (mongoose.models.Submission) {
  delete mongoose.models.Submission;
}
const Submission = model('Submission', SubmissionSchema);

export default Submission;
