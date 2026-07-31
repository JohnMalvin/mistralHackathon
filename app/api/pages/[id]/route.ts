import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Page } from '@/models/Page';

// -------------------------------------------------------------
// GET: Fetch a shared page's raw JSON by its Mongo id
// URL Example: /api/pages/507f1f77bcf86cd799439011
// -------------------------------------------------------------
export async function GET(
    request: Request,
    { params }: { params: { id: string } },
) {
    try {
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid page id' }, { status: 400 });
        }

        await connectToDatabase();

        const page = await Page.findById(id).lean();

        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        return NextResponse.json({
            title: page.title,
            icon: page.icon,
            blocks: page.blocks,
            projectId: page.projectId ? page.projectId.toString() : null,
            parentId: page.parentId ? page.parentId.toString() : null,
            children: (page.children ?? []).map((cid: mongoose.Types.ObjectId) =>
                cid.toString(),
            ),
        });
    } catch (error) {
        console.error('GET /api/pages/[id] error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// -------------------------------------------------------------
// PATCH: Persist edits made to an imported shared page back to DB
// Body JSON: { title?, icon?, blocks? }
// -------------------------------------------------------------
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } },
) {
    try {
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid page id' }, { status: 400 });
        }

        const body = await request.json();
        const { title, icon, blocks } = body;

        await connectToDatabase();

        const updated = await Page.findByIdAndUpdate(
            id,
            {
                ...(title !== undefined && { title }),
                ...(icon !== undefined && { icon }),
                ...(blocks !== undefined && { blocks }),
                updatedAt: new Date(),
            },
            { new: true, runValidators: true },
        ).lean();

        if (!updated) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Saved' });
    } catch (error) {
        console.error('PATCH /api/pages/[id] error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
