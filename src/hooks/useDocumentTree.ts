import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import type { Document } from '../services/api';

export const useDocumentTree = (libraryName: string | null) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

  // Fetch document tree when library changes
  useEffect(() => {
    if (!libraryName) {
      setDocuments([]);
      setSelectedDocumentId(null);
      setCurrentDocument(null);
      return;
    }

    const fetchDocumentTree = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const documentTree = await api.getDocumentTree(libraryName);
        setDocuments(documentTree);
        
        // Select first document if available and none is selected
        if (documentTree.length > 0 && !selectedDocumentId) {
          setSelectedDocumentId(documentTree[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch document tree:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch document tree');
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocumentTree();
  }, [libraryName]);

  // Update current document when selected document changes
  useEffect(() => {
    if (!selectedDocumentId) {
      setCurrentDocument(null);
      return;
    }

    const findDocument = (docs: Document[], id: number): Document | null => {
      for (const doc of docs) {
        if (doc.id === id) {
          return doc;
        }
        if (doc.children && doc.children.length > 0) {
          const found = findDocument(doc.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const doc = findDocument(documents, selectedDocumentId);
    setCurrentDocument(doc);
  }, [selectedDocumentId, documents]);

  // Create a new document
  const createDocument = useCallback(async (
    title: string,
    content: string = '',
    parentId: number | null = null
  ) => {
    if (!libraryName) return null;
    
    try {
      const newDocId = await api.createDocument(libraryName, title, content, parentId);
      
      // Refresh document tree after creating a new document
      const documentTree = await api.getDocumentTree(libraryName);
      setDocuments(documentTree);
      
      return newDocId;
    } catch (err) {
      console.error('Failed to create document:', err);
      setError(err instanceof Error ? err.message : 'Failed to create document');
      return null;
    }
  }, [libraryName]);

  // Update document parent (for drag and drop)
  const updateDocumentParent = useCallback(async (
    id: number,
    parentId: number | null
  ) => {
    if (!libraryName) return;
    
    try {
      await api.updateDocumentParent(libraryName, id, parentId);
      
      // Refresh document tree after updating parent
      const documentTree = await api.getDocumentTree(libraryName);
      setDocuments(documentTree);
    } catch (err) {
      console.error('Failed to update document parent:', err);
      setError(err instanceof Error ? err.message : 'Failed to update document parent');
    }
  }, [libraryName]);

  // Create a new document with default values
  const handleCreateDocument = useCallback(async (parentId: number | null = null) => {
    if (!libraryName) return;
    
    const newDocId = await createDocument('New Document', '', parentId);
    if (newDocId) {
      setSelectedDocumentId(newDocId);
    }
  }, [libraryName, createDocument]);

  return {
    documents,
    isLoading,
    error,
    selectedDocumentId,
    setSelectedDocumentId,
    currentDocument,
    createDocument,
    updateDocumentParent,
    handleCreateDocument,
  };
};
