import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({
		success: true,
		users: [
			{ id: 1, name: "John" },
			{ id: 2, name: "Jane" },
		],
	});
}
