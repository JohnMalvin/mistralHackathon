// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-fallback-super-secret-key-change-this'
);

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Sign a new JWT token valid for 7 days
 */
export async function signJWT(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

/**
 * Verify and decode an incoming JWT token
 */
export async function verifyJWT(token: string): Promise<TokenPayload | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}