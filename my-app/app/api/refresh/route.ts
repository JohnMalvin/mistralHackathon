import { NextResponse } from "next/server";
import {
	getRefreshTokenCookie,
	setAccessTokenCookie,
	setRefreshTokenCookie,
} from "@/lib/auth-cookie";
import {
	verifyRefreshToken,
	signAccessToken,
	signRefreshToken,
} from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { hashToken } from "@/lib/hash";
import RefreshToken from "@/models/RefreshToken";

export async function POST() {
	const refreshToken = await getRefreshTokenCookie();

	if (!refreshToken) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const payload = await verifyRefreshToken(refreshToken);

	if (!payload?.sub) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	await connectDB();
	const session = await RefreshToken.findOne({
		tokenHash: hashToken(refreshToken),
		revoked: false,
	});
	const user = await User.findById(payload.sub);

	if (!session) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	const accessToken = await signAccessToken({
		sub: user._id.toString(),
		role: user.role,
	});

	const newRefreshToken = await signRefreshToken({
		sub: user._id.toString(),
	});

	session.revoked = true;
	await session.save();
	await RefreshToken.create({
		userId: user._id.toString(),
		tokenHash: hashToken(newRefreshToken),
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
	});

	await setAccessTokenCookie(accessToken);
	await setRefreshTokenCookie(newRefreshToken);

	return NextResponse.json({ message: "Token refreshed" }, { status: 200 });
}
