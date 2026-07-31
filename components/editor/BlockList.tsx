'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { PageData } from '@/lib/types';
import EditableBlock from '@/components/editor/EditableBlock';

export type FocusRequest = {
    blockId: string;
    pos: 'start' | 'end' | number;
} | null;

export default function BlockList({ page }: { page: PageData }) {
    const addBlock = useStore((s) => s.addBlock);
    const [focusRequest, setFocusRequest] = useState<FocusRequest>(null);
    const [dragId, setDragId] = useState<string | null>(null);

    // compute numbered-list ordinal per block (resets whenever the run of
    // consecutive numbered blocks is broken)
    let ordinal = 0;
    const ordinals: Record<string, number> = {};
    for (const b of page.blocks) {
        if (b.type === 'numbered') {
            ordinal += 1;
            ordinals[b.id] = ordinal;
        } else {
            ordinal = 0;
        }
    }

    return (
        <div className="pb-8">
            {page.blocks.map((block, i) => (
                <EditableBlock
                    key={block.id}
                    pageId={page.id}
                    block={block}
                    index={i}
                    isLast={i === page.blocks.length - 1}
                    ordinal={ordinals[block.id]}
                    focusRequest={focusRequest}
                    setFocusRequest={setFocusRequest}
                    dragId={dragId}
                    setDragId={setDragId}
                />
            ))}
            <div
                className="h-10 cursor-text"
                onClick={() => {
                    const last = page.blocks[page.blocks.length - 1];
                    const id = addBlock(
                        page.id,
                        last?.id ?? null,
                        'paragraph',
                        '',
                    );
                    setFocusRequest({ blockId: id, pos: 'start' });
                }}
            />
        </div>
    );
}
