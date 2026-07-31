import { Schema, model, models, Types } from 'mongoose';

export interface IPage {
  title: string;
  icon?: string;
  blocks: unknown; // externally-written, normalized on read — see lib/pageJson.ts
  projectId?: Types.ObjectId; // set when this page belongs to a Project tree
  parentId?: Types.ObjectId | null; // null/undefined = root of its project
  children: Types.ObjectId[]; // ordered child page ids — a page with children behaves as a directory
  updatedAt?: Date;
  createdAt?: Date;
}

const PageSchema = new Schema<IPage>({
  title: { type: String, required: true },
  icon: { type: String },
  blocks: { type: Schema.Types.Mixed, required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  parentId: { type: Schema.Types.ObjectId, ref: 'Page', default: null },
  children: { type: [Schema.Types.ObjectId], ref: 'Page', default: [] },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Reuse existing compiled model if available, else compile a new one
export const Page = models.Page || model<IPage>('Page', PageSchema);
