import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/mongodb";
import { hashToken } from "@/lib/hash";
import User from "@/models/User";
import RefreshToken from "@/models/RefreshToken";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/auth-cookie";

export async function POST(req: Request) {
	try {
		await connectDB();

		const body = await req.json();

		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ message: "Email and password are required" },
				{ status: 400 },
			);
		}

		const user = await User.findOne({ email });
		if (!user) {
			return NextResponse.json(
				{ message: "Invalid credential" },
				{ status: 401 },
			);
		}

		const passwordMatch = await bcrypt.compare(password, user.passwordHash);

		if (!passwordMatch) {
			return NextResponse.json(
				{ message: "Invalid credential" },
				{ status: 401 },
			);
		}

		const accessToken = await signAccessToken({
			sub: user._id.toString(),
			role: user.role,
		});

		const refreshToken = await signRefreshToken({
			sub: user._id.toString(),
		});

		await RefreshToken.create({
			userId: user._id,
			tokenHash: hashToken(refreshToken),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
		});

		await setAccessTokenCookie(accessToken);
		await setRefreshTokenCookie(refreshToken);

		return NextResponse.json(
			{ message: "Login Successful" },
			{ status: 200 },
		);
	} catch (error) {
		console.log(error);
		return NextResponse.json(
			{ message: "Something went wrong" },
			{ status: 500 },
		);
	}
}
