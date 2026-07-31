'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useStore, seedWorkspaceIfEmpty } from '@/lib/store';
import Sidebar from '@/components/sidebar/Sidebar';
import { ChevronsLeftIcon } from '@/components/ui/Icons';
import AIChatBox from '@/components/AIChatBox';

export default function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);
    const darkMode = useStore((s) => s.darkMode);
    const sidebarOpen = useStore((s) => s.sidebarOpen);
    const toggleSidebar = useStore((s) => s.toggleSidebar);
    const pages = useStore((s) => s.pages);
    const pathname = usePathname();

    useEffect(() => {
        seedWorkspaceIfEmpty();
        setMounted(true);
    }, []);

    const activePageId = pathname?.startsWith('/doc/')
        ? pathname.split('/doc/')[1]
        : null;
    const activePage = activePageId ? pages[activePageId] : null;

    return (
        <div className={darkMode ? 'dark' : ''}>
            <div className="relative flex h-screen w-screen overflow-hidden bg-canvas-light text-ink-light dark:bg-canvas-dark dark:text-ink-dark">
                {mounted && sidebarOpen && (
                    <Sidebar activePageId={activePageId} />
                )}

                {mounted && !sidebarOpen && (
                    <button
                        onClick={toggleSidebar}
                        title="Expand sidebar"
                        className="absolute left-2 top-2 z-30 rounded p-1.5 text-muted-light hover:bg-hover-light dark:text-muted-dark dark:hover:bg-hover-dark"
                    >
                        <ChevronsLeftIcon className="h-4 w-4 rotate-180" />
                    </button>
                )}

                <main className="relative flex-1 overflow-y-auto scrollbar-thin">
                    {mounted ? children : null}
                </main>

                {/* Authorized Workspace Only: Ask AI Floating Interface */}
                {mounted && (
                    <AIChatBox
                        pageId={activePageId}
                        pageDbId={activePage?.dbSourceId ?? null}
                        pageTitle={activePage?.title || 'Untitled'}
                    />
                )}
            </div>
        </div>
    );
}