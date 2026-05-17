import mongoose, { Schema, Document, Types } from 'mongoose';
import { nanoid } from 'nanoid';

const PointSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

const StrokeSchema = new Schema(
  {
    id: { type: String, required: true },
    tool: {
      type: String,
      enum: ['pen', 'eraser', 'line', 'rect', 'circle', 'arrow', 'text'],
      required: true,
    },
    points: [PointSchema],
    color: { type: String, required: true },
    strokeWidth: { type: Number, required: true },
    userId: { type: String, required: true },
    timestamp: { type: Number, required: true },
    text: { type: String },
    generationId: { type: String },
    shapeVariant: { type: String },
  },
  { _id: false, versionKey: false }
);

const StickyNoteSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, default: '' },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    color: { type: String, required: true },
    userId: { type: String, required: true },
    timestamp: { type: Number, required: true },
  },
  { _id: false, versionKey: false }
);

export interface IBoard extends Document {
  title: string;
  description?: string;
  owner: Types.ObjectId;
  collaborators: Array<{ user: Types.ObjectId; role: 'editor' | 'viewer' }>;
  thumbnail?: string;
  isPublic: boolean;
  shareToken: string;
  shareMode: 'none' | 'view' | 'edit';
  strokes: any[];
  stickyNotes: any[];
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema = new Schema<IBoard>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['editor', 'viewer'], default: 'editor' },
        _id: false,
      },
    ],
    thumbnail: { type: String },
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, unique: true, default: () => nanoid(10) },
    shareMode: { type: String, enum: ['none', 'view', 'edit'], default: 'none' },
    strokes: [StrokeSchema],
    stickyNotes: [StickyNoteSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IBoard>('Board', BoardSchema);
