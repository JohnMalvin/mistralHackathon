"use client";

import { useEffect, useState } from "react";
import { BlockType } from "@/lib/types";

const OPTIONS: { type: BlockType; label: string; desc: string; icon: string }[] = [
  { type: "paragraph", label: "Text", desc: "Plain text", icon: "T" },
  { type: "heading1", label: "Heading 1", desc: "Big section heading", icon: "H1" },
  { type: "heading2", label: "Heading 2", desc: "Medium section heading", icon: "H2" },
  { type: "heading3", label: "Heading 3", desc: "Small section heading", icon: "H3" },
  { type: "bulleted", label: "Bulleted list", desc: "Simple bullet list", icon: "•" },
  { type: "numbered", label: "Numbered list", desc: "List with numbering", icon: "1." },
  { type: "todo", label: "To-do list", desc: "Checkbox to track tasks", icon: "☑" },
  { type: "toggle", label: "Toggle list", desc: "Collapsible content", icon: "▸" },
  { type: "quote", label: "Quote", desc: "Capture a quote", icon: "❝" },
  { type: "callout", label: "Callout", desc: "Make text stand out", icon: "💡" },
  { type: "code", label: "Code", desc: "Monospaced code block", icon: "</>" },
  { type: "divider", label: "Divider", desc: "Visually divide blocks", icon: "—" },
];

export default function SlashMenu({
  query,
  onSelect,
  onClose,
}: {
  query: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}) {
  const filtered = OPTIONS.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, Math.max(filtered.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[active]) onSelect(filtered[active].type);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [active, filtered, onSelect, onClose]);

  if (filtered.length === 0) {
    return (
      <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-md border border-border-light bg-canvas-light p-3 text-sm text-muted-light shadow-popover dark:border-border-dark dark:bg-[#252525] dark:text-muted-dark">
        No matching blocks
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-72 overflow-y-auto scrollbar-thin rounded-md border border-border-light bg-canvas-light py-1 shadow-popover dark:border-border-dark dark:bg-[#252525]">
        {filtered.map((o, i) => (
          <button
            key={o.type}
            onMouseEnter={() => setActive(i)}
            onClick={() => onSelect(o.type)}
            className={`flex w-full items-center gap-3 px-3 py-1.5 text-left ${
              i === active ? "bg-hover-light dark:bg-hover-dark" : ""
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border-light bg-sidebar-light text-xs font-medium text-ink-light dark:border-border-dark dark:bg-sidebar-dark dark:text-ink-dark">
              {o.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-ink-light dark:text-ink-dark">
                {o.label}
              </span>
              <span className="block truncate text-xs text-muted-light dark:text-muted-dark">
                {o.desc}
              </span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
