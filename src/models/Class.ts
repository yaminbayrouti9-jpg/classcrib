import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['Teacher', 'Student'], required: true }
});

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  inviteCode: { type: String, required: true, unique: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', index: true },
  yearGroup: { type: String, trim: true, maxlength: 40 },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  color: { type: String, default: '#4F46E5' }, // Default Indigo
  icon: { type: String, default: 'Users' },
  banner: { type: String },
  posts: [PostSchema],
  settings: {
    allowStudentPosts: { type: Boolean, default: true },
    allowClassChat: { type: Boolean, default: true },
    allowUsernameSearch: { type: Boolean, default: true },
    allowCoinGifts: { type: Boolean, default: true },
    allowLeaderboard: { type: Boolean, default: true },
    allowTradingTerminal: { type: Boolean, default: true },
    allowCribbyAI: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

if (mongoose.models.Class) {
  delete mongoose.models.Class;
}
const Class = mongoose.model('Class', ClassSchema);

export default Class;
