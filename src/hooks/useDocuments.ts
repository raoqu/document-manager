import { useState, useEffect } from 'react';
import type { MarkdownDocument } from '../types';
import { generateId, saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS, parseJsonDates } from '../utils/helpers';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<MarkdownDocument[]>([]);

  // Load documents from local storage on initial render
  useEffect(() => {
    const storedDocuments = loadFromLocalStorage<MarkdownDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
    // Parse date strings back to Date objects
    const parsedDocuments = parseJsonDates(storedDocuments);
    setDocuments(parsedDocuments);
  }, []);

  // Save documents to local storage whenever they change
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.DOCUMENTS, documents);
  }, [documents]);

  // Create a new document
  const createDocument = (categoryId: string, libraryId: string): MarkdownDocument => {
    const newDocument: MarkdownDocument = {
      id: generateId(),
      title: 'Untitled Document',
      content: '',
      categoryId,
      libraryId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setDocuments(prevDocuments => [...prevDocuments, newDocument]);
    return newDocument;
  };

  // Update an existing document
  const updateDocument = (updatedDocument: MarkdownDocument) => {
    setDocuments(prevDocuments =>
      prevDocuments.map(doc =>
        doc.id === updatedDocument.id ? updatedDocument : doc
      )
    );
  };

  // Delete a document
  const deleteDocument = (documentId: string) => {
    setDocuments(prevDocuments =>
      prevDocuments.filter(doc => doc.id !== documentId)
    );
  };

  // Get documents by category ID and library ID
  const getDocumentsByCategoryId = (categoryId: string, libraryId: string): MarkdownDocument[] => {
    return documents.filter(doc => doc.categoryId === categoryId && doc.libraryId === libraryId);
  };

  // Get a document by ID
  const getDocumentById = (documentId: string): MarkdownDocument | undefined => {
    return documents.find(doc => doc.id === documentId);
  };

  // Delete all documents in a category
  const deleteDocumentsByCategory = (categoryId: string, libraryId: string) => {
    setDocuments(prevDocuments =>
      prevDocuments.filter(doc => !(doc.categoryId === categoryId && doc.libraryId === libraryId))
    );
  };
  
  // Get all documents in a library
  const getDocumentsByLibraryId = (libraryId: string): MarkdownDocument[] => {
    return documents.filter(doc => doc.libraryId === libraryId);
  };
  
  // Delete all documents in a library
  const deleteDocumentsByLibrary = (libraryId: string) => {
    setDocuments(prevDocuments =>
      prevDocuments.filter(doc => doc.libraryId !== libraryId)
    );
  };

  return {
    documents,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocumentsByCategoryId,
    getDocumentById,
    deleteDocumentsByCategory,
    getDocumentsByLibraryId,
    deleteDocumentsByLibrary,
  };
};
