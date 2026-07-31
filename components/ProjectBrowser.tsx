'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Block, ImportNode } from '@/lib/types';
import { SearchIcon, ChevronRightIcon, FileIcon } from '@/components/ui/Icons';

interface ProjectSummary {
    id: string;
    name: string;
}

interface WorkspaceSummary {
    id: string;
    name: string;
    projects: ProjectSummary[];
}

interface CompanyDetail {
    id: string;
    name: string;
    workspaces: WorkspaceSummary[];
}

interface ProjectPageNode {
    id: string;
    title: string;
    icon?: string;
    blocks: Block[];
    parentId: string | null;
    children: string[];
}

interface ProjectTree {
    id: string;
    name: string;
    rootPageIds: string[];
    pagesById: Record<string, ProjectPageNode>;
}

async function fetchProjectTree(id: string): Promise<ProjectTree> {
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

function pageNodeToImportNode(
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
        children: page.children
            .map((cid) => pageNodeToImportNode(cid, pagesById))
            .filter((n): n is ImportNode => n !== null),
    };
}

function PageNode({
    pageId,
    pagesById,
    depth,
}: {
    pageId: string;
    pagesById: Record<string, ProjectPageNode>;
    depth: number;
}) {
    const [expanded, setExpanded] = useState(true);
    const page = pagesById[pageId];
    if (!page) return null;
    const hasChildren = page.children.length > 0;

    return (
        <div>
            <div
                className="flex items-center gap-1 rounded py-1 hover:bg-hover-light dark:hover:bg-hover-dark"
                style={{ paddingLeft: depth * 16 + 4 }}
            >
                {hasChildren ? (
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="rounded p-0.5 text-muted-light hover:bg-hover-light dark:text-muted-dark dark:hover:bg-hover-dark"
                    >
                        <ChevronRightIcon
                            className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
                        />
                    </button>
                ) : (
                    <span className="w-4" />
                )}
                <Link
                    href={`/shared/${page.id}`}
                    className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm hover:underline"
                >
                    <span>{page.icon || '📄'}</span>
                    <span className="truncate">{page.title || 'Untitled'}</span>
                </Link>
            </div>
            {hasChildren && expanded && (
                <div>
                    {page.children.map((childId) => (
                        <PageNode
                            key={childId}
                            pageId={childId}
                            pagesById={pagesById}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ProjectCard({ project }: { project: ProjectSummary }) {
    const [tree, setTree] = useState<ProjectTree | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(true);

    useEffect(() => {
        let cancelled = false;
        fetchProjectTree(project.id)
            .then((t) => !cancelled && setTree(t))
            .catch(() => !cancelled && setError('Failed to load this project.'))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [project.id]);

    return (
        <div className="rounded-md border border-border-light dark:border-border-dark">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left"
            >
                <ChevronRightIcon
                    className={`h-3.5 w-3.5 shrink-0 text-muted-light transition-transform dark:text-muted-dark ${open ? 'rotate-90' : ''}`}
                />
                <span className="font-medium">{project.name}</span>
            </button>
            {open && (
                <div className="border-t border-border-light px-3 py-2 dark:border-border-dark">
                    {loading && (
                        <p className="text-sm text-muted-light dark:text-muted-dark">
                            Loading…
                        </p>
                    )}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {tree && tree.rootPageIds.length === 0 && (
                        <p className="text-sm text-muted-light dark:text-muted-dark">
                            This project has no pages yet.
                        </p>
                    )}
                    {tree &&
                        tree.rootPageIds.map((id) => (
                            <PageNode
                                key={id}
                                pageId={id}
                                pagesById={tree.pagesById}
                                depth={0}
                            />
                        ))}
                </div>
            )}
        </div>
    );
}

function WorkspaceSection({ workspace }: { workspace: WorkspaceSummary }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="rounded-md border border-border-light dark:border-border-dark">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left"
            >
                <ChevronRightIcon
                    className={`h-3.5 w-3.5 shrink-0 text-muted-light transition-transform dark:text-muted-dark ${open ? 'rotate-90' : ''}`}
                />
                <span className="font-semibold">{workspace.name}</span>
            </button>
            {open && (
                <div className="flex flex-col gap-2 border-t border-border-light px-3 py-2 dark:border-border-dark">
                    {workspace.projects.length === 0 && (
                        <p className="text-sm text-muted-light dark:text-muted-dark">
                            No projects in this workspace yet.
                        </p>
                    )}
                    {workspace.projects.map((p) => (
                        <ProjectCard key={p.id} project={p} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ProjectBrowser() {
    const router = useRouter();
    const importTree = useStore((s) => s.importTree);

    const [companyName, setCompanyName] = useState('');
    const [company, setCompany] = useState<CompanyDetail | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSearch() {
        const name = companyName.trim();
        if (!name) return;
        setLoading(true);
        setError(null);
        setNotFound(false);
        setCompany(null);
        try {
            const lookup = await fetch(
                `/api/companies?name=${encodeURIComponent(name)}`,
            );
            if (lookup.status === 404) {
                setNotFound(true);
                return;
            }
            if (!lookup.ok) throw new Error('Request failed');
            const { id } = await lookup.json();
            const detailRes = await fetch(`/api/companies/${id}`);
            if (!detailRes.ok) throw new Error('Request failed');
            setCompany(await detailRes.json());
        } catch {
            setError('Failed to load company.');
        } finally {
            setLoading(false);
        }
    }

    async function handleAddData() {
        const name = companyName.trim();
        if (!name) return;
        setImporting(true);
        setError(null);
        try {
            const res = await fetch('/api/companies/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error('Request failed');
            const detail: CompanyDetail = await res.json();
            setCompany(detail);
            setNotFound(false);

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
            const companyNode: ImportNode = {
                dbId: detail.id,
                title: detail.name,
                icon: '🏢',
                children: workspaceNodes,
            };

            const localId = importTree(companyNode, null);
            router.push(`/doc/${localId}`);
        } catch {
            setError('Failed to add data.');
        } finally {
            setImporting(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl px-12 py-12">
            <h1 className="mb-1 text-2xl font-bold">Browse companies</h1>
            <p className="mb-6 text-sm text-muted-light dark:text-muted-dark">
                Type a company name to preview its workspaces and projects, or
                add mock data for it into your sidebar.
            </p>

            <div className="mb-6 flex items-center gap-2 rounded-md border border-border-light px-3 py-2 dark:border-border-dark">
                <SearchIcon className="h-4 w-4 shrink-0 text-muted-light dark:text-muted-dark" />
                <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Company name"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-light dark:placeholder:text-muted-dark"
                />
                <button
                    onClick={handleSearch}
                    className="shrink-0 rounded-md border border-border-light px-3 py-1 text-sm font-medium hover:bg-hover-light dark:border-border-dark dark:hover:bg-hover-dark"
                >
                    Search
                </button>
                <button
                    onClick={handleAddData}
                    disabled={importing}
                    className="shrink-0 rounded-md bg-accent px-3 py-1 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
                >
                    {importing ? 'Adding…' : 'Add data'}
                </button>
            </div>

            {loading && (
                <p className="text-sm text-muted-light dark:text-muted-dark">
                    Loading…
                </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}

            {notFound && (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-light dark:text-muted-dark">
                    <FileIcon className="h-8 w-8 opacity-40" />
                    <p className="text-sm">
                        No company found for &quot;{companyName.trim()}&quot;.
                        Click &quot;Add data&quot; to create it.
                    </p>
                </div>
            )}

            {company && (
                <div className="flex flex-col gap-3">
                    <h2 className="text-lg font-semibold">{company.name}</h2>
                    {company.workspaces.length === 0 && (
                        <p className="text-sm text-muted-light dark:text-muted-dark">
                            This company has no workspaces yet.
                        </p>
                    )}
                    {company.workspaces.map((ws) => (
                        <WorkspaceSection key={ws.id} workspace={ws} />
                    ))}
                </div>
            )}
        </div>
    );
}
