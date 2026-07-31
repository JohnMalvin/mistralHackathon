export type BlockType =
    | 'paragraph'
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'bulleted'
    | 'numbered'
    | 'todo'
    | 'toggle'
    | 'quote'
    | 'callout'
    | 'code'
    | 'divider'
    | 'link'
    | 'table';

export interface Block {
    id: string;
    type: BlockType;
    content: string;
    checked?: boolean;
    color?: string;
    collapsed?: boolean; // for toggle blocks
    href?: string; // for link blocks — falls back to content if unset
    rows?: string[][]; // for table blocks — first row is treated as the header
}

export interface PageData {
    id: string;
    title: string;
    icon: string; // emoji
    coverColor?: string; // css gradient / color for cover
    parentId: string | null;
    children: string[]; // ordered child page ids
    blocks: Block[];
    isFavorite?: boolean;
    isDeleted?: boolean;
    createdAt: number;
    updatedAt: number;
    dbSourceId?: string; // Mongo _id this page was imported from, if any
}

export interface WorkspaceState {
    pages: Record<string, PageData>;
    rootIds: string[];
    lastOpenedId: string | null;
    dbPageMap: Record<string, string>; // Mongo page id -> local page id
}

// A resolved (already-fetched) tree node ready to be hydrated into the local
// store — used to import a whole Company/Workspace/Project/Page hierarchy at
// once. `isContentPage` distinguishes real Page documents (which the editor
// should auto-sync back to /api/pages/:id) from structural Company/Workspace/
// Project container nodes (whose dbId points to a different collection, so
// they must not be wired up for that same auto-sync).
export interface ImportNode {
    dbId: string;
    title: string;
    icon?: string;
    blocks?: Block[];
    isContentPage?: boolean;
    children: ImportNode[];
}

export const BLOCK_LABELS: Record<BlockType, string> = {
    paragraph: 'Text',
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    bulleted: 'Bulleted list',
    numbered: 'Numbered list',
    todo: 'To-do list',
    toggle: 'Toggle list',
    quote: 'Quote',
    callout: 'Callout',
    code: 'Code',
    divider: 'Divider',
    link: 'Link button',
    table: 'Table',
};
