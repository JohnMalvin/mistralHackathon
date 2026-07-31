// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  );

  response.cookies.set('token', '', {
    httpOnly: true,
    expires: new Date(0), // Expire cookie immediately
    path: '/',
  });

  return response;
}