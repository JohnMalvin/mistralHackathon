import {
	clearAccessTokenCookie,
	clearRefreshTokenCookie,
	getRefreshTokenCookie,
} from "@/lib/auth-cookie";
import { hashToken } from "@/lib/hash";
import { connectDB } from "@/lib/mongodb";
import RefreshToken from "@/models/RefreshToken";
import { NextResponse } from "next/server";

export async function POST() {
	await connectDB();
	const refreshToken = await getRefreshTokenCookie();

	if (refreshToken) {
		await RefreshToken.findOneAndUpdate(
			{ tokenHash: hashToken(refreshToken) },
			{ revoked: true },
		);
	}

	await clearAccessTokenCookie();
	await clearRefreshTokenCookie();

	return NextResponse.json({ message: "Logged out" }, { status: 200 });
}
