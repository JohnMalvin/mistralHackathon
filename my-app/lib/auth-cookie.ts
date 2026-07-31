import { cookies } from "next/headers";

const ACCESS_COOKIE = "access_cookie";
const REFRESH_COOKIE = "refresh_cookie";

export async function setAccessTokenCookie(token: string) {
	const cookieStore = await cookies();

	cookieStore.set({
		name: ACCESS_COOKIE,
		value: token,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",

		sameSite: "lax",
		maxAge: 60 * 15,
		path: "/",
	});
}

export async function setRefreshTokenCookie(token: string) {
	const cookieStore = await cookies();

	cookieStore.set({
		name: REFRESH_COOKIE,
		value: token,
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",

		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 7,
		path: "/",
	});
}

export async function getAccessTokenCookie() {
	const cookieStore = await cookies();
	return cookieStore.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshTokenCookie() {
	const cookieStore = await cookies();
	return cookieStore.get(REFRESH_COOKIE)?.value ?? null;
}

export async function clearAccessTokenCookie() {
	const cookieStore = await cookies();
	cookieStore.delete(ACCESS_COOKIE);
}

export async function clearRefreshTokenCookie() {
	const cookieStore = await cookies();
	cookieStore.delete(REFRESH_COOKIE);
}
