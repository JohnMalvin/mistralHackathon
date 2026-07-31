"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, seedWorkspaceIfEmpty } from "@/lib/store";
import Sidebar from "@/components/sidebar/Sidebar";
import { TrashIcon, ArrowLeftIcon, ChevronsLeftIcon } from "@/components/ui/Icons";

export default function TrashView() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const darkMode = useStore((s) => s.darkMode);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const pages = useStore((s) => s.pages);
  const restorePage = useStore((s) => s.restorePage);
  const permanentlyDeletePage = useStore((s) => s.permanentlyDeletePage);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  useEffect(() => {
    seedWorkspaceIfEmpty();
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-screen w-screen bg-canvas-light dark:bg-canvas-dark" />;
  }

  const deleted = Object.values(pages)
    .filter((p) => p.isDeleted)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="relative flex h-screen w-screen overflow-hidden bg-canvas-light text-ink-light dark:bg-canvas-dark dark:text-ink-dark">
        {sidebarOpen && <Sidebar activePageId={null} />}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="absolute left-2 top-2 z-30 rounded p-1.5 text-muted-light hover:bg-hover-light dark:text-muted-dark dark:hover:bg-hover-dark"
          >
            <ChevronsLeftIcon className="h-4 w-4 rotate-180" />
          </button>
        )}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-2xl px-8 py-10">
            <button
              onClick={() => router.push("/")}
              className="mb-4 flex items-center gap-1 text-sm text-muted-light hover:text-ink-light dark:text-muted-dark dark:hover:text-ink-dark"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" /> Back
            </button>
            <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
              <TrashIcon className="h-5 w-5" /> Trash
            </h1>
            <p className="mb-6 text-sm text-muted-light dark:text-muted-dark">
              Pages here can be restored or permanently deleted.
            </p>

            {deleted.length === 0 && (
              <p className="rounded-md border border-dashed border-border-light py-10 text-center text-sm text-muted-light dark:border-border-dark dark:text-muted-dark">
                Trash is empty
              </p>
            )}

            <div className="divide-y divide-border-light dark:divide-border-dark">
              {deleted.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <span>{p.icon}</span>
                    <span className="truncate">{p.title || "Untitled"}</span>
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => restorePage(p.id)}
                      className="rounded px-2 py-1 text-xs font-medium text-accent hover:bg-hover-light dark:hover:bg-hover-dark"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Permanently delete "${p.title || "Untitled"}"? This cannot be undone.`)) {
                          permanentlyDeletePage(p.id);
                        }
                      }}
                      className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-hover-light dark:hover:bg-hover-dark"
                    >
                      Delete forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
