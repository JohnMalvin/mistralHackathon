import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { ACCOUNT_TYPES, User, type AccountType } from '@/models/User';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, companyName, website, teamSize } = body;

    // Default keeps older clients (which only ever sent name/email/password)
    // registering as individuals.
    const accountType: AccountType = body.accountType ?? 'individual';

    if (!name || !email || !password || !companyName) {
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

    return NextResponse.json(
      {
        message: 'User created successfully',
        userId: user._id,
        accountType: user.accountType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
