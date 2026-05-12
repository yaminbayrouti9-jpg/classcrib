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

const Chat = models.Chat || model('Chat', ChatSchema);

export default Chat;
