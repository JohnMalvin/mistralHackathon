// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { ACCOUNT_TYPES, User, type AccountType } from '@/models/User';
import { signJWT } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password, accountType } = await req.json();

    if (accountType && !ACCOUNT_TYPES.includes(accountType)) {
      return NextResponse.json({ error: 'Invalid account type' }, { status: 400 });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Accounts created before account types existed have no value stored.
    const userAccountType: AccountType = user.accountType ?? 'individual';

    // The sign-in form is split into Individual / Business tabs; signing in
    // from the wrong tab is a mistake worth naming rather than a bad password.
    if (accountType && accountType !== userAccountType) {
      return NextResponse.json(
        {
          error: `This email is registered as a${
            userAccountType === 'individual' ? 'n individual' : ' business'
          } account. Switch tabs to sign in.`,
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = await signJWT({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      accountType: userAccountType,
    });

    // Create response & attach cookie
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          accountType: userAccountType,
          companyName: user.business?.companyName ?? null,
        },
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}