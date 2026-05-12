import mongoose, { Schema, model, models } from 'mongoose';

const WorkspaceSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  inviteCode: {
    type: String,
    unique: true,
    required: true,
  }
}, { timestamps: true });

const Workspace = models.Workspace || model('Workspace', WorkspaceSchema);

export default Workspace;
