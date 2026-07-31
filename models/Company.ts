import { Schema, model, models } from 'mongoose';

export interface ICompany {
  name: string;
  jiraData?: Record<string, any>; // Stores the Jira JSON / Markdown payload
  updatedAt?: Date;
}

const CompanySchema = new Schema<ICompany>({
  name: { type: String, required: true, unique: true },
  jiraData: { type: Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now },
});

// Reuse existing compiled model if available, else compile a new one
export const Company = models.Company || model<ICompany>('Company', CompanySchema);