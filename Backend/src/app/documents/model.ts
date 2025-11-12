import { Schema, model, Types } from 'mongoose';

export interface IFile {
  _id?: Types.ObjectId;
  ownerId: Types.ObjectId;
  key: string;
  bucket: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
  public: boolean;
  sharedWith?: Types.ObjectId[];
  originalName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const fileSchema = new Schema(
  {
    ownerId: { type: Types.ObjectId, required: true, index: true, ref: 'User' },
    key: { type: String, required: true, unique: true },
    bucket: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    public: { type: Boolean, default: false },
    sharedWith: [{ type: Types.ObjectId, ref: 'User' }],
    originalName: { type: String },
  },
  { timestamps: true, collection: 'files' }
);

export const FileModel = model<IFile>('File', fileSchema);
