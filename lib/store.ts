'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { Block, BlockType, ImportNode, PageData, WorkspaceState } from './types';
import { NormalizedPageJson } from './pageJson';

function makeBlock(type: BlockType = 'paragraph', content = ''): Block {
    return { id: nanoid(10), type, content, checked: false };
}

function makePage(parentId: string | null, title = 'Untitled'): PageData {
    const now = Date.now();
    return {
        id: nanoid(10),
        title,
        icon: '📄',
        parentId,
        children: [],
        blocks: [makeBlock('paragraph', '')],
        isFavorite: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
    };
}

interface Store extends WorkspaceState {
    darkMode: boolean;
    sidebarOpen: boolean;
    toggleDarkMode: () => void;
    toggleSidebar: () => void;

    createPage: (parentId?: string | null, title?: string) => string;
    importDbPage: (dbId: string, data: NormalizedPageJson) => string;
    hydratePageAtId: (id: string, data: NormalizedPageJson) => void;
    importTree: (node: ImportNode, parentId: string | null) => string;
    deletePage: (id: string) => void;
    restorePage: (id: string) => void;
    permanentlyDeletePage: (id: string) => void;
    duplicatePage: (id: string) => void;
    updatePageTitle: (id: string, title: string) => void;
    updatePageIcon: (id: string, icon: string) => void;
    updatePageCover: (id: string, color: string | undefined) => void;
    toggleFavorite: (id: string) => void;
    movePage: (id: string, newParentId: string | null, index?: number) => void;
    setLastOpened: (id: string | null) => void;

    addBlock: (
        pageId: string,
        afterBlockId: string | null,
        type?: BlockType,
        content?: string,
    ) => string;
    updateBlock: (pageId: string, blockId: string, content: string) => void;
    deleteBlock: (pageId: string, blockId: string) => void;
    changeBlockType: (pageId: string, blockId: string, type: BlockType) => void;
    toggleTodo: (pageId: string, blockId: string) => void;
    toggleCollapsed: (pageId: string, blockId: string) => void;
    reorderBlock: (
        pageId: string,
        fromId: string,
        toId: string,
        position: 'before' | 'after',
    ) => void;
    setBlockColor: (pageId: string, blockId: string, color: string) => void;
}

export const useStore = create<Store>()(
    persist(
        (set, get) => ({
            pages: {},
            rootIds: [],
            lastOpenedId: null,
            dbPageMap: {},
            darkMode: false,
            sidebarOpen: true,

            toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
            toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

            createPage: (parentId = null, title = 'Untitled') => {
                const page = makePage(parentId, title);
                set((s) => {
                    const pages = { ...s.pages, [page.id]: page };
                    if (parentId && pages[parentId]) {
                        pages[parentId] = {
                            ...pages[parentId],
                            children: [...pages[parentId].children, page.id],
                        };
                    }
                    const rootIds = parentId
                        ? s.rootIds
                        : [...s.rootIds, page.id];
                    return { pages, rootIds };
                });
                return page.id;
            },

            importDbPage: (dbId, data) => {
                const existing = get().dbPageMap[dbId];
                if (existing && get().pages[existing]) return existing;

                const page = makePage(null, data.title);
                page.icon = data.icon;
                page.blocks = data.blocks;
                page.dbSourceId = dbId;

                set((s) => ({
                    pages: { ...s.pages, [page.id]: page },
                    rootIds: [...s.rootIds, page.id],
                    dbPageMap: { ...s.dbPageMap, [dbId]: page.id },
                }));
                return page.id;
            },

            hydratePageAtId: (id, data) => {
                if (get().pages[id]) return;

                const page = makePage(null, data.title);
                page.id = id;
                page.icon = data.icon;
                page.blocks = data.blocks;

                set((s) => ({
                    pages: { ...s.pages, [id]: page },
                    rootIds: [...s.rootIds, id],
                }));
            },

            importTree: (node, parentId) => {
                const existing = get().dbPageMap[node.dbId];
                let localId: string;

                if (existing && get().pages[existing]) {
                    localId = existing;
                } else {
                    const page = makePage(parentId, node.title);
                    page.icon = node.icon ?? '📁';
                    if (node.blocks && node.blocks.length > 0) {
                        page.blocks = node.blocks;
                    }
                    if (node.isContentPage) {
                        page.dbSourceId = node.dbId;
                    }
                    localId = page.id;

                    set((s) => ({
                        pages: { ...s.pages, [localId]: page },
                        dbPageMap: { ...s.dbPageMap, [node.dbId]: localId },
                    }));
                }

                // Whether reused or freshly created, guarantee it's actually
                // visible: un-trash it and make sure it's attached to its
                // parent's children (or rootIds). This repairs a page that
                // was imported before but got detached since (e.g. moved to
                // trash), instead of silently reusing an orphaned id.
                set((s) => {
                    const page = s.pages[localId];
                    if (!page) return {};

                    const restored = page.isDeleted
                        ? { ...page, isDeleted: false }
                        : page;
                    let pages =
                        restored === page
                            ? s.pages
                            : { ...s.pages, [localId]: restored };

                    let rootIds = s.rootIds;
                    if (!parentId) {
                        if (!rootIds.includes(localId)) {
                            rootIds = [...rootIds, localId];
                        }
                    } else if (
                        pages[parentId] &&
                        !pages[parentId].children.includes(localId)
                    ) {
                        pages = {
                            ...pages,
                            [parentId]: {
                                ...pages[parentId],
                                children: [...pages[parentId].children, localId],
                            },
                        };
                    }
                    return { pages, rootIds };
                });

                for (const child of node.children) {
                    get().importTree(child, localId);
                }
                return localId;
            },

            deletePage: (id) => {
                set((s) => {
                    const pages = { ...s.pages };
                    const markDeleted = (pid: string) => {
                        if (!pages[pid]) return;
                        pages[pid] = { ...pages[pid], isDeleted: true };
                        pages[pid].children.forEach(markDeleted);
                    };
                    markDeleted(id);
                    return { pages };
                });
            },

            restorePage: (id) => {
                set((s) => {
                    const pages = { ...s.pages };
                    if (pages[id])
                        pages[id] = { ...pages[id], isDeleted: false };
                    return { pages };
                });
            },

            permanentlyDeletePage: (id) => {
                set((s) => {
                    const pages = { ...s.pages };
                    const collectIds = (pid: string): string[] => {
                        const p = pages[pid];
                        if (!p) return [];
                        return [pid, ...p.children.flatMap(collectIds)];
                    };
                    const idsToRemove = collectIds(id);
                    idsToRemove.forEach((rid) => delete pages[rid]);
                    const rootIds = s.rootIds.filter((rid) => rid !== id);
                    const parentId = s.pages[id]?.parentId;
                    if (parentId && pages[parentId]) {
                        pages[parentId] = {
                            ...pages[parentId],
                            children: pages[parentId].children.filter(
                                (cid) => cid !== id,
                            ),
                        };
                    }
                    return { pages, rootIds };
                });
            },

            duplicatePage: (id) => {
                const s = get();
                const original = s.pages[id];
                if (!original) return;
                const copy = makePage(
                    original.parentId,
                    original.title + ' (copy)',
                );
                copy.blocks = original.blocks.map((b) => ({
                    ...b,
                    id: nanoid(10),
                }));
                copy.icon = original.icon;
                set((state) => {
                    const pages = { ...state.pages, [copy.id]: copy };
                    if (original.parentId && pages[original.parentId]) {
                        pages[original.parentId] = {
                            ...pages[original.parentId],
                            children: [
                                ...pages[original.parentId].children,
                                copy.id,
                            ],
                        };
                    }
                    const rootIds = original.parentId
                        ? state.rootIds
                        : [...state.rootIds, copy.id];
                    return { pages, rootIds };
                });
            },

            updatePageTitle: (id, title) =>
                set((s) => ({
                    pages: {
                        ...s.pages,
                        [id]: { ...s.pages[id], title, updatedAt: Date.now() },
                    },
                })),

            updatePageIcon: (id, icon) =>
                set((s) => ({
                    pages: { ...s.pages, [id]: { ...s.pages[id], icon } },
                })),

            updatePageCover: (id, color) =>
                set((s) => ({
                    pages: {
                        ...s.pages,
                        [id]: { ...s.pages[id], coverColor: color },
                    },
                })),

            toggleFavorite: (id) =>
                set((s) => ({
                    pages: {
                        ...s.pages,
                        [id]: {
                            ...s.pages[id],
                            isFavorite: !s.pages[id].isFavorite,
                        },
                    },
                })),

            movePage: (id, newParentId, index) =>
                set((s) => {
                    const pages = { ...s.pages };
                    const page = pages[id];
                    if (!page) return {};
                    const oldParentId = page.parentId;
                    let rootIds = [...s.rootIds];

                    if (oldParentId && pages[oldParentId]) {
                        pages[oldParentId] = {
                            ...pages[oldParentId],
                            children: pages[oldParentId].children.filter(
                                (c) => c !== id,
                            ),
                        };
                    } else {
                        rootIds = rootIds.filter((r) => r !== id);
                    }

                    pages[id] = { ...page, parentId: newParentId };

                    if (newParentId && pages[newParentId]) {
                        const children = [...pages[newParentId].children];
                        const insertAt = index ?? children.length;
                        children.splice(insertAt, 0, id);
                        pages[newParentId] = {
                            ...pages[newParentId],
                            children,
                        };
                    } else {
                        const insertAt = index ?? rootIds.length;
                        rootIds.splice(insertAt, 0, id);
                    }

                    return { pages, rootIds };
                }),

            setLastOpened: (id) => set({ lastOpenedId: id }),

            addBlock: (
                pageId,
                afterBlockId,
                type = 'paragraph',
                content = '',
            ) => {
                const newBlock = makeBlock(type, content);
                set((s) => {
                    const page = s.pages[pageId];
                    if (!page) return {};
                    const blocks = [...page.blocks];
                    const idx = afterBlockId
                        ? blocks.findIndex((b) => b.id === afterBlockId)
                        : blocks.length - 1;
                    blocks.splice(idx + 1, 0, newBlock);
                    return {
                        pages: {
                            ...s.pages,
                            [pageId]: {
                                ...page,
                                blocks,
                                updatedAt: Date.now(),
                            },
                        },
                    };
                });
                return newBlock.id;
            },

            updateBlock: (pageId, blockId, content) =>
                set((s) => {
                    const page = s.pages[pageId];
                    if (!page) return {};
                    const blocks = page.blocks.map((b) =>
                        b.id === blockId ? { ...b, content } : b,
                    );
                    return {
                        pages: {
                            ...s.pages,
                            [pageId]: {
                                ...page,
                                blocks,
                                updatedAt: Date.now(),
                            },
                        },
                    };
                }),

            deleteBlock: (pageId, blockId) =>
                set((s) => {
                    const page = s.pages[pageId];
                    if (!page) return {};
                    if (page.blocks.length <= 1) return {};
                    const blocks = page.blocks.filter((b) => b.id !== blockId);
                    return {
                        pages: { ...s.pages, [pageId]: { ...page, blocks } },
                    };
                }),

            changeBlockType: (pageId, blockId, type) =>
                set((s) => {
                    const page = s.pages[pageId];
                    if (!page) return {};
                    const blocks = page.blocks.map((b) =>
                        b.id === blockId ? { ...b, type } : b,
                    );
                    return {
                        pages: { ...s.pages, [pageId]: { ...page, blocks } },
                    };
                }),

            toggleTodo: (pageId, blockId) =>
                set((s) => {
                    const page = s.pages[pageId];
                    if (!page) return {};
                    const blocks = page.blocks.map((b) =>
                        b.id === blockId ? { ...b, checked: !b.checked } : b,
                    );
                    return {
                        pages: { ...s.pages, [pageId]: { ...page, blocks } },
                    };
                }),

            toggleCollapsed: (pageId, blockId) =>
                set((s) => {
                    const page = s.pages[pageId];
                    if (!page) return {};
                    const blocks = page.blocks.map((b) =>
                        b.id === blockId
                            ? { ...b, collapsed: !b.collapsed }
                            : b,
                    );
                    return {
                        pages: { ...s.pages, [pageId]: { ...page, blocks } },
                    };
                }),

            reorderBlock: (pageId, fromId, toId, position) =>
                set((s) => {
                    const page = s.pages[pageId];
                    if (!page || fromId === toId) return {};
                    const blocks = [...page.blocks];
                    const fromIdx = blocks.findIndex((b) => b.id === fromId);
                    if (fromIdx === -1) return {};
                    const [moved] = blocks.splice(fromIdx, 1);
                    let toIdx = blocks.findIndex((b) => b.id === toId);
                    if (toIdx === -1) return {};
                    if (position === 'after') toIdx += 1;
                    blocks.splice(toIdx, 0, moved);
                    return {
                        pages: { ...s.pages, [pageId]: { ...page, blocks } },
                    };
                }),

            setBlockColor: (pageId, blockId, color) =>
                set((s) => {
                    const page = s.pages[pageId];
                    if (!page) return {};
                    const blocks = page.blocks.map((b) =>
                        b.id === blockId ? { ...b, color } : b,
                    );
                    return {
                        pages: { ...s.pages, [pageId]: { ...page, blocks } },
                    };
                }),
        }),
        {
            name: 'notion-clone-storage',
        },
    ),
);

export function seedWorkspaceIfEmpty() {
    const s = useStore.getState();
    if (Object.keys(s.pages).length > 0) return;

    const welcomeId = s.createPage(null, 'Welcome to Notion Clone');
    useStore.setState((state) => {
        const page = state.pages[welcomeId];
        page.icon = '👋';
        page.blocks = [
            {
                id: nanoid(10),
                type: 'heading1',
                content: 'Welcome to your workspace',
            },
            {
                id: nanoid(10),
                type: 'paragraph',
                content:
                    'This is a fully functional Notion-style workspace built with Next.js, React and Tailwind. Click anywhere to start typing.',
            },
            { id: nanoid(10), type: 'heading2', content: 'Try these things' },
            {
                id: nanoid(10),
                type: 'todo',
                content: 'Type / to open the block menu',
                checked: false,
            },
            {
                id: nanoid(10),
                type: 'todo',
                content: 'Create a nested page from the sidebar',
                checked: false,
            },
            {
                id: nanoid(10),
                type: 'todo',
                content: 'Drag blocks by their handle to reorder',
                checked: false,
            },
            {
                id: nanoid(10),
                type: 'todo',
                content: 'Add an icon and cover to this page',
                checked: false,
            },
            {
                id: nanoid(10),
                type: 'quote',
                content: 'Simplicity is the ultimate sophistication.',
            },
            { id: nanoid(10), type: 'divider', content: '' },
            {
                id: nanoid(10),
                type: 'callout',
                content: 'This workspace saves automatically to your browser.',
            },
        ];
        return { pages: { ...state.pages, [welcomeId]: page } };
    });

    const notesId = s.createPage(null, 'Personal Notes');
    useStore.setState((state) => {
        const page = state.pages[notesId];
        page.icon = '📝';
        return { pages: { ...state.pages, [notesId]: page } };
    });
    s.createPage(notesId, 'Ideas');
    s.createPage(notesId, 'Journal');

    useStore.getState().setLastOpened(welcomeId);
}
