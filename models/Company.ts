import { Schema, model, models, Types } from 'mongoose';

export interface ICompany {
  name: string;
  userId: Types.ObjectId;
  jiraData?: Record<string, any>; // Stores the Jira JSON / Markdown payload
  updatedAt?: Date;
}

const CompanySchema = new Schema<ICompany>({
  name: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  jiraData: { type: Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now },
});

CompanySchema.index({ name: 1, userId: 1 }, { unique: true });

// Reuse existing compiled model if available, else compile a new one
export const Company = models.Company || model<ICompany>('Company', CompanySchema);