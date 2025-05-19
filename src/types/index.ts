export interface Library {
  id: string;
  name: string;
  path: string;
  createdAt: Date;
}

export interface MarkdownDocument {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  libraryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children: Category[];
}

export interface EditorProps {
  document: MarkdownDocument | null;
  onSave: (document: MarkdownDocument) => void;
}

export interface CategoryTreeProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: (name: string, parentId: string | null) => void;
  onDeleteCategory: (categoryId: string) => void;
}
