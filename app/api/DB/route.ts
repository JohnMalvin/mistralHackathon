import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Company } from '@/models/Company';

// -------------------------------------------------------------
// GET: Fetch company Jira data by name
// URL Example: /api/db?name=AcmeCorp
// -------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyName = searchParams.get('name');

    if (!companyName) {
      return NextResponse.json({ error: 'Company name parameter is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Query DB: find one by name, excluding _id
    const company = await Company.findOne({ name: companyName }, { _id: 0, jiraData: 1, name: 1 }).lean();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ data: company.jiraData });
  } catch (error) {
    console.error('Mongoose GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// -------------------------------------------------------------
// POST: Create or Update company Jira data
// Body JSON: { "companyName": "AcmeCorp", "jiraData": {...} }
// -------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, jiraData } = body;

    if (!companyName || !jiraData) {
      return NextResponse.json({ error: 'Missing companyName or jiraData' }, { status: 400 });
    }

    await connectToDatabase();

    // findOneAndUpdate with upsert: updates if exists, creates if new
    const updatedCompany = await Company.findOneAndUpdate(
      { name: companyName },
      { jiraData, updatedAt: new Date() },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Company Jira data saved successfully',
      company: updatedCompany,
    }, { status: 200 });

  } catch (error) {
    console.error('Mongoose POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}