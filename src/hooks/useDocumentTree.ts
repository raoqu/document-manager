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
        
        // Only select first document if available and none is selected AND we're not expecting a specific document to be loaded
        // This prevents the first document from being loaded when we're expecting to load a specific document from URL params
        if (documentTree.length > 0 && !selectedDocumentId && !window.location.search.includes('doc=') && !window.location.search.includes('param=')) {
          // Set the selected document ID
          const firstDocId = documentTree[0].id;
          setSelectedDocumentId(firstDocId);
          
          // Also fetch the full document info for the first document
          try {
            const fullDoc = await api.getDocument(libraryName, firstDocId);
            
            // Merge the document info with the tree structure info
            setCurrentDocument({
              ...documentTree[0],
              content: fullDoc.content,
              title: fullDoc.title,
            });
          } catch (fetchErr) {
            console.error('Failed to fetch first document info:', fetchErr);
          }
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
    if (!selectedDocumentId || !libraryName) {
      setCurrentDocument(null);
      return;
    }

    const fetchDocumentInfo = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First find the document in the tree to get basic info
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

        // Get basic document info from the tree
        const basicDoc = findDocument(documents, selectedDocumentId);
        
        if (basicDoc) {
          // Fetch full document info from the API
          const fullDoc = await api.getDocument(libraryName, selectedDocumentId);
          
          // Merge the document info with the tree structure info
          setCurrentDocument({
            ...basicDoc,
            content: fullDoc.content, // Use the content from the API
            title: fullDoc.title, // Use the title from the API
          });
        } else {
          setCurrentDocument(null);
        }
      } catch (err) {
        console.error('Failed to fetch document info:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch document info');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocumentInfo();
  }, [selectedDocumentId, documents, libraryName]);

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
  
  // Rename a document
  const renameDocument = useCallback(async (id: number, newTitle: string) => {
    if (!libraryName) return;
    
    try {
      // Call the API to update the document title
      await api.updateDocument(libraryName, id, newTitle);
      
      // Refresh the document tree to get the updated data
      const documentTree = await api.getDocumentTree(libraryName);
      setDocuments(documentTree);
      
      // Update current document if it's the one being renamed
      if (currentDocument && currentDocument.id === id) {
        setCurrentDocument({ ...currentDocument, title: newTitle });
      }
    } catch (err) {
      console.error('Failed to rename document:', err);
      setError(err instanceof Error ? err.message : 'Failed to rename document');
    }
  }, [libraryName, currentDocument]);

  // Update document content
  const updateDocumentContent = useCallback(async (id: number, content: string) => {
    if (!libraryName) return false;
    
    try {
      // Call the API to update the document content
      await api.updateDocument(libraryName, id, undefined, content);
      
      // Update current document if it's the one being updated
      if (currentDocument && currentDocument.id === id) {
        setCurrentDocument({ ...currentDocument, content });
      }
      
      return true;
    } catch (err) {
      console.error('Failed to update document content:', err);
      setError(err instanceof Error ? err.message : 'Failed to update document content');
      return false;
    }
  }, [libraryName, currentDocument]);
  
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
    renameDocument,
    updateDocumentContent,
  };
};
