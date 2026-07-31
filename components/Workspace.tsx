"use client";

import { useEffect, useState } from "react";
import { useStore, seedWorkspaceIfEmpty } from "@/lib/store";
import Sidebar from "@/components/sidebar/Sidebar";
import DocumentView from "@/components/editor/DocumentView";
import EmptyState from "@/components/editor/EmptyState";
import { useRouter } from "next/navigation";
import { ChevronsLeftIcon } from "@/components/ui/Icons";

export default function Workspace({ pageId }: { pageId: string | null }) {
  const [mounted, setMounted] = useState(false);
  const darkMode = useStore((s) => s.darkMode);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setLastOpened = useStore((s) => s.setLastOpened);
  const lastOpenedId = useStore((s) => s.lastOpenedId);
  const pages = useStore((s) => s.pages);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const router = useRouter();

  useEffect(() => {
    seedWorkspaceIfEmpty();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (pageId) {
      setLastOpened(pageId);
    } else if (lastOpenedId && pages[lastOpenedId] && !pages[lastOpenedId].isDeleted) {
      router.replace(`/doc/${lastOpenedId}`);
    }
  }, [mounted, pageId, lastOpenedId, pages, router, setLastOpened]);

  if (!mounted) {
    return <div className="h-screen w-screen bg-canvas-light dark:bg-canvas-dark" />;
  }

  const activePage = pageId ? pages[pageId] : null;

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="relative flex h-screen w-screen overflow-hidden bg-canvas-light text-ink-light dark:bg-canvas-dark dark:text-ink-dark">
        {sidebarOpen && <Sidebar activePageId={pageId} />}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="absolute left-2 top-2 z-30 rounded p-1.5 text-muted-light hover:bg-hover-light dark:text-muted-dark dark:hover:bg-hover-dark"
          >
            <ChevronsLeftIcon className="h-4 w-4 rotate-180" />
          </button>
        )}
        <main className="relative flex-1 overflow-y-auto scrollbar-thin">
          {activePage && !activePage.isDeleted ? (
            <DocumentView key={activePage.id} page={activePage} />
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </div>
  );
}
