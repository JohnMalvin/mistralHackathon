'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { normalizePageJson } from '@/lib/pageJson';
import DocumentView from '@/components/editor/DocumentView';
import EmptyState from '@/components/editor/EmptyState';

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
                (async () => {
                    const res = await fetch(`/api/pages/${pageId}`);
                    if (res.ok) {
                        const raw = await res.json();
                        hydratePageAtId(pageId, normalizePageJson(raw));
                    } else {
                        router.replace('/');
                    }
                })();
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
