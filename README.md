# Notion Clone

A Notion-style workspace built with **Next.js 14 (App Router)**, **React**, **TypeScript**, and **Tailwind CSS**. State is managed with **Zustand** and persisted to `localStorage`, so your workspace is saved automatically in your browser.

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Features

- **Nested pages** — infinitely nestable pages in the sidebar, with expand/collapse, drag-and-drop to reorder or re-parent, search, and favorites.
- **Block-based editor** — paragraph, heading 1–3, bulleted list, numbered list, to-do checklist, toggle, quote, callout, code, and divider blocks.
- **Slash menu** — type `/` at the start of a block to change its type.
- **Keyboard-driven editing** — `Enter` to create a new block (continuing lists automatically), `Backspace` at the start of a block to merge into the previous one, `↑`/`↓` to move between blocks.
- **Drag-and-drop** — reorder blocks within a page, and reorder or re-parent pages in the sidebar.
- **Page icons & covers** — emoji icon picker and colored cover banners per page.
- **Favorites** — star any page to pin it to the top of the sidebar.
- **Trash** — deleted pages go to `/trash` and can be restored or permanently deleted.
- **Dark mode** — toggle from the sidebar footer.
- **Autosave** — everything persists to `localStorage`, so your workspace survives refreshes.

## Project structure

```
app/
  page.tsx              home route (redirects to last opened page)
  doc/[id]/page.tsx      individual page route
  trash/page.tsx         trash route
  layout.tsx, globals.css
components/
  Workspace.tsx          top-level shell (sidebar + content)
  TrashView.tsx
  sidebar/               Sidebar.tsx, PageTreeItem.tsx
  editor/                DocumentView.tsx, BlockList.tsx, EditableBlock.tsx,
                          SlashMenu.tsx, Breadcrumb.tsx, EmptyState.tsx
  ui/                    Icons.tsx, IconPicker.tsx
lib/
  types.ts               Page / Block types
  store.ts                Zustand store + persistence + seed data
```

## Notes on scope

This is a from-scratch clone focused on the core editing experience rather than a 1:1 reproduction of every Notion feature (e.g. there's no multiplayer, databases/tables, or file uploads). Toggle blocks collapse visually but — since blocks aren't nested under one another in this data model — don't hide other blocks beneath them.
