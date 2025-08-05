import { useState, useEffect, useRef } from 'react';
import './App.css';
import DocumentTree from './components/DocumentTree/DocumentTree';
import LibraryModal from './components/Library/LibraryModal';
import MarkdownEditor from './components/Editor/MarkdownEditor';
import { useLibraries } from './hooks/useLibraries';
import { useDocumentTree } from './hooks/useDocumentTree';
import ToastContainer from './components/Toast/ToastContainer';
import useToast from './hooks/useToast';

function App() {
  // State for document title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const { toasts, showToast, removeToast } = useToast();
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Track the previous document ID to detect actual document changes
  const prevDocumentIdRef = useRef<number | null>(null);
  
  // State to track if library selector should be shown
  const [showLibrarySelector, setShowLibrarySelector] = useState(false);

  // Parse URL parameters when the app loads
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const param = params.get('param');
    const libId = params.get('lib');
    const docId = params.get('doc');
    const showParam = params.get('show');
    
    // Set showLibrarySelector based on URL parameter existence
    setShowLibrarySelector(showParam !== null);
    
    // If we have both library and document IDs in the URL
    if (libId && docId) {
      // Set the library ID first
      setCurrentLibraryId(libId);
      
      // Set the document ID after a short delay to ensure the library has loaded
      const docIdNum = parseInt(docId);
      if (!isNaN(docIdNum)) {
        // Use a timeout to ensure the library has loaded and documents are fetched
        setTimeout(() => {
          setSelectedDocumentId(docIdNum);
        }, 500);
      }
    }
  }, []);
  
  // Initialize edited content when current document changes
  useEffect(() => {
    // Only run this effect if we have a current document
    if (!currentDocument) {
      prevDocumentIdRef.current = null;
      setEditedContent('');
      setIsEditingDocument(false);
      setHasUnsavedChanges(false);
      return;
    }
    
    // Skip the rest of the effect if this is the initial load
    if (prevDocumentIdRef.current === null) {
      prevDocumentIdRef.current = currentDocument.id;
      setEditedContent(currentDocument.content);
      setIsEditingDocument(true);
      return;
    }
    
    // Update the previous document ID reference
    if (currentDocument) {
      prevDocumentIdRef.current = currentDocument.id;
      setEditedContent(currentDocument.content);
      // Set to edit mode by default when a document is selected
      setIsEditingDocument(true);
    } else {
      prevDocumentIdRef.current = null;
      setEditedContent('');
      setIsEditingDocument(false);
    }
    
    // Reset states when document changes
    setIsEditingTitle(false);
    // Reset unsaved changes when document changes
    setHasUnsavedChanges(false);
  }, [currentDocument]);

  // Handle document selection with unsaved changes check
  const handleSelectDocument = (documentId: number) => {
    // Don't do anything if trying to select the current document
    if (selectedDocumentId === documentId) return;
    
    // Check for unsaved changes before switching documents
    if (hasUnsavedChanges) {
      const confirmChange = window.confirm('You have unsaved changes. Do you want to discard them?');
      if (!confirmChange) {
        // User canceled, don't switch documents
        return;
      }
      // User confirmed, proceed with document switch and reset unsaved changes
      setHasUnsavedChanges(false);
    }
    
    // Switch to the selected document
    setSelectedDocumentId(documentId);
  };

  // Handle saving document content
  const handleSaveDocument = async () => {
    if (!currentDocument) return;
    
    try {
      await updateDocumentContent(currentDocument.id, editedContent);
      setIsEditingDocument(false);
      setHasUnsavedChanges(false); // Clear unsaved changes flag after successful save
      showToast('Document saved successfully', 'success');
    } catch (error) {
      console.error('Error saving document:', error);
      showToast('Error saving document. Please try again.', 'error');
    }
  };

  // Setup keyboard shortcut for saving document (Ctrl+S or Cmd+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl key (Windows) or Command key (Mac) is pressed along with 'S'
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // Prevent browser's default save action
        
        // Only save if we have a current document, it's in edit mode, and we have a library selected
        if (currentDocument && isEditingDocument && currentLibraryId) {
          console.log('Saving document via keyboard shortcut');
          handleSaveDocument();
        } else {
          console.log('Cannot save: No document selected or not in edit mode');
          // Optionally show a message to the user
          if (!currentDocument) {
            // No need to show an alert for this case as it's not an error
            console.log('No document selected');
          }
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
  
  // Setup beforeunload event to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Standard way to show a confirmation dialog when closing the browser
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        event.returnValue = message; // For Chrome
        return message; // For other browsers
      }
    };
    
    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

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
  
  // Handle sharing document via URL
  const handleShareDocument = () => {
    if (!currentDocument || !currentLibraryId) return;
    
    // Create a URL with library and document IDs as query parameters
    const url = new URL(window.location.href);
    url.searchParams.set('lib', currentLibraryId);
    url.searchParams.set('doc', String(currentDocument.id));
    
    // Copy the URL to clipboard
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        showToast('Share link copied to clipboard!', 'success');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        showToast('Failed to copy link. Please try again.', 'error');
      });
  };

  // Handle sharing document with read-only access
  const handleShareReadOnly = () => {
    if (!currentDocument || !currentLibraryId) return;
    
    // Create a URL with a single param containing encoded information
    const url = new URL(window.location.href);
    
    // Create the base string with library and document IDs
    const baseString = `${currentLibraryId},${currentDocument.id}`;
    
    // Convert to base64
    const base64String = btoa(baseString);
    
    // Reverse the string index
    const reversedBase64 = base64String.split('').reverse().join('');
    
    // Set as a single 'param' parameter
    url.searchParams.set('param', reversedBase64);
    
    // Remove any existing lib/doc parameters to keep the URL clean
    url.searchParams.delete('lib');
    url.searchParams.delete('doc');
    url.searchParams.delete('readonly');
    url.searchParams.delete('show');
    
    // Copy the URL to clipboard
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        showToast('Read-only share link copied to clipboard!', 'success');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
        showToast('Failed to copy link. Please try again.', 'error');
      });
  };

  // Handle saving a new library from modal
  const handleSaveLibrary = async (name: string, path: string) => {
    try {
      const newLibrary = await createLibrary(name, path);
      setCurrentLibraryId(newLibrary.id);
      showToast(`Library "${name}" created successfully`, 'success');
    } catch (error) {
      showToast(`Failed to create library: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <div className="app">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <header className="app-header">
        <div className="header-left">
          <h1>Markdown Manager</h1>
        </div>
        {showLibrarySelector && (
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
        )}
      </header>
      
      <main className="app-main">
        {isMobileSidebarOpen && (
          <div 
            className="sidebar-overlay" 
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <aside className={`app-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
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
                  <button 
                    className="mobile-menu-toggle document-header-menu-toggle" 
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    aria-label="Toggle sidebar"
                  >
                    ☰
                  </button>
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
                  onChange={(content) => {
                    setEditedContent(content);
                    // Set unsaved changes flag when content changes
                    if (currentDocument && content !== currentDocument.content) {
                      setHasUnsavedChanges(true);
                    } else {
                      setHasUnsavedChanges(false);
                    }
                  }}
                  onSave={isEditingDocument ? handleSaveDocument : undefined}
                  onShare={handleShareDocument}
                  onShareReadOnly={handleShareReadOnly}
                  editable={isEditingDocument}
                  showToast={showToast}
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
