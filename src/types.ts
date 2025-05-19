/**
 * Type definitions for the Markdown Manager application
 */

// Document type for the markdown editor
export interface MarkdownDocument {
  id: number | string;
  title: string;
  content: string;
  // Optional fields that might be needed in some contexts
  categoryId?: number | string;
  libraryId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
