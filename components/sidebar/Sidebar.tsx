'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import PageTreeItem from '@/components/sidebar/PageTreeItem';
import {
    PlusIcon,
    SearchIcon,
    ChevronsLeftIcon,
    TrashIcon,
    StarIcon,
    SunIcon,
    MoonIcon,
} from '@/components/ui/Icons';
import { ChevronDown, RefreshCw, LogOut, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function Sidebar({
    activePageId,
}: {
    activePageId: string | null;
}) {
    const router = useRouter();
    const pages = useStore((s) => s.pages);
    const rootIds = useStore((s) => s.rootIds);
    const createPage = useStore((s) => s.createPage);
    const toggleSidebar = useStore((s) => s.toggleSidebar);
    const darkMode = useStore((s) => s.darkMode);
    const toggleDarkMode = useStore((s) => s.toggleDarkMode);
    const [query, setQuery] = useState('');

    // Dropdown & Action states for Workspace Header
    const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsWorkspaceMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSyncJira = async () => {
        setSyncing(true);
        setSyncStatus('idle');
        try {
            const res = await fetch('/api/sync-jira', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('Sync failed');
            setSyncStatus('success');
            router.refresh();
        } catch (error) {
            console.error('Jira sync error:', error);
            setSyncStatus('error');
        } finally {
            setSyncing(false);
            setTimeout(() => setSyncStatus('idle'), 3000);
        }
    };

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            const res = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                router.push('/login');
                router.refresh();
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLogoutLoading(false);
        }
    };

    const favorites = useMemo(
        () => Object.values(pages).filter((p) => p.isFavorite && !p.isDeleted),
        [pages],
    );

    const visibleRootIds = rootIds.filter(
        (id) => pages[id] && !pages[id].isDeleted,
    );

    const searchResults = useMemo(() => {
        if (!query.trim()) return null;
        const q = query.toLowerCase();
        return Object.values(pages).filter(
            (p) => !p.isDeleted && p.title.toLowerCase().includes(q),
        );
    }, [pages, query]);

    function handleNewPage() {
        const id = createPage(null);
        router.push(`/doc/${id}`);
    }

    return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border-light bg-sidebar-light dark:border-border-dark dark:bg-sidebar-dark">
            {/* Interactive Workspace Header & Dropdown */}
            <div className="relative flex items-center justify-between px-3 pt-3" ref={menuRef}>
                <button
                    onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                    className="flex flex-1 min-w-0 items-center justify-between rounded px-1.5 py-1 text-sm font-medium hover:bg-hover-light dark:hover:bg-hover-dark"
                    title="Workspace"
                >
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent text-[11px] font-semibold text-white">
                            N
                        </span>
                        <span className="truncate">My Workspace</span>
                    </div>
                    <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-muted-light transition-transform duration-200 dark:text-muted-dark ${
                            isWorkspaceMenuOpen ? 'rotate-180' : ''
                        }`}
                    />
                </button>

                <button
                    onClick={toggleSidebar}
                    className="ml-1 rounded p-1 text-muted-light hover:bg-hover-light hover:text-ink-light dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark"
                    title="Collapse sidebar"
                >
                    <ChevronsLeftIcon className="h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {isWorkspaceMenuOpen && (
                    <div className="absolute left-3 top-full z-50 mt-1 w-56 rounded-lg border border-border-light bg-sidebar-light p-1 shadow-lg dark:border-border-dark dark:bg-sidebar-dark">
                        <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-light uppercase dark:text-muted-dark">
                            Workspace Actions
                        </div>

                        {/* Sync Jira */}
                        <button
                            onClick={handleSyncJira}
                            disabled={syncing}
                            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs font-medium text-ink-light transition-colors hover:bg-hover-light dark:text-ink-dark dark:hover:bg-hover-dark disabled:opacity-50"
                        >
                            <div className="flex items-center gap-2">
                                <RefreshCw className={`h-3.5 w-3.5 text-sky-500 ${syncing ? 'animate-spin' : ''}`} />
                                <span>{syncing ? 'Syncing Jira...' : 'Sync Jira Workspace'}</span>
                            </div>
                            {syncStatus === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                            {syncStatus === 'error' && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                        </button>

                        <div className="my-1 border-t border-border-light dark:border-border-dark" />

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            disabled={logoutLoading}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                        >
                            {logoutLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                            <span>{logoutLoading ? 'Logging out...' : 'Log out'}</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-2 px-3">
                <div className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-muted-light hover:bg-hover-light dark:text-muted-dark dark:hover:bg-hover-dark">
                    <SearchIcon className="h-3.5 w-3.5 shrink-0" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search"
                        className="w-full bg-transparent text-ink-light outline-none placeholder:text-muted-light dark:text-ink-dark dark:placeholder:text-muted-dark"
                    />
                </div>
            </div>

            <div className="mt-1 flex-1 overflow-y-auto scrollbar-thin px-1.5 pb-2">
                {searchResults ? (
                    <div className="mt-2">
                        <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-light dark:text-muted-dark">
                            {searchResults.length} result
                            {searchResults.length !== 1 && 's'}
                        </p>
                        {searchResults.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    router.push(`/doc/${p.id}`);
                                    setQuery('');
                                }}
                                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-hover-light dark:hover:bg-hover-dark"
                            >
                                <span>{p.icon}</span>
                                <span className="truncate">
                                    {p.title || 'Untitled'}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <>
                        {favorites.length > 0 && (
                            <div className="mt-2">
                                <p className="flex items-center gap-1 px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-light dark:text-muted-dark">
                                    <StarIcon className="h-3 w-3" /> Favorites
                                </p>
                                {favorites.map((p) => (
                                    <PageTreeItem
                                        key={p.id}
                                        pageId={p.id}
                                        depth={0}
                                        activePageId={activePageId}
                                        isFavoritesSection
                                    />
                                ))}
                            </div>
                        )}

                        <div className="mt-3">
                            <div className="flex items-center justify-between px-2 pb-1">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-light dark:text-muted-dark">
                                    Workspace
                                </p>
                                <button
                                    onClick={handleNewPage}
                                    className="rounded p-0.5 text-muted-light hover:bg-hover-light hover:text-ink-light dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark"
                                    title="New page"
                                >
                                    <PlusIcon className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            {visibleRootIds.length === 0 && (
                                <p className="px-2 py-1 text-xs text-muted-light dark:text-muted-dark">
                                    No pages yet
                                </p>
                            )}
                            {visibleRootIds.map((id, i) => (
                                <PageTreeItem
                                    key={id}
                                    pageId={id}
                                    depth={0}
                                    activePageId={activePageId}
                                    index={i}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="border-t border-border-light px-1.5 py-2 dark:border-border-dark">
                <button
                    onClick={handleNewPage}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm text-muted-light hover:bg-hover-light hover:text-ink-light dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark"
                >
                    <PlusIcon className="h-3.5 w-3.5" />
                    New page
                </button>
                <button
                    onClick={() => router.push('/projects')}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm text-muted-light hover:bg-hover-light hover:text-ink-light dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark"
                >
                    <SearchIcon className="h-3.5 w-3.5" />
                    Browse projects
                </button>
                <button
                    onClick={() => router.push('/trash')}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm text-muted-light hover:bg-hover-light hover:text-ink-light dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark"
                >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Trash
                </button>
                <button
                    onClick={toggleDarkMode}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm text-muted-light hover:bg-hover-light hover:text-ink-light dark:text-muted-dark dark:hover:bg-hover-dark dark:hover:text-ink-dark"
                >
                    {darkMode ? (
                        <SunIcon className="h-3.5 w-3.5" />
                    ) : (
                        <MoonIcon className="h-3.5 w-3.5" />
                    )}
                    {darkMode ? 'Light mode' : 'Dark mode'}
                </button>
            </div>
        </aside>
    );
}