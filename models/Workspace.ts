import { Schema, model, models, Types } from 'mongoose';

export interface IWorkspace {
  name: string;
  companyId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>({
  name: { type: String, required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Reuse existing compiled model if available, else compile a new one
export const Workspace =
  models.Workspace || model<IWorkspace>('Workspace', WorkspaceSchema);
