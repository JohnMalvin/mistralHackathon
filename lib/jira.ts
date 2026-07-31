export interface ParsedJiraLink {
    baseUrl: string;
    projectKey: string;
}

// Accepts board/backlog links (.../projects/SC/boards/3/backlog) and issue
// links (.../browse/SC-123); pulls out the site origin and project key.
export function parseJiraLink(link: string): ParsedJiraLink | null {
    try {
        const url = new URL(link.trim());
        const baseUrl = `${url.protocol}//${url.host}`;

        const projectsMatch = url.pathname.match(/\/projects\/([A-Za-z0-9]+)/i);
        if (projectsMatch) return { baseUrl, projectKey: projectsMatch[1].toUpperCase() };

        const browseMatch = url.pathname.match(/\/browse\/([A-Za-z0-9]+)-\d+/i);
        if (browseMatch) return { baseUrl, projectKey: browseMatch[1].toUpperCase() };

        return null;
    } catch {
        return null;
    }
}

// Flattens an Atlassian Document Format description into plain text.
export function adfToText(node: unknown): string {
    if (!node || typeof node !== 'object') return '';
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === 'text') return n.text ?? '';
    if (!Array.isArray(n.content)) return '';
    const joined = n.content.map(adfToText).join('');
    const isBlock = n.type === 'paragraph' || n.type === 'heading' || n.type === 'listItem';
    return isBlock ? `${joined}\n` : joined;
}

const ISSUE_TYPE_ICON: Record<string, string> = {
    bug: '🐛',
    story: '📗',
    task: '✅',
    epic: '🚀',
    subtask: '🔧',
    'sub-task': '🔧',
};

export function iconForIssueType(name: string): string {
    return ISSUE_TYPE_ICON[name.toLowerCase()] ?? '📄';
}
