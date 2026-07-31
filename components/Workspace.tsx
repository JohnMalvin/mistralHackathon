'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { normalizePageJson } from '@/lib/pageJson';
import DocumentView from '@/components/editor/DocumentView';
import EmptyState from '@/components/editor/EmptyState';

// TODO: replace with a real fetch (e.g. GET /api/pages/:id) once pages are
// looked up from MongoDB instead of being hardcoded here.
const PAGE_JSON = {
    title: 'Fruit Notes',
    icon: '🍎',
    blocks: [
        { type: 'heading3', content: 'apple' },
        { type: 'bulleted', content: 'hdfhsdjbfkbd' },
    ],
};

export default function Workspace({ pageId }: { pageId: string | null }) {
    const setLastOpened = useStore((s) => s.setLastOpened);
    const lastOpenedId = useStore((s) => s.lastOpenedId);
    const pages = useStore((s) => s.pages);
    const hydratePageAtId = useStore((s) => s.hydratePageAtId);
    const router = useRouter();

    useEffect(() => {
        if (pageId) {
            setLastOpened(pageId);
            if (!pages[pageId]) {
                hydratePageAtId(pageId, normalizePageJson(PAGE_JSON));
            }
        } else if (
            lastOpenedId &&
            pages[lastOpenedId] &&
            !pages[lastOpenedId].isDeleted
        ) {
            router.replace(`/doc/${lastOpenedId}`);
        }
    }, [pageId, lastOpenedId, pages, router, setLastOpened, hydratePageAtId]);

    const activePage = pageId ? pages[pageId] : null;

    return activePage && !activePage.isDeleted ? (
        <DocumentView key={activePage.id} page={activePage} />
    ) : (
        <EmptyState />
    );
}
