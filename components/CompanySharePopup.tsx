'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
    CompanyDetail,
    buildImportNode,
    countCompanyDetail,
} from '@/lib/companyImport';
import { WorkspaceSection } from '@/components/CompanyTreePreview';
import { FileIcon } from '@/components/ui/Icons';

type Phase = 'loading' | 'error' | 'popup' | 'declined' | 'importing';

export default function CompanySharePopup({
    companyId,
}: {
    companyId: string;
}) {
    const router = useRouter();
    const dbPageMap = useStore((s) => s.dbPageMap);
    const importTree = useStore((s) => s.importTree);

    const [phase, setPhase] = useState<Phase>('loading');
    const [detail, setDetail] = useState<CompanyDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/companies/${companyId}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(
                        res.status === 404
                            ? 'This link is invalid or the company was removed.'
                            : 'Failed to load company.',
                    );
                }
                return res.json();
            })
            .then(async (d: CompanyDetail) => {
                if (cancelled) return;
                setDetail(d);

                // Already pinned before — re-run the import silently instead
                // of just redirecting to the old id. importTree reuses the
                // existing page but also repairs it if it got detached from
                // the sidebar (e.g. trashed) since the last time.
                if (dbPageMap[companyId]) {
                    const node = await buildImportNode(d);
                    const localId = importTree(node, null);
                    if (!cancelled) router.replace(`/doc/${localId}`);
                    return;
                }

                setPhase('popup');
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Failed to load company.',
                    );
                    setPhase('error');
                }
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    async function handlePin() {
        if (!detail) return;
        setPhase('importing');
        try {
            const node = await buildImportNode(detail);
            const localId = importTree(node, null);
            router.push(`/doc/${localId}`);
        } catch {
            setError('Failed to pin this company.');
            setPhase('error');
        }
    }

    if (phase === 'loading') {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-light dark:text-muted-dark">
                <FileIcon className="h-10 w-10 opacity-40" />
                <p className="text-sm">Loading shared company…</p>
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-light dark:text-muted-dark">
                <FileIcon className="h-10 w-10 opacity-40" />
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (!detail) return null;
    const { workspaceCount, projectCount } = countCompanyDetail(detail);

    return (
        <div className="relative h-full">
            {(phase === 'declined' || phase === 'importing') && (
                <div className="mx-auto max-w-2xl px-12 py-12">
                    <h1 className="mb-1 text-2xl font-bold">{detail.name}</h1>
                    <p className="mb-6 text-sm text-muted-light dark:text-muted-dark">
                        {workspaceCount} workspace
                        {workspaceCount === 1 ? '' : 's'} · {projectCount}{' '}
                        project{projectCount === 1 ? '' : 's'}
                    </p>
                    <button
                        onClick={handlePin}
                        disabled={phase === 'importing'}
                        className="mb-6 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
                    >
                        {phase === 'importing'
                            ? 'Pinning…'
                            : 'Pin to my workspace'}
                    </button>
                    <div className="flex flex-col gap-3">
                        {detail.workspaces.map((ws) => (
                            <WorkspaceSection key={ws.id} workspace={ws} />
                        ))}
                    </div>
                </div>
            )}

            {phase === 'popup' && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40" />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-sm rounded-lg border border-border-light bg-canvas-light p-6 shadow-popover dark:border-border-dark dark:bg-[#252525]">
                            <h2 className="mb-1 text-lg font-semibold">
                                {detail.name}
                            </h2>
                            <p className="mb-5 text-sm text-muted-light dark:text-muted-dark">
                                {workspaceCount} workspace
                                {workspaceCount === 1 ? '' : 's'} ·{' '}
                                {projectCount} project
                                {projectCount === 1 ? '' : 's'} was shared with
                                you. Pin it to your sidebar?
                            </p>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setPhase('declined')}
                                    className="rounded-md border border-border-light px-3 py-1.5 text-sm font-medium hover:bg-hover-light dark:border-border-dark dark:hover:bg-hover-dark"
                                >
                                    Not now
                                </button>
                                <button
                                    onClick={handlePin}
                                    className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
                                >
                                    Pin to my workspace
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
