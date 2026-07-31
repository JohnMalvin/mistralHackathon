import { Block, ImportNode } from './types';

export interface CompanySummary {
    id: string;
    name: string;
}

export interface ProjectSummary {
    id: string;
    name: string;
}

export interface WorkspaceSummary {
    id: string;
    name: string;
    projects: ProjectSummary[];
}

export interface CompanyDetail {
    id: string;
    name: string;
    workspaces: WorkspaceSummary[];
}

export interface ProjectPageNode {
    id: string;
    title: string;
    icon?: string;
    blocks: Block[];
    parentId: string | null;
    children: string[];
}

export interface ProjectTree {
    id: string;
    name: string;
    rootPageIds: string[];
    pagesById: Record<string, ProjectPageNode>;
}

export async function fetchProjectTree(id: string): Promise<ProjectTree> {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) throw new Error('Failed to load project');
    const data = await res.json();
    const pagesById: Record<string, ProjectPageNode> = {};
    for (const p of data.pages) pagesById[p.id] = p;
    return {
        id: data.id,
        name: data.name,
        rootPageIds: data.rootPageIds,
        pagesById,
    };
}

export function pageNodeToImportNode(
    pageId: string,
    pagesById: Record<string, ProjectPageNode>,
): ImportNode | null {
    const page = pagesById[pageId];
    if (!page) return null;
    return {
        dbId: page.id,
        title: page.title,
        icon: page.icon,
        blocks: page.blocks,
        isContentPage: true,
        children: page.children
            .map((cid) => pageNodeToImportNode(cid, pagesById))
            .filter((n): n is ImportNode => n !== null),
    };
}

// Fetches every project's page tree under a resolved company and assembles
// the full Company -> Workspace -> Project -> Page node ready for importTree.
export async function buildImportNode(
    detail: CompanyDetail,
): Promise<ImportNode> {
    const workspaceNodes: ImportNode[] = [];
    for (const ws of detail.workspaces) {
        const projectNodes: ImportNode[] = [];
        for (const proj of ws.projects) {
            const tree = await fetchProjectTree(proj.id);
            const pageNodes = tree.rootPageIds
                .map((id) => pageNodeToImportNode(id, tree.pagesById))
                .filter((n): n is ImportNode => n !== null);
            projectNodes.push({
                dbId: proj.id,
                title: proj.name,
                icon: '📁',
                children: pageNodes,
            });
        }
        workspaceNodes.push({
            dbId: ws.id,
            title: ws.name,
            icon: '🗂️',
            children: projectNodes,
        });
    }
    return {
        dbId: detail.id,
        title: detail.name,
        icon: '🏢',
        children: workspaceNodes,
    };
}

export function countCompanyDetail(detail: CompanyDetail) {
    const workspaceCount = detail.workspaces.length;
    const projectCount = detail.workspaces.reduce(
        (sum, ws) => sum + ws.projects.length,
        0,
    );
    return { workspaceCount, projectCount };
}
