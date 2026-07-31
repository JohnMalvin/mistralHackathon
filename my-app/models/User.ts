import mongoose, { Schema, InferSchemaType } from "mongoose";

const userSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},

		username: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},

		passwordHash: {
			type: String,
			required: true,
		},

		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
	},
	{
		timestamps: true,
	},
);

export type User = InferSchemaType<typeof userSchema>;

export default mongoose.models.User || mongoose.model("User", userSchema);
