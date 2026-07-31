import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { ACCOUNT_TYPES, User, type AccountType } from '@/models/User';
import { Company } from '@/models/Company';
import { signJWT } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, companyName, website, teamSize } = body;

    // Default keeps older clients (which only ever sent name/email/password)
    // registering as individuals.
    const accountType: AccountType = body.accountType ?? 'individual';

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!ACCOUNT_TYPES.includes(accountType)) {
      return NextResponse.json({ error: 'Invalid account type' }, { status: 400 });
    }

    // A business account is only useful if we know which company it is for.
    if (accountType === 'business' && !companyName) {
      return NextResponse.json(
        { error: 'Company name is required for a business account' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      accountType,
      business:
        accountType === 'business'
          ? { companyName, website, teamSize }
          : undefined,
    });

    // A business account needs a real Company document — everything else
    // (workspaces, projects, pages, Jira import, share links) hangs off its
    // _id, not off the display string stored on the user.
    let companyId: string | null = null;
    if (accountType === 'business') {
      const company = await Company.create({ name: companyName, userId: user._id });
      companyId = company._id.toString();
    }

    // Registering creates the account (and its company, if any) in one step,
    // so log the user in immediately instead of sending them to /login.
    const token = await signJWT({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      accountType,
    });

    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        userId: user._id.toString(),
        accountType,
        companyId,
        companyName: companyId ? companyName : null,
      },
      { status: 201 }
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
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
