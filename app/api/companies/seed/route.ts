import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Company } from '@/models/Company';
import { Workspace } from '@/models/Workspace';
import { Project } from '@/models/Project';
import { Page } from '@/models/Page';
import { normalizePageJson } from '@/lib/pageJson';
import { buildCompanyResponse } from '@/lib/companyTree';

// Creates a page inside a project and links it into its parent's `children`
// (or the project's `rootPageIds` if it's a root page) — same pattern as
// POST /api/projects/[id]/pages.
async function createPage(
    projectId: unknown,
    parentId: unknown,
    data: { title: string; icon?: string; blocks: unknown[] },
) {
    const { title, icon, blocks } = normalizePageJson(data);
    const page = await Page.create({
        title,
        icon,
        blocks,
        projectId,
        parentId: parentId ?? null,
        children: [],
    });
    if (parentId) {
        await Page.findByIdAndUpdate(parentId, { $push: { children: page._id } });
    } else {
        await Project.findByIdAndUpdate(projectId, {
            $push: { rootPageIds: page._id },
        });
    }
    return page._id;
}

async function seedMockOrg(companyId: unknown) {
    // --- Engineering Team ---------------------------------------------
    const engineering = await Workspace.create({
        name: 'Engineering Team',
        companyId,
    });

    const corePlatform = await Project.create({
        name: 'Core Platform',
        workspaceId: engineering._id,
        rootPageIds: [],
    });
    await createPage(corePlatform._id, null, {
        title: 'Overview',
        icon: '📘',
        blocks: [
            { type: 'heading1', content: 'Core Platform' },
            { type: 'paragraph', content: 'Backend services and shared infrastructure.' },
            { type: 'callout', content: 'Owned by the platform squad.' },
        ],
    });
    const architecture = await createPage(corePlatform._id, null, {
        title: 'Architecture',
        icon: '🏗️',
        blocks: [{ type: 'heading2', content: 'Architecture' }],
    });
    await createPage(corePlatform._id, architecture, {
        title: 'API Design',
        icon: '🔌',
        blocks: [
            { type: 'heading3', content: 'API Design' },
            { type: 'code', content: 'GET /api/companies/:id' },
            { type: 'toggle', content: 'Why REST over GraphQL?', collapsed: true },
        ],
    });
    await createPage(corePlatform._id, architecture, {
        title: 'Database Schema',
        icon: '🗄️',
        blocks: [
            { type: 'heading3', content: 'Database Schema' },
            { type: 'bulleted', content: 'Company → Workspace → Project → Page' },
            { type: 'quote', content: 'Normalize until it hurts, denormalize until it works.' },
        ],
    });

    const mobileApp = await Project.create({
        name: 'Mobile App',
        workspaceId: engineering._id,
        rootPageIds: [],
    });
    await createPage(mobileApp._id, null, {
        title: 'Overview',
        icon: '📱',
        blocks: [
            { type: 'heading1', content: 'Mobile App' },
            { type: 'paragraph', content: 'iOS and Android client.' },
        ],
    });
    await createPage(mobileApp._id, null, {
        title: 'Release Checklist',
        icon: '✅',
        blocks: [
            { type: 'heading2', content: 'Release Checklist' },
            { type: 'todo', content: 'Bump version number', checked: true },
            { type: 'todo', content: 'Update changelog', checked: true },
            { type: 'todo', content: 'Submit to App Store', checked: false },
            { type: 'divider', content: '' },
            { type: 'todo', content: 'Submit to Play Store', checked: false },
        ],
    });

    // --- Product Team ---------------------------------------------
    const product = await Workspace.create({ name: 'Product Team', companyId });

    const roadmap = await Project.create({
        name: 'Roadmap 2026',
        workspaceId: product._id,
        rootPageIds: [],
    });
    await createPage(roadmap._id, null, {
        title: 'Q1 Goals',
        icon: '🎯',
        blocks: [
            { type: 'heading2', content: 'Q1 2026 Goals' },
            { type: 'numbered', content: 'Ship company/workspace hierarchy' },
            { type: 'numbered', content: 'Ship sidebar import flow' },
            { type: 'numbered', content: 'Ship real-time collaboration' },
        ],
    });
    const specs = await createPage(roadmap._id, null, {
        title: 'Specs',
        icon: '📄',
        blocks: [{ type: 'heading2', content: 'Specs' }],
    });
    await createPage(roadmap._id, specs, {
        title: 'Fruit Notes',
        icon: '🍎',
        blocks: [
            { type: 'heading3', content: 'apple' },
            { type: 'bulleted', content: 'hdfhsdjbfkbd' },
        ],
    });
    await createPage(roadmap._id, specs, {
        title: 'Onboarding Flow',
        icon: '🚪',
        blocks: [
            { type: 'heading3', content: 'Onboarding Flow' },
            { type: 'toggle', content: 'Step-by-step walkthrough', collapsed: false },
            { type: 'quote', content: 'First impressions are the whole game.' },
        ],
    });

    const userResearch = await Project.create({
        name: 'User Research',
        workspaceId: product._id,
        rootPageIds: [],
    });
    await createPage(userResearch._id, null, {
        title: 'Interview Notes',
        icon: '🎙️',
        blocks: [
            { type: 'heading2', content: 'Interview Notes' },
            { type: 'quote', content: '"I just want it to be fast."' },
            { type: 'callout', content: '5 of 8 users mentioned load time as a pain point.' },
        ],
    });

    // --- Design Team ---------------------------------------------
    const design = await Workspace.create({ name: 'Design Team', companyId });

    const designSystem = await Project.create({
        name: 'Design System',
        workspaceId: design._id,
        rootPageIds: [],
    });
    await createPage(designSystem._id, null, {
        title: 'Overview',
        icon: '🎨',
        blocks: [
            { type: 'heading1', content: 'Design System' },
            { type: 'paragraph', content: 'Shared components, tokens and guidelines.' },
            { type: 'divider', content: '' },
        ],
    });
    const components = await createPage(designSystem._id, null, {
        title: 'Components',
        icon: '🧩',
        blocks: [{ type: 'heading2', content: 'Components' }],
    });
    const buttons = await createPage(designSystem._id, components, {
        title: 'Buttons',
        icon: '🔘',
        blocks: [{ type: 'heading3', content: 'Buttons' }],
    });
    // Three levels deep: Project -> Components -> Buttons -> Primary Button
    await createPage(designSystem._id, buttons, {
        title: 'Primary Button',
        icon: '🔵',
        blocks: [
            { type: 'heading3', content: 'Primary Button' },
            { type: 'bulleted', content: 'Used for the single most important action on a screen' },
            { type: 'code', content: 'background: var(--accent);' },
        ],
    });
    await createPage(designSystem._id, components, {
        title: 'Typography',
        icon: '🔤',
        blocks: [
            { type: 'heading3', content: 'Typography' },
            { type: 'paragraph', content: 'Inter for UI, source-serif for long-form content.' },
        ],
    });
}

// -------------------------------------------------------------
// POST: Idempotent find-or-create + seed-if-empty for a company.
// Body JSON: { "name": "Acme" }
// -------------------------------------------------------------
export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-user-id');
        const body = await request.json();
        const { name } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 },
            );
        }

        if (!name) {
            return NextResponse.json({ error: 'Missing name' }, { status: 400 });
        }

        await connectToDatabase();

        let company = await Company.findOne({ name, userId });
        if (!company) {
            company = await Company.create({ name, userId });
        }

        const existingWorkspaceCount = await Workspace.countDocuments({
            companyId: company._id,
        });
        if (existingWorkspaceCount === 0) {
            await seedMockOrg(company._id);
        }

        return NextResponse.json(await buildCompanyResponse(company));
    } catch (error) {
        console.error('POST /api/companies/seed error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
