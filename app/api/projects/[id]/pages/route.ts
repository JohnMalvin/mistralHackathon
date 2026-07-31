import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { Project } from '@/models/Project';
import { Page } from '@/models/Page';
import { normalizePageJson } from '@/lib/pageJson';

// -------------------------------------------------------------
// POST: Create a new page (or directory — same thing, just one
// with children) inside a project, optionally nested under an
// existing page via parentId.
// Body JSON: { title?, icon?, blocks?, parentId? }
// -------------------------------------------------------------
export async function POST(
    request: Request,
    { params }: { params: { id: string } },
) {
    try {
        const { id: projectId } = params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
        }

        const body = await request.json();
        const { parentId } = body;

        if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
            return NextResponse.json({ error: 'Invalid parentId' }, { status: 400 });
        }

        await connectToDatabase();

        const project = await Project.findById(projectId);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (parentId) {
            const parent = await Page.findOne({
                _id: parentId,
                projectId,
            });
            if (!parent) {
                return NextResponse.json(
                    { error: 'Parent page not found in this project' },
                    { status: 404 },
                );
            }
        }

        const { title, icon, blocks } = normalizePageJson(body);

        const page = await Page.create({
            title,
            icon,
            blocks,
            projectId,
            parentId: parentId || null,
            children: [],
        });

        if (parentId) {
            await Page.findByIdAndUpdate(parentId, {
                $push: { children: page._id },
            });
        } else {
            await Project.findByIdAndUpdate(projectId, {
                $push: { rootPageIds: page._id },
            });
        }

        return NextResponse.json({ id: page._id.toString() }, { status: 201 });
    } catch (error) {
        console.error('POST /api/projects/[id]/pages error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
