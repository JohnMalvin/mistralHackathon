import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { JiraContext } from '@/models/JiraContext';

export async function GET() {
  try {
    await connectToDatabase();
    const contextDoc = await JiraContext.findOne({}, { jiraData: 1, updatedAt: 1, _id: 0 }).lean();

    if (!contextDoc) {
      return NextResponse.json({ jiraData: null, updatedAt: null }, { status: 200 });
    }

    return NextResponse.json(contextDoc, { status: 200 });
  } catch (error) {
    console.error('GET Context Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}