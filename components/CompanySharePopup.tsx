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
import { FileIcon, LinkIcon, CheckIcon } from '@/components/ui/Icons';

type Phase = 'loading' | 'error' | 'popup' | 'declined' | 'working';

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
    const [alreadyPinned, setAlreadyPinned] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    async function handleCopyLink() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard access denied — nothing we can do, silently ignore
        }
    }

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
            .then((d: CompanyDetail) => {
                if (cancelled) return;
                setDetail(d);
                setAlreadyPinned(!!dbPageMap[companyId]);
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

    // Used both for a first-time pin and for "Go to it" on an already-pinned
    // company — importTree reuses the existing page in the latter case and
    // also repairs it if it got detached from the sidebar since last time.
    async function handleContinue() {
        if (!detail) return;
        setPhase('working');
        try {
            const node = await buildImportNode(detail);
            const localId = importTree(node, null);
            router.push(`/doc/${localId}`);
        } catch {
            setError(
                alreadyPinned
                    ? 'Failed to open this company.'
                    : 'Failed to pin this company.',
            );
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
    const continueLabel = alreadyPinned ? 'Go to it' : 'Pin to my workspace';
    const workingLabel = alreadyPinned ? 'Opening…' : 'Pinning…';
    const summary = `${workspaceCount} workspace${workspaceCount === 1 ? '' : 's'} · ${projectCount} project${projectCount === 1 ? '' : 's'}`;

    return (
        <div className="relative h-full">
            {(phase === 'declined' || phase === 'working') && (
                <div className="mx-auto max-w-2xl px-12 py-12">
                    <h1 className="mb-1 text-2xl font-bold">{detail.name}</h1>
                    <p className="mb-6 text-sm text-muted-light dark:text-muted-dark">
                        {summary}
                    </p>
                    <div className="mb-6 flex items-center gap-2">
                        <button
                            onClick={handleContinue}
                            disabled={phase === 'working'}
                            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
                        >
                            {phase === 'working' ? workingLabel : continueLabel}
                        </button>
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-1.5 rounded-md border border-border-light px-3 py-1.5 text-sm font-medium hover:bg-hover-light dark:border-border-dark dark:hover:bg-hover-dark"
                        >
                            {copied ? (
                                <CheckIcon className="h-3.5 w-3.5" />
                            ) : (
                                <LinkIcon className="h-3.5 w-3.5" />
                            )}
                            {copied ? 'Copied!' : 'Copy link'}
                        </button>
                    </div>
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
                                {alreadyPinned
                                    ? "You've already pinned this company to your sidebar."
                                    : `${summary} was shared with you. Pin it to your sidebar?`}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-1.5 rounded-md border border-border-light px-3 py-1.5 text-sm font-medium hover:bg-hover-light dark:border-border-dark dark:hover:bg-hover-dark"
                                >
                                    {copied ? (
                                        <CheckIcon className="h-3.5 w-3.5" />
                                    ) : (
                                        <LinkIcon className="h-3.5 w-3.5" />
                                    )}
                                    {copied ? 'Copied!' : 'Copy link'}
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPhase('declined')}
                                        className="rounded-md border border-border-light px-3 py-1.5 text-sm font-medium hover:bg-hover-light dark:border-border-dark dark:hover:bg-hover-dark"
                                    >
                                        Not now
                                    </button>
                                    <button
                                        onClick={handleContinue}
                                        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
                                    >
                                        {continueLabel}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
