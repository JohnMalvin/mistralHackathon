import mongoose, { Schema, Document } from 'mongoose';

// Two kinds of account can sign up: a person working on their own
// ("individual") and a company account that carries org details
// ("business"). Everything else about auth is identical — the account type
// only decides which extra fields are collected and travels in the JWT so
// downstream routes can branch on it.
export const ACCOUNT_TYPES = ['individual', 'business'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface IBusinessProfile {
  companyName: string;
  website?: string;
  teamSize?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  accountType: AccountType;
  business?: IBusinessProfile;
  role: 'user' | 'admin';
  createdAt: Date;
}

// Only meaningful on business accounts — an individual signup leaves the
// whole `business` object unset.
const isBusiness = function (this: IUser) {
  return this.accountType === 'business';
};

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Hashed password using bcrypt
    accountType: {
      type: String,
      enum: ACCOUNT_TYPES,
      default: 'individual',
      required: true,
    },
    business: {
      companyName: { type: String, required: isBusiness },
      website: { type: String },
      teamSize: { type: String },
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
