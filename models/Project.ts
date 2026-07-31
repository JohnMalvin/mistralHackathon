import { Schema, model, models, Types } from 'mongoose';

export interface IProject {
  name: string;
  workspaceId: Types.ObjectId;
  rootPageIds: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  rootPageIds: { type: [Schema.Types.ObjectId], ref: 'Page', default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Reuse existing compiled model if available, else compile a new one
export const Project = models.Project || model<IProject>('Project', ProjectSchema);
