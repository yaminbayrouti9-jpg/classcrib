import mongoose, { Schema, model, models } from 'mongoose';

const ChatSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'New Conversation',
  },
  lastMessage: {
    type: String,
    default: '',
  },
}, { timestamps: true });

ChatSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const Chat = models.Chat || model('Chat', ChatSchema);

export default Chat;
