// @/models/JiraContext.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IJiraContext extends Document {
  jiraData: string | object;
  updatedAt: Date;
}

const JiraContextSchema = new Schema<IJiraContext>(
  {
    jiraData: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const JiraContext =
  mongoose.models.JiraContext ||
  mongoose.model<IJiraContext>('JiraContext', JiraContextSchema);