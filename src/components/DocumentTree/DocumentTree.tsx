import React, { useState, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Document } from '../../services/api';
import './DocumentTree.css';

// Item types for drag and drop
const ItemTypes = {
  DOCUMENT: 'document'
};

interface DocumentTreeProps {
  documents: Document[];
  selectedDocumentId: number | null;
  onSelectDocument: (id: number) => void;
  onCreateDocument: (parentId: number | null) => void;
  onUpdateDocumentParent: (id: number, parentId: number | null) => void;
  onRenameDocument?: (id: number, newTitle: string) => void;
}

interface DocumentNodeProps {
  document: Document;
  level: number;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onCreateDocument: (parentId: number | null) => void;
  onUpdateDocumentParent: (id: number, parentId: number | null) => void;
  onRenameDocument?: (id: number, newTitle: string) => void;
  allDocuments: Document[]; // All documents for ancestry checking
}

// The draggable and droppable document node
const DocumentNode: React.FC<DocumentNodeProps> = ({
  document,
  level,
  isSelected,
  onSelect,
  onCreateDocument,
  onUpdateDocumentParent,
  onRenameDocument,
  allDocuments
}) => {
  // Debug log for selection
  console.log(`Rendering document ${document.id} with isSelected=${isSelected}`);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(document.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set up drag source
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.DOCUMENT,
    item: { id: document.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  });

  // Set up drop target
  const [{ isOver, canDrop }, drop] = useDrop<{ id: number }, void, { isOver: boolean; canDrop: boolean }>({
    accept: ItemTypes.DOCUMENT,
    drop: (item: { id: number }) => {
      // Don't drop on self
      if (item.id !== document.id) {
        onUpdateDocumentParent(item.id, document.id);
      }
    },
    canDrop: (item: { id: number }) => {
      // Check if the operation would create a circular reference
      return !wouldCreateCircularReference(allDocuments, item.id, document.id);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    })
  });

  // Find a document by its ID in the document tree
  const findDocumentById = (docs: Document[], id: number): Document | null => {
    for (const doc of docs) {
      if (doc.id === id) {
        return doc;
      }
      if (doc.children && doc.children.length > 0) {
        const found = findDocumentById(doc.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  // Check if document B is a descendant of document A
  const isDescendantOf = (docA: Document, docBId: number): boolean => {
    if (!docA.children || docA.children.length === 0) {
      return false;
    }
    
    // Check if any direct child matches docBId
    for (const child of docA.children) {
      if (child.id === docBId) {
        return true;
      }
      // Recursively check children of children
      if (isDescendantOf(child, docBId)) {
        return true;
      }
    }
    
    return false;
  };
  
  // Check if document with draggedId would create a circular reference if moved to targetId
  const wouldCreateCircularReference = (allDocs: Document[], draggedId: number, targetId: number): boolean => {
    // Case 1: Can't drop on self
    if (draggedId === targetId) {
      return true;
    }
    
    // Case 2: Can't drop parent on its own child (or any descendant)
    const draggedDoc = findDocumentById(allDocs, draggedId);
    if (draggedDoc && isDescendantOf(draggedDoc, targetId)) {
      return true;
    }
    
    return false;
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle saving the edited title
  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== document.title && onRenameDocument) {
      onRenameDocument(document.id, editTitle);
    } else {
      setEditTitle(document.title);
    }
    setIsEditing(false);
  };

  // Handle key press in the edit input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitle(document.title);
      setIsEditing(false);
    }
  };
  
  // Handle starting edit mode
  const handleStartEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRenameDocument) {
      setIsEditing(true);
    }
  };
  
  // Handle adding a child document
  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateDocument(document.id);
  };

  // Combine drag and drop refs using useRef
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Connect the drag and drop to the ref
  useEffect(() => {
    if (nodeRef.current) {
      drag(nodeRef.current);
      drop(nodeRef.current);
    }
  }, [drag, drop]);

  // Determine CSS classes based on state
  const nodeClasses = [
    'document-node',
    isSelected ? 'selected' : '',
    isDragging ? 'dragging' : '',
    isOver && canDrop ? 'can-drop' : '',
    isOver && !canDrop ? 'no-drop' : ''
  ].filter(Boolean).join(' ');
  
  // Ensure we're using the correct selection state
  useEffect(() => {
    if (isSelected) {
      console.log(`Document ${document.id} is selected`);
    }
  }, [isSelected, document.id]);

  return (
    <div className="document-tree-item" style={{ paddingLeft: `${level * 20}px` }}>
      <div 
        ref={nodeRef}
        className={nodeClasses}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(document.id);
        }}
      >
        {document.children && document.children.length > 0 && (
          <span 
            className={`expand-icon ${isExpanded ? 'expanded' : 'collapsed'}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? '▼' : '►'}
          </span>
        )}
        
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleKeyDown}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className="document-title"
            onDoubleClick={handleStartEditing}
          >
            {document.title}
          </span>
        )}
        
        <div className="document-actions">
          <button 
            className="add-child-button"
            onClick={handleAddChild}
            title="Add child document"
          >
            +
          </button>
        </div>
      </div>

      {isExpanded && document.children && document.children.length > 0 && (
        <div className="document-children">
          {document.children.map(child => (
            <DocumentNode
              key={child.id}
              document={child}
              level={level + 1}
              isSelected={isSelected && document.id === child.id}
              onSelect={onSelect}
              onCreateDocument={onCreateDocument}
              onUpdateDocumentParent={onUpdateDocumentParent}
              onRenameDocument={onRenameDocument}
              allDocuments={allDocuments}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Root drop area for documents that should be moved to the root level
const RootDropArea: React.FC<{
  onUpdateDocumentParent: (id: number, parentId: number | null) => void;
}> = ({ onUpdateDocumentParent }) => {
  const dropRef = useRef<HTMLDivElement>(null);
  const [{ isOver, canDrop }, drop] = useDrop<{ id: number }, void, { isOver: boolean; canDrop: boolean }>({
    accept: ItemTypes.DOCUMENT,
    drop: (item: { id: number }) => {
      onUpdateDocumentParent(item.id, null);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    })
  });

  // Connect the drop to the ref
  useEffect(() => {
    if (dropRef.current) {
      drop(dropRef.current);
    }
  }, [drop]);

  const className = `root-drop-area ${isOver ? (canDrop ? 'can-drop' : 'no-drop') : ''}`;

  return (
    <div ref={dropRef} className={className}>
      <span>&nbsp;</span>
    </div>
  );
};

// Main DocumentTree component
const DocumentTree: React.FC<DocumentTreeProps> = ({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onCreateDocument,
  onUpdateDocumentParent,
  onRenameDocument
}) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="document-tree">
        <div className="document-tree-header">
          {/* <h3>Documents</h3> */}
          <button 
            className="add-root-button"
            onClick={() => onCreateDocument(null)}
            title="Add root document"
          >
            + New Document
          </button>
        </div>
        
        <div className="document-tree-content">
          {documents.length === 0 ? (
            <div className="empty-tree">
              <p>No documents found</p>
              <p>Click "New Document" to create one</p>
            </div>
          ) : (
            <>
              {documents.map(doc => (
                <DocumentNode
                  key={doc.id}
                  document={doc}
                  level={0}
                  isSelected={selectedDocumentId === doc.id}
                  onSelect={onSelectDocument}
                  onCreateDocument={onCreateDocument}
                  onUpdateDocumentParent={onUpdateDocumentParent}
                  onRenameDocument={onRenameDocument}
                  allDocuments={documents}
                />
              ))}
              <RootDropArea onUpdateDocumentParent={onUpdateDocumentParent} />
            </>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default DocumentTree;
