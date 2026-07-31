import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Page } from '@/models/Page';
import { normalizePageJson } from '@/lib/pageJson';

// -------------------------------------------------------------
// POST: Insert a new page's JSON into MongoDB
// Body JSON: { title?, icon?, blocks: [{ type, content, ... }] }
// Response: { id } - the new page's Mongo id, usable at /shared/<id>
// -------------------------------------------------------------
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, icon, blocks } = normalizePageJson(body);

        await connectToDatabase();

        const page = await Page.create({ title, icon, blocks });

        return NextResponse.json(
            { id: page._id.toString() },
            { status: 201 },
        );
    } catch (error) {
        console.error('POST /api/pages error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
