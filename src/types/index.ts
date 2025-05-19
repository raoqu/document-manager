// Library interface is now defined in src/services/api.ts

export interface MarkdownDocument {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  libraryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EditorProps {
  document: MarkdownDocument | null;
  onSave: (document: MarkdownDocument) => void;
}