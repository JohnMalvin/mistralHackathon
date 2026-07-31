import { SignJWT, jwtVerify } from "jose";

const secret = process.env.JWT_SECRET;

if (!secret) {
	throw new Error("JWT_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(secret);

export type AccessTokenPayload = {
	sub: string;
	role: "admin" | "user";
};

export type RefreshTokenPayload = {
	sub: string;
};

export async function signAccessToken(payload: AccessTokenPayload) {
	return await new SignJWT(payload)
		.setProtectedHeader({
			alg: "HS256",
		})
		.setIssuedAt()
		.setExpirationTime("15m")
		.sign(secretKey);
}

export async function verifyAccessToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, secretKey);
		return payload as AccessTokenPayload;
	} catch {
		return null;
	}
}

export async function signRefreshToken(payload: RefreshTokenPayload) {
	return await new SignJWT(payload)
		.setProtectedHeader({
			alg: "HS256",
		})
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(secretKey);
}

export async function verifyRefreshToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, secretKey);
		return payload as RefreshTokenPayload;
	} catch {
		return null;
	}
}
