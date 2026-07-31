'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ProjectPageNode,
    ProjectSummary,
    ProjectTree,
    WorkspaceSummary,
    fetchProjectTree,
} from '@/lib/companyImport';
import { ChevronRightIcon } from '@/components/ui/Icons';

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

export function WorkspaceSection({
    workspace,
}: {
    workspace: WorkspaceSummary;
}) {
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
