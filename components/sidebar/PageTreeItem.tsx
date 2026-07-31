"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  ChevronRightIcon,
  PlusIcon,
  MoreHorizontalIcon,
  FileIcon,
  StarIcon,
  TrashIcon,
  CopyIcon,
} from "@/components/ui/Icons";

export default function PageTreeItem({
  pageId,
  depth,
  activePageId,
  isFavoritesSection = false,
  index,
}: {
  pageId: string;
  depth: number;
  activePageId: string | null;
  isFavoritesSection?: boolean;
  index?: number;
}) {
  const router = useRouter();
  const page = useStore((s) => s.pages[pageId]);
  const createPage = useStore((s) => s.createPage);
  const deletePage = useStore((s) => s.deletePage);
  const duplicatePage = useStore((s) => s.duplicatePage);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const movePage = useStore((s) => s.movePage);

  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragOver, setDragOver] = useState<"top" | "bottom" | "in" | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  if (!page || page.isDeleted) return null;

  const children = page.children.filter((cid) => !isFavoritesSection);
  const isActive = activePageId === pageId;

  function handleAddChild(e: React.MouseEvent) {
    e.stopPropagation();
    const id = createPage(pageId);
    setExpanded(true);
    router.push(`/doc/${id}`);
  }

  function handleDragStart(e: React.DragEvent) {
    e.stopPropagation();
    e.dataTransfer.setData("text/page-id", pageId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    if (isFavoritesSection) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top;
    if (y < rect.height * 0.25) setDragOver("top");
    else if (y > rect.height * 0.75) setDragOver("bottom");
    else setDragOver("in");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData("text/page-id");
    setDragOver(null);
    if (!draggedId || draggedId === pageId || isFavoritesSection) return;

    if (dragOver === "in") {
      movePage(draggedId, pageId, 0);
      setExpanded(true);
    } else {
      movePage(draggedId, page.parentId, dragOver === "bottom" ? (index ?? 0) + 1 : index ?? 0);
    }
  }

  return (
    <div>
      <div
        ref={rowRef}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(null)}
        onDrop={handleDrop}
        onClick={() => router.push(`/doc/${pageId}`)}
        className={`group flex cursor-pointer items-center gap-1 rounded py-1 pr-1 text-sm transition-colors ${
          isActive
            ? "bg-hover-light dark:bg-hover-dark"
            : "hover:bg-hover-light dark:hover:bg-hover-dark"
        } ${dragOver === "top" ? "border-t-2 border-accent" : ""} ${
          dragOver === "bottom" ? "border-b-2 border-accent" : ""
        } ${dragOver === "in" ? "ring-1 ring-accent" : ""}`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className={`shrink-0 rounded p-0.5 text-muted-light hover:bg-black/5 dark:text-muted-dark dark:hover:bg-white/10 ${
            children.length === 0 ? "invisible" : ""
          }`}
        >
          <ChevronRightIcon
            className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>

        <span className="shrink-0 text-[13px] leading-none">
          {page.icon || <FileIcon className="h-3.5 w-3.5" />}
        </span>

        <span className="min-w-0 flex-1 truncate text-ink-light dark:text-ink-dark">
          {page.title || "Untitled"}
        </span>

        <div className="ml-auto hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <button
            onClick={handleAddChild}
            className="rounded p-0.5 text-muted-light hover:bg-black/5 dark:text-muted-dark dark:hover:bg-white/10"
            title="Add page inside"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="rounded p-0.5 text-muted-light hover:bg-black/5 dark:text-muted-dark dark:hover:bg-white/10"
              title="More"
            >
              <MoreHorizontalIcon className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-6 z-50 w-44 animate-fadeIn rounded-md border border-border-light bg-canvas-light py-1 shadow-popover dark:border-border-dark dark:bg-[#252525]">
                  <MenuButton
                    icon={<StarIcon className="h-3.5 w-3.5" filled={page.isFavorite} />}
                    label={page.isFavorite ? "Remove favorite" : "Add to favorites"}
                    onClick={() => {
                      toggleFavorite(pageId);
                      setMenuOpen(false);
                    }}
                  />
                  <MenuButton
                    icon={<CopyIcon className="h-3.5 w-3.5" />}
                    label="Duplicate"
                    onClick={() => {
                      duplicatePage(pageId);
                      setMenuOpen(false);
                    }}
                  />
                  <MenuButton
                    icon={<TrashIcon className="h-3.5 w-3.5" />}
                    label="Move to trash"
                    danger
                    onClick={() => {
                      deletePage(pageId);
                      setMenuOpen(false);
                      if (isActive) router.push("/");
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {expanded && children.length > 0 && (
        <div>
          {children.map((cid, i) => (
            <PageTreeItem
              key={cid}
              pageId={cid}
              depth={depth + 1}
              activePageId={activePageId}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-hover-light dark:hover:bg-hover-dark ${
        danger ? "text-red-500" : "text-ink-light dark:text-ink-dark"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
