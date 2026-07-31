'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
    CompanyDetail,
    CompanySummary,
    buildImportNode,
} from '@/lib/companyImport';
import { SearchIcon, FileIcon } from '@/components/ui/Icons';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

// Lets the search box double as a paste target: a full share link or a bare
// Mongo id both resolve straight to that company's id, bypassing the name
// search entirely.
function extractCompanyId(input: string): string | null {
    const trimmed = input.trim();
    if (OBJECT_ID_RE.test(trimmed)) return trimmed;
    const match = trimmed.match(/\/shared\/company\/([0-9a-fA-F]{24})/);
    return match ? match[1] : null;
}

// One matched company: just enough to identify it and either open its
// share/pin page or copy a link to send to someone else. The actual
// import happens on /shared/company/[id] (CompanySharePopup) — this keeps
// exactly one place in the app that pins a company into the sidebar.
function CompanyResultRow({ company }: { company: CompanySummary }) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [origin] = useState(() =>
        typeof window !== 'undefined' ? window.location.origin : '',
    );

    const shareUrl = `${origin}/shared/company/${company.id}`;

    async function handleCopyLink() {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard access denied — nothing we can do, silently ignore
        }
    }

    return (
        <div className="flex items-center gap-2 rounded-md border border-border-light px-3 py-2 dark:border-border-dark">
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{company.name}</span>
                <span className="truncate font-mono text-xs text-muted-light dark:text-muted-dark">
                    {shareUrl}
                </span>
            </div>
            <button
                onClick={handleCopyLink}
                className="shrink-0 rounded-md border border-border-light px-3 py-1 text-sm font-medium hover:bg-hover-light dark:border-border-dark dark:hover:bg-hover-dark"
            >
                {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button
                onClick={() => router.push(`/shared/company/${company.id}`)}
                className="shrink-0 rounded-md bg-accent px-3 py-1 text-sm font-medium text-white hover:bg-accent/90"
            >
                Open
            </button>
        </div>
    );
}

export default function CompanyBrowser() {
    const router = useRouter();
    const importTree = useStore((s) => s.importTree);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CompanySummary[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSearch() {
        const q = query.trim();
        if (!q) return;

        const pastedId = extractCompanyId(q);
        if (pastedId) {
            router.push(`/shared/company/${pastedId}`);
            return;
        }

        setLoading(true);
        setError(null);
        setResults(null);
        try {
            const res = await fetch(
                `/api/companies?name=${encodeURIComponent(q)}`,
            );
            if (!res.ok) throw new Error('Request failed');
            const data = await res.json();
            setResults(data.companies);
        } catch {
            setError('Failed to search companies.');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateAndImport() {
        const name = query.trim();
        if (!name) return;
        setCreating(true);
        setError(null);
        try {
            const res = await fetch('/api/companies/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error('Request failed');
            const detail: CompanyDetail = await res.json();
            const node = await buildImportNode(detail);
            const localId = importTree(node, null);
            router.push(`/doc/${localId}`);
        } catch {
            setError('Failed to create company.');
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl px-12 py-12">
            <h1 className="mb-1 text-2xl font-bold">Browse companies</h1>
            <p className="mb-6 text-sm text-muted-light dark:text-muted-dark">
                Search by name, or paste a share link (or its id) to jump
                straight to a company.
            </p>

            <div className="mb-6 flex items-center gap-2 rounded-md border border-border-light px-3 py-2 dark:border-border-dark">
                <SearchIcon className="h-4 w-4 shrink-0 text-muted-light dark:text-muted-dark" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Company name or share link"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-light dark:placeholder:text-muted-dark"
                />
                <button
                    onClick={handleSearch}
                    className="shrink-0 rounded-md border border-border-light px-3 py-1 text-sm font-medium hover:bg-hover-light dark:border-border-dark dark:hover:bg-hover-dark"
                >
                    Search
                </button>
            </div>

            {loading && (
                <p className="text-sm text-muted-light dark:text-muted-dark">
                    Searching…
                </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}

            {results && results.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-light dark:text-muted-dark">
                    <FileIcon className="h-8 w-8 opacity-40" />
                    <p className="text-sm">
                        No company found for &quot;{query.trim()}&quot;.
                    </p>
                    <button
                        onClick={handleCreateAndImport}
                        disabled={creating}
                        className="rounded-md bg-accent px-3 py-1 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
                    >
                        {creating
                            ? 'Creating…'
                            : `Create "${query.trim()}" and import`}
                    </button>
                </div>
            )}

            {results && results.length > 0 && (
                <div className="flex flex-col gap-2">
                    {results.map((c) => (
                        <CompanyResultRow key={c.id} company={c} />
                    ))}
                </div>
            )}
        </div>
    );
}
