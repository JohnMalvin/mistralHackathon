import { connectToDatabase } from '@/lib/mongodb';
import { Company } from '@/models/Company';
import { Workspace } from '@/models/Workspace';
import { Project } from '@/models/Project';
import { Page } from '@/models/Page';

function blocksToText(blocks: unknown): string {
    if (!Array.isArray(blocks)) return '';
    return blocks
        .map((b: any) => (typeof b?.content === 'string' ? b.content : ''))
        .filter(Boolean)
        .join('\n');
}

export interface PageAIContext {
    breadcrumb: string;
    pageTitle: string;
    pageText: string;
    projectName: string | null;
    otherPages: { title: string; text: string }[];
}

// Walks a Page up to its Project/Workspace/Company and pulls its sibling
// pages, so the AI can answer either "what does this page say" or "what's
// going on in this project" from real DB content instead of a guess.
export async function buildPageAIContext(pageId: string): Promise<PageAIContext | null> {
    await connectToDatabase();

    const page = await Page.findById(pageId).lean();
    if (!page) return null;

    const project = page.projectId ? await Project.findById(page.projectId).lean() : null;
    const workspace = project ? await Workspace.findById(project.workspaceId).lean() : null;
    const company = workspace ? await Company.findById(workspace.companyId).lean() : null;

    const otherPages = project
        ? (await Page.find({ projectId: project._id, _id: { $ne: page._id } }).lean()).map(
              (p: any) => ({ title: p.title, text: blocksToText(p.blocks) }),
          )
        : [];

    return {
        breadcrumb: [company?.name, workspace?.name, project?.name, page.title]
            .filter(Boolean)
            .join(' > '),
        pageTitle: page.title,
        pageText: blocksToText(page.blocks),
        projectName: project?.name ?? null,
        otherPages,
    };
}

export function formatPageAIContext(ctx: PageAIContext, scope: 'page' | 'project'): string {
    let out = `Context: ${ctx.breadcrumb}\n\n`;
    out += `Current page — ${ctx.pageTitle}:\n${ctx.pageText || '(empty)'}\n`;

    if (scope === 'project' && ctx.otherPages.length > 0) {
        out += `\nOther pages in this project${ctx.projectName ? ` (${ctx.projectName})` : ''}:\n`;
        for (const p of ctx.otherPages) {
            out += `\n— ${p.title} —\n${p.text || '(empty)'}\n`;
        }
    }

    return out;
}
