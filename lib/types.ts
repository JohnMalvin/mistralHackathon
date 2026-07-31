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
    | 'divider';

export interface Block {
    id: string;
    type: BlockType;
    content: string;
    checked?: boolean;
    color?: string;
    collapsed?: boolean; // for toggle blocks
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
// once. `blocks` omitted means "structural" node (Company/Workspace/Project);
// only real content pages carry blocks.
export interface ImportNode {
    dbId: string;
    title: string;
    icon?: string;
    blocks?: Block[];
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
};
