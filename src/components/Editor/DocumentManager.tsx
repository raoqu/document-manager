import React, { useState } from 'react';
import type { MarkdownDocument } from '../../types';
import MarkdownEditor from './MarkdownEditor';

interface DocumentManagerProps {
  document: MarkdownDocument | null;
  onSave: (document: MarkdownDocument) => void;
  onDelete: (documentId: string) => void;
  onCreateNew: () => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  document,
  onSave,
  onDelete,
  onCreateNew,
}) => {
  const [title, setTitle] = useState(document?.title || '');
  const [content, setContent] = useState(document?.content || '');
  const [isEditing, setIsEditing] = useState(!document);

  // Update local state when document changes
  React.useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setIsEditing(false);
    } else {
      setTitle('');
      setContent('');
      setIsEditing(true);
    }
  }, [document]);

  const handleSave = () => {
    if (!document) return;
    
    onSave({
      ...document,
      title,
      content,
      updatedAt: new Date(),
    });
    
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!document) return;
    
    if (window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
      onDelete(document.id);
    }
  };

  return (
    <div className="document-manager">
      {document ? (
        <>
          <div className="document-header">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                className="document-title-input"
              />
            ) : (
              <h2 className="document-title">{title}</h2>
            )}
            <div className="document-actions">
              {isEditing ? (
                <button onClick={handleSave} disabled={!title.trim()}>
                  Save
                </button>
              ) : (
                <button onClick={() => setIsEditing(true)}>
                  Edit
                </button>
              )}
              <button onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
          {isEditing ? (
            <MarkdownEditor
              markdownDocument={document}
              onChange={setContent}
            />
          ) : (
            <div 
              className="document-preview"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </>
      ) : (
        <div className="no-document">
          <p>No document selected</p>
          <button onClick={onCreateNew}>Create New Document</button>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
