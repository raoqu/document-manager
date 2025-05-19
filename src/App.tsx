import { useState, useEffect } from 'react';
import './App.css';
import DocumentTree from './components/DocumentTree/DocumentTree';
import LibraryModal from './components/Library/LibraryModal';
import { useLibraries } from './hooks/useLibraries';
import { useDocumentTree } from './hooks/useDocumentTree';

function App() {
  const {
    libraries,
    currentLibraryId,
    setCurrentLibraryId,
    createLibrary,
    isLoading: isLibrariesLoading,
    error: librariesError,
  } = useLibraries();

  const {
    documents,
    isLoading: isDocumentsLoading,
    error: documentsError,
    selectedDocumentId,
    setSelectedDocumentId,
    currentDocument,
    updateDocumentParent,
    handleCreateDocument,
  } = useDocumentTree(currentLibraryId);

  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Initialize edited content when current document changes
  useEffect(() => {
    if (currentDocument) {
      setEditedContent(currentDocument.content);
    } else {
      setEditedContent('');
    }
    setIsEditingDocument(false);
  }, [currentDocument]);

  // Handle document selection
  const handleSelectDocument = (documentId: number) => {
    setSelectedDocumentId(documentId);
  };

  // Handle saving document content
  const handleSaveDocument = async () => {
    if (!currentDocument) return;
    
    // TODO: Implement document content update API
    // For now, just update the UI state
    setIsEditingDocument(false);
    console.log('Saving document:', currentDocument.id, editedContent);
  };

  // Handle deleting a document
  const handleDeleteDocument = async (documentId: number) => {
    // TODO: Implement document deletion API
    console.log('Deleting document:', documentId);
  };
  
  // Handle library selection
  const handleLibraryChange = (libraryId: string) => {
    setCurrentLibraryId(libraryId);
  };
  
  // Handle creating a new library
  const handleCreateNewLibrary = () => {
    setIsLibraryModalOpen(true);
  };
  
  // Handle saving a new library from modal
  const handleSaveLibrary = async (name: string, path: string) => {
    try {
      const newLibrary = await createLibrary(name, path);
      setCurrentLibraryId(newLibrary.id);
    } catch (error) {
      alert(`Failed to create library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Markdown Manager</h1>
        <div className="library-selector">
          <div className="library-dropdown">
            {isLibrariesLoading ? (
              <div className="loading-indicator">Loading libraries...</div>
            ) : librariesError ? (
              <div className="error-message">Error: {librariesError}</div>
            ) : (
              <>
                <select 
                  value={currentLibraryId || ''}
                  onChange={(e) => {
                    handleLibraryChange(e.target.value);
                  }}
                  disabled={libraries.length === 0}
                >
                  {libraries.length === 0 ? (
                    <option value="">No libraries available</option>
                  ) : (
                    libraries.map(lib => (
                      <option key={lib.id} value={lib.id}>{lib.name}</option>
                    ))
                  )}
                </select>
                <button 
                  className="create-library-button" 
                  onClick={handleCreateNewLibrary}
                >
                  + New Library
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <aside className="app-sidebar">
          {isDocumentsLoading ? (
            <div className="loading-indicator">Loading documents...</div>
          ) : documentsError ? (
            <div className="error-message">Error: {documentsError}</div>
          ) : (
            <DocumentTree
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              onSelectDocument={handleSelectDocument}
              onCreateDocument={handleCreateDocument}
              onUpdateDocumentParent={updateDocumentParent}
            />
          )}
        </aside>
        
        <section className="app-content">
          <div className="document-section">
            {currentDocument ? (
              <div className="document-editor">
                <div className="document-editor-header">
                  <h2>{currentDocument.title}</h2>
                  <div className="document-actions">
                    {isEditingDocument ? (
                      <button onClick={handleSaveDocument} className="save-button">Save</button>
                    ) : (
                      <button onClick={() => setIsEditingDocument(true)} className="edit-button">Edit</button>
                    )}
                    <button 
                      onClick={() => handleDeleteDocument(currentDocument.id)} 
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {isEditingDocument ? (
                  <textarea
                    className="document-content-editor"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                ) : (
                  <div className="document-content-view">
                    {currentDocument.content || <em>No content</em>}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-document-selected">
                <p>Select a document from the tree or create a new one</p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <LibraryModal 
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onSave={handleSaveLibrary}
      />
    </div>
  );
}

export default App;
