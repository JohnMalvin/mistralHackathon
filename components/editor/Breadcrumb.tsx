'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { PageData } from '@/lib/types';

export default function Breadcrumb({ page }: { page: PageData }) {
    const router = useRouter();
    const pages = useStore((s) => s.pages);

    const chain: PageData[] = [];
    let cursor: PageData | undefined = page;
    while (cursor) {
        chain.unshift(cursor);
        cursor = cursor.parentId ? pages[cursor.parentId] : undefined;
    }

    return (
        <div className="flex items-center gap-1 truncate px-2 py-3 text-sm text-muted-light dark:text-muted-dark">
            {chain.map((p, i) => (
                <span key={p.id} className="flex items-center gap-1">
                    {i > 0 && (
                        <span className="text-muted-light dark:text-muted-dark">
                            /
                        </span>
                    )}
                    <button
                        onClick={() => router.push(`/doc/${p.id}`)}
                        className={`truncate rounded px-1 hover:bg-hover-light dark:hover:bg-hover-dark ${
                            i === chain.length - 1
                                ? 'text-ink-light dark:text-ink-dark'
                                : ''
                        }`}
                    >
                        {p.icon} {p.title || 'Untitled'}
                    </button>
                </span>
            ))}
        </div>
    );
}
