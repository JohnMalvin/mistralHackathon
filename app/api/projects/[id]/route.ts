import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Project } from '@/models/Project';
import { Page } from '@/models/Page';

// -------------------------------------------------------------
// GET: Fetch a project and its full page tree as a flat list.
// URL Example: /api/projects/507f1f77bcf86cd799439011
// -------------------------------------------------------------
export async function GET(
    request: Request,
    { params }: { params: { id: string } },
) {
    try {
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
        }

        await connectToDatabase();

        const project = await Project.findById(id).lean();

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const pages = await Page.find({ projectId: id }).lean();

        return NextResponse.json({
            id: project._id.toString(),
            name: project.name,
            workspaceId: project.workspaceId.toString(),
            rootPageIds: project.rootPageIds.map((pid: mongoose.Types.ObjectId) =>
                pid.toString(),
            ),
            pages: pages.map((p) => ({
                id: p._id.toString(),
                title: p.title,
                icon: p.icon,
                blocks: p.blocks,
                parentId: p.parentId ? p.parentId.toString() : null,
                children: p.children.map((cid: mongoose.Types.ObjectId) =>
                    cid.toString(),
                ),
            })),
        });
    } catch (error) {
        console.error('GET /api/projects/[id] error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
