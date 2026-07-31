'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import DocumentView from '@/components/editor/DocumentView';
import EmptyState from '@/components/editor/EmptyState';

export default function Workspace({ pageId }: { pageId: string | null }) {
    const setLastOpened = useStore((s) => s.setLastOpened);
    const lastOpenedId = useStore((s) => s.lastOpenedId);
    const pages = useStore((s) => s.pages);
    const router = useRouter();

    useEffect(() => {
        if (pageId) {
            setLastOpened(pageId);
        } else if (
            lastOpenedId &&
            pages[lastOpenedId] &&
            !pages[lastOpenedId].isDeleted
        ) {
            router.replace(`/doc/${lastOpenedId}`);
        }
    }, [pageId, lastOpenedId, pages, router, setLastOpened]);

    const activePage = pageId ? pages[pageId] : null;

    return activePage && !activePage.isDeleted ? (
        <DocumentView key={activePage.id} page={activePage} />
    ) : (
        <EmptyState />
    );
}
