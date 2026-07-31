export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulleted"
  | "numbered"
  | "todo"
  | "toggle"
  | "quote"
  | "callout"
  | "code"
  | "divider";

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
}

export interface WorkspaceState {
  pages: Record<string, PageData>;
  rootIds: string[];
  lastOpenedId: string | null;
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  paragraph: "Text",
  heading1: "Heading 1",
  heading2: "Heading 2",
  heading3: "Heading 3",
  bulleted: "Bulleted list",
  numbered: "Numbered list",
  todo: "To-do list",
  toggle: "Toggle list",
  quote: "Quote",
  callout: "Callout",
  code: "Code",
  divider: "Divider",
};
