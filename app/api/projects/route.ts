import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Project } from '@/models/Project';

// -------------------------------------------------------------
// POST: Create a new project inside a workspace
// Body JSON: { "name": "Acme Wiki", "workspaceId": "..." }
// -------------------------------------------------------------
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, workspaceId } = body;

        if (!name || !workspaceId) {
            return NextResponse.json(
                { error: 'Missing name or workspaceId' },
                { status: 400 },
            );
        }

        await connectToDatabase();

        const project = await Project.create({ name, workspaceId, rootPageIds: [] });

        return NextResponse.json({ id: project._id.toString() }, { status: 201 });
    } catch (error) {
        console.error('POST /api/projects error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// -------------------------------------------------------------
// GET: List a workspace's projects
// URL Example: /api/projects?workspaceId=...
// -------------------------------------------------------------
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspaceId');

        if (!workspaceId) {
            return NextResponse.json(
                { error: 'workspaceId parameter is required' },
                { status: 400 },
            );
        }

        await connectToDatabase();

        const projects = await Project.find({ workspaceId }).lean();

        return NextResponse.json({
            projects: projects.map((p) => ({
                id: p._id.toString(),
                name: p.name,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            })),
        });
    } catch (error) {
        console.error('GET /api/projects error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
