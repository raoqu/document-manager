import { useState, useEffect } from 'react';
import './App.css';
import DocumentTree from './components/DocumentTree/DocumentTree';
import LibraryModal from './components/Library/LibraryModal';
import MarkdownEditor from './components/Editor/MarkdownEditor';
import { useLibraries } from './hooks/useLibraries';
import { useDocumentTree } from './hooks/useDocumentTree';

function App() {
  // State for document title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
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
    renameDocument,
    updateDocumentContent,
  } = useDocumentTree(currentLibraryId);

  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Initialize edited content when current document changes
  useEffect(() => {
    if (currentDocument) {
      setEditedContent(currentDocument.content);
      // Set to edit mode by default when a document is selected
      setIsEditingDocument(true);
    } else {
      setEditedContent('');
      setIsEditingDocument(false);
    }
    // Reset title editing state when document changes
    setIsEditingTitle(false);
  }, [currentDocument]);

  // Handle document selection
  const handleSelectDocument = (documentId: number) => {
    setSelectedDocumentId(documentId);
  };

  // Handle saving document content
  const handleSaveDocument = async () => {
    if (!currentDocument) return;
    
    try {
      await updateDocumentContent(currentDocument.id, editedContent);
      setIsEditingDocument(false);
    } catch (error) {
      console.error('Error saving document:', error);
      // Show error message to user here
    }
  };

  // Setup keyboard shortcut for saving document (Ctrl+S or Cmd+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl key (Windows) or Command key (Mac) is pressed along with 'S'
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // Prevent browser's default save action
        if (currentDocument && isEditingDocument) {
          handleSaveDocument();
        }
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentDocument, isEditingDocument, editedContent]);

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
              onRenameDocument={renameDocument}
            />
          )}
        </aside>
        
        <section className="app-content">
          <div className="document-section">
            {currentDocument ? (
              <div className="document-editor">
                <div className="document-editor-header">
                  {isEditingTitle ? (
                    <div className="title-edit-container">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={() => {
                          if (editedTitle.trim() && editedTitle !== currentDocument.title) {
                            renameDocument(currentDocument.id, editedTitle);
                          }
                          setIsEditingTitle(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editedTitle.trim() && editedTitle !== currentDocument.title) {
                              renameDocument(currentDocument.id, editedTitle);
                            }
                            setIsEditingTitle(false);
                          } else if (e.key === 'Escape') {
                            setEditedTitle(currentDocument.title);
                            setIsEditingTitle(false);
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <h2 
                      onDoubleClick={() => {
                        setEditedTitle(currentDocument.title);
                        setIsEditingTitle(true);
                      }}
                      className="document-title"
                    >
                      {currentDocument.title}
                    </h2>
                  )}
                  <div className="document-actions">
                    {isEditingDocument ? (
                      <button 
                        onClick={handleSaveDocument} 
                        className="save-button"
                      >
                        Save
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          console.log('Setting isEditingDocument to true');
                          setIsEditingDocument(true);
                        }} 
                        className="edit-button"
                        style={{ display: 'block', visibility: 'visible' }}
                      >
                        Edit
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteDocument(currentDocument.id)} 
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Always use the same content source to avoid editor resets */}
                <MarkdownEditor
                  markdownDocument={{
                    id: String(currentDocument.id),
                    title: currentDocument.title,
                    content: editedContent,
                    libraryId: currentLibraryId || '',
                    categoryId: currentDocument.parent_id !== null ? String(currentDocument.parent_id) : '',
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }}
                  onChange={setEditedContent}
                  editable={isEditingDocument}
                />
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
