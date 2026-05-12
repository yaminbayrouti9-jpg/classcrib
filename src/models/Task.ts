import mongoose, { Schema, model, models } from 'mongoose';

const TaskSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    enum: ['Homework', 'Green', 'Physical', 'Activity'],
    default: 'Homework',
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  coins: {
    type: Number,
    required: true,
  },
  xp: {
    type: Number,
    required: true,
  },
  dueDate: {
    type: Date,
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
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  completions: [{
    student: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date, default: Date.now },
    bonusEarned: { type: Number, default: 0 },
    verified: { type: Boolean, default: true }
  }]
}, { timestamps: true });

if (mongoose.models.Task) {
  delete mongoose.models.Task;
}
const Task = model('Task', TaskSchema);

export default Task;
