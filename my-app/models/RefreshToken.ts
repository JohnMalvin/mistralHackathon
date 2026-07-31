import mongoose, { Schema, InferSchemaType } from "mongoose";

const refreshTokenSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		tokenHash: {
			type: String,
			required: true,
		},

		expiresAt: {
			type: Date,
			required: true,
			index: { expires: 0 },
		},

		revoked: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	},
);

export type RefreshToken = InferSchemaType<typeof refreshTokenSchema>;
export default mongoose.models.User ||
	mongoose.model("RefreshToken", refreshTokenSchema);
