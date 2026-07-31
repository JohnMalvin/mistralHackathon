import { getAccessTokenCookie } from "./auth-cookie";
import { verifyAccessToken } from "./jwt";
import { connectDB } from "./mongodb";
import User from "@/models/User";

export async function getCurrentUser() {
	const token = await getAccessTokenCookie();

	if (!token) {
		return null;
	}

	const payload = await verifyAccessToken(token);

	if (!payload?.sub) {
		return null;
	}

	await connectDB();

	const user = await User.findById(payload.sub).select("-passwordHash");

	return user;
}
