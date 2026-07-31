import { nanoid } from 'nanoid';
import { Block, BlockType } from './types';

const VALID_BLOCK_TYPES: ReadonlySet<BlockType> = new Set([
    'paragraph',
    'heading1',
    'heading2',
    'heading3',
    'bulleted',
    'numbered',
    'todo',
    'toggle',
    'quote',
    'callout',
    'code',
    'divider',
    'link',
    'table',
]);

function normalizeRows(raw: unknown): string[][] {
    if (!Array.isArray(raw)) return [['', '']];
    const rows = raw
        .filter((row): row is unknown[] => Array.isArray(row))
        .map((row) => row.map((cell) => (typeof cell === 'string' ? cell : '')));
    return rows.length > 0 ? rows : [['', '']];
}

function normalizeBlock(raw: unknown): Block {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<
        string,
        unknown
    >;
    const type: BlockType = VALID_BLOCK_TYPES.has(r.type as BlockType)
        ? (r.type as BlockType)
        : 'paragraph';
    const block: Block = {
        id: nanoid(10),
        type,
        content: typeof r.content === 'string' ? r.content : '',
    };
    if (typeof r.checked === 'boolean') block.checked = r.checked;
    if (typeof r.color === 'string') block.color = r.color;
    if (typeof r.collapsed === 'boolean') block.collapsed = r.collapsed;
    if (typeof r.href === 'string') block.href = r.href;
    if (type === 'table') block.rows = normalizeRows(r.rows);
    return block;
}

export interface NormalizedPageJson {
    title: string;
    icon: string;
    blocks: Block[];
}

export function normalizePageJson(raw: unknown): NormalizedPageJson {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<
        string,
        unknown
    >;
    const rawBlocks = Array.isArray(r.blocks) ? r.blocks : [];
    const blocks =
        rawBlocks.length > 0
            ? rawBlocks.map(normalizeBlock)
            : [normalizeBlock(undefined)];

    return {
        title: typeof r.title === 'string' && r.title.trim() ? r.title : 'Untitled',
        icon: typeof r.icon === 'string' && r.icon ? r.icon : '📄',
        blocks,
    };
}
