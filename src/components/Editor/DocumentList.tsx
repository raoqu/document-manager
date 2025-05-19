import React from 'react';
import type { MarkdownDocument } from '../../types';

interface DocumentListProps {
  documents: MarkdownDocument[];
  selectedDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
  onCreateDocument: (categoryId: string) => void;
  categoryId: string | null;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onCreateDocument,
  categoryId,
}) => {
  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="document-list">
      <div className="document-list-header">
        <h3>Documents</h3>
        {categoryId && (
          <button onClick={() => onCreateDocument(categoryId)}>
            New Document
          </button>
        )}
      </div>
      
      {documents.length > 0 ? (
        <ul className="document-items">
          {documents.map((doc) => (
            <li 
              key={doc.id}
              className={`document-item ${selectedDocumentId === doc.id ? 'selected' : ''}`}
              onClick={() => onSelectDocument(doc.id)}
            >
              <div className="document-item-title">{doc.title}</div>
              <div className="document-item-date">
                Updated: {formatDate(doc.updatedAt)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-documents">
          {categoryId ? (
            <p>No documents in this category</p>
          ) : (
            <p>Select a category to view documents</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
