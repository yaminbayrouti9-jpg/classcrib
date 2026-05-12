import mongoose, { Schema, model, models } from 'mongoose';

const MessageSchema = new Schema({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  image: {
    type: String, // Base64 or URL
    default: null,
  },
}, { timestamps: true });

const Message = models.Message || model('Message', MessageSchema);

export default Message;
