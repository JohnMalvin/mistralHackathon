import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { signAccessToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { setAccessTokenCookie } from "@/lib/auth-cookie";

const PASSWORD_SALT = Number(process.env.BCRYPT_SALT);

export async function POST(req: Request) {
	try {
		await connectDB();
		const body = await req.json();
		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ message: "All fields should not be empty" },
				{ status: 400 },
			);
		}

		const existingUser = await User.findOne({
			email,
		});

		if (existingUser) {
			return NextResponse.json(
				{ message: "User already exist" },
				{ status: 409 },
			);
		}

		const passwordHash = await bcrypt.hash(password, PASSWORD_SALT);

		const user = await User.create({
			email,
			passwordHash,
			role: "user",
		});

		const token = await signAccessToken({
			sub: user._id,
			role: user.role,
		});

		await setAccessTokenCookie(token);

		return NextResponse.json(
			{ message: "Account successfully registered." },
			{ status: 200 },
		);
	} catch (error) {
		console.log(error);

		return NextResponse.json(
			{ message: "Something went wrong." },
			{ status: 500 },
		);
	}
}
