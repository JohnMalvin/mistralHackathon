'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { fetchProjectTree, pageNodeToImportNode } from '@/lib/companyImport';
import { ImportNode } from '@/lib/types';
import { LinkIcon } from '@/components/ui/Icons';

export default function JiraImportForm() {
    const router = useRouter();
    const importTree = useStore((s) => s.importTree);

    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleImport() {
        const trimmed = link.trim();
        if (!trimmed) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/jira-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ link: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Import failed');

            const tree = await fetchProjectTree(data.projectId);
            const children = tree.rootPageIds
                .map((id) => pageNodeToImportNode(id, tree.pagesById))
                .filter((n): n is ImportNode => n !== null);

            const node: ImportNode = {
                dbId: data.projectId,
                title: data.projectName,
                icon: '🎫',
                children,
            };
            const localId = importTree(node, null);
            router.push(`/doc/${localId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import from Jira.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl px-12 py-12">
            <h1 className="mb-1 text-2xl font-bold">Import from Jira</h1>
            <p className="mb-6 text-sm text-muted-light dark:text-muted-dark">
                Paste a link to your Jira project. We&apos;ll turn it into an
                easy-to-read summary — grouped by topic, written in plain
                language, with a status table and a link back to each item in
                Jira. No Jira account or technical knowledge needed to read
                it.
            </p>

            <div className="mb-4 flex items-center gap-2 rounded-md border border-border-light px-3 py-2 dark:border-border-dark">
                <LinkIcon className="h-4 w-4 shrink-0 text-muted-light dark:text-muted-dark" />
                <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                    placeholder="https://your-domain.atlassian.net/jira/software/projects/SC/boards/3/backlog"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-light dark:placeholder:text-muted-dark"
                />
            </div>

            <button
                onClick={handleImport}
                disabled={loading || !link.trim()}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
            >
                {loading ? 'Importing…' : 'Import project'}
            </button>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        </div>
    );
}
