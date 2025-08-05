import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import './MarkdownEditor.css';
import './editor-icons.css';
import * as api from '../../services/api';
import type { MarkdownDocument } from '../../types';

interface MarkdownEditorProps {
  markdownDocument: MarkdownDocument | null;
  onChange: (content: string) => void;
  onSave?: () => void; // Function to save the document
  onShare?: () => void; // Function to share the document with edit permissions
  onShareReadOnly?: () => void; // Function to share the document with read-only permissions
  editable?: boolean; // Whether the editor should be in edit mode
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ markdownDocument, onChange, onSave, onShare, onShareReadOnly, editable = true, showToast }) => {
  // State for share dropdown
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const shareDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownToggleRef = useRef<HTMLButtonElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
        setShareDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Create the editor with initial configuration
  const editor = useEditor({
    // We'll control editable state via useEffect
    extensions: [
      StarterKit,
      Image,
      Link,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: markdownDocument?.content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when markdownDocument changes
  useEffect(() => {
    if (editor && markdownDocument) {
      // Only update content if it's different to avoid cursor jumps
      if (editor.getHTML() !== markdownDocument.content) {
        editor.commands.setContent(markdownDocument.content);
      }
    }
  }, [markdownDocument, editor]);
  
  // Set editable state whenever it changes or editor is initialized
  useEffect(() => {
    if (editor) {
      console.log('Setting editor editable state to:', editable);
      editor.setEditable(editable);
    }
  }, [editor, editable]);
  
  // Force update editable state on render
  if (editor && editor.isEditable !== editable) {
    console.log('Forcing editor editable update to:', editable);
    editor.setEditable(editable);
  }

  // Create a file input ref for image uploads
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload button click
  const handleImageUpload = () => {
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process the selected image file
  const handleImageFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !markdownDocument) return;
    
    const file = files[0];
    try {
      // Show loading indicator or disable button if needed
      
      // Ensure libraryId is a string and documentId is a number
      const libraryId = markdownDocument.libraryId || '';
      // Convert id to number, handling both string and number types
      const documentId = typeof markdownDocument.id === 'string' ? parseInt(markdownDocument.id) : markdownDocument.id;
      
      if (!libraryId) {
        console.error('Library ID is missing');
        return;
      }
      
      // Upload the image to the server
      const uploadResult = await api.uploadImage(
        libraryId,
        documentId,
        file
      );
      
      // Insert the image into the editor
      if (uploadResult && uploadResult.filename) {
        // Store only the filename and construct the URL when displaying
        const imageUrl = `/api/pic/${libraryId}/${markdownDocument.id}/${uploadResult.filename}`;
        editor?.chain().focus().setImage({ src: imageUrl }).run();
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast ? showToast('Failed to upload image. Please try again.', 'error') : 
                 console.error('Failed to upload image');
    }
  };

  const handleLinkInsert = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  // Handle image paste from clipboard
  const handlePaste = async (event: ClipboardEvent) => {
    if (!editor || !markdownDocument || !editable) return;
    
    const items = event.clipboardData?.items;
    if (!items) return;
    
    // Look for image items in the clipboard
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') === 0) {
        // Prevent the default paste behavior
        event.preventDefault();
        
        // Get the image as a file
        const file = items[i].getAsFile();
        if (!file) continue;
        
        try {
          console.log('Pasting image from clipboard...');
          
          // Ensure libraryId is a string and documentId is a number
          const libraryId = markdownDocument.libraryId || '';
          // Convert id to number, handling both string and number types
          const documentId = typeof markdownDocument.id === 'string' ? parseInt(markdownDocument.id) : markdownDocument.id;
          
          if (!libraryId) {
            console.error('Library ID is missing');
            return;
          }
          
          // Upload the image to the server
          const uploadResult = await api.uploadImage(
            libraryId,
            documentId,
            file
          );
          
          // Insert the image into the editor
          if (uploadResult && uploadResult.filename) {
            const imageUrl = `/api/pic/${libraryId}/${markdownDocument.id}/${uploadResult.filename}`;
            editor.chain().focus().setImage({ src: imageUrl }).run();
            console.log('Image pasted successfully:', imageUrl);
          }
        } catch (error) {
          console.error('Error uploading pasted image:', error);
          showToast ? showToast('Failed to upload pasted image. Please try again.', 'error') : 
                     console.error('Failed to upload pasted image');
        }
        
        // Only process the first image
        break;
      }
    }
  };
  
  // Add paste event listener to the editor
  useEffect(() => {
    if (!editor || !editable) return;
    
    // Get the editor DOM element
    const editorElement = editor.view.dom;
    
    // Create a type-safe event handler
    const handlePasteEvent = (event: Event) => {
      handlePaste(event as ClipboardEvent);
    };
    
    // Add paste event listener
    editorElement.addEventListener('paste', handlePasteEvent);
    
    // Cleanup
    return () => {
      editorElement.removeEventListener('paste', handlePasteEvent);
    };
  }, [editor, markdownDocument, editable]);
  
  // Handle table insertion
  const handleInsertTable = () => {
    if (!editor) return;
    
    // Default table size: 3x3
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };
  
  // Handle table row operations
  const handleAddRowBefore = () => {
    if (!editor) return;
    editor.chain().focus().addRowBefore().run();
  };
  
  const handleAddRowAfter = () => {
    if (!editor) return;
    editor.chain().focus().addRowAfter().run();
  };
  
  const handleDeleteRow = () => {
    if (!editor) return;
    editor.chain().focus().deleteRow().run();
  };
  
  // Handle table column operations
  const handleAddColumnBefore = () => {
    if (!editor) return;
    editor.chain().focus().addColumnBefore().run();
  };
  
  const handleAddColumnAfter = () => {
    if (!editor) return;
    editor.chain().focus().addColumnAfter().run();
  };
  
  const handleDeleteColumn = () => {
    if (!editor) return;
    editor.chain().focus().deleteColumn().run();
  };
  
  // Handle deleting the entire table
  const handleDeleteTable = () => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
  };
  
  // Handle merging and splitting cells
  const handleMergeCells = () => {
    if (!editor) return;
    editor.chain().focus().mergeCells().run();
  };
  
  const handleSplitCell = () => {
    if (!editor) return;
    editor.chain().focus().splitCell().run();
  };
  
  // Handle toggling header cells
  const handleToggleHeaderCell = () => {
    if (!editor) return;
    editor.chain().focus().toggleHeaderCell().run();
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editor) return;
      
      // # for header
      if (e.key === '#' && e.ctrlKey) {
        e.preventDefault();
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      }
      
      // ! for image
      if (e.key === '!' && e.ctrlKey) {
        e.preventDefault();
        handleImageUpload();
      }
      
      // [ for link
      if (e.key === '[' && e.ctrlKey) {
        e.preventDefault();
        handleLinkInsert();
      }
      
      // t for table
      if (e.key === 't' && e.ctrlKey) {
        e.preventDefault();
        handleInsertTable();
      }
    };

    window.document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        {/* Main toolbar controls */}
        {editable && onSave && (
          <button 
            className="icon-button save-button" 
            onClick={onSave}
            title="Save document"
          >
            <i className="fas fa-save"></i>
            <span className="tooltip">Save (Ctrl+S)</span>
          </button>
        )}
        
        <div className="toolbar-separator"></div>
        
        {markdownDocument && (onShare || onShareReadOnly) && (
          <div className="share-button-container" ref={shareDropdownRef}>
            <button 
              className="icon-button share-button" 
              onClick={() => onShare && onShare()}
              title="Share document"
            >
              <i className="fas fa-share-alt"></i>
              <span className="tooltip">Share Link</span>
            </button>
            <button 
              className="icon-button dropdown-toggle" 
              ref={dropdownToggleRef}
              onClick={() => {
                if (!shareDropdownOpen && dropdownToggleRef.current) {
                  const rect = dropdownToggleRef.current.getBoundingClientRect();
                  setDropdownPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.right - 160 + window.scrollX // 160px is the min-width of dropdown
                  });
                }
                setShareDropdownOpen(!shareDropdownOpen);
              }}
              title="Share options"
            >
              <i className="fas fa-caret-down"></i>
            </button>
            
            {shareDropdownOpen && (
              <div 
                className="dropdown-menu" 
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`
                }}
              >
                {onShareReadOnly && (
                  <button 
                    className="dropdown-item" 
                    onClick={() => {
                      onShareReadOnly();
                      setShareDropdownOpen(false);
                    }}
                  >
                    <i className="fas fa-eye"></i> Read only
                  </button>
                )}
                {onShare && (
                  <button 
                    className="dropdown-item" 
                    onClick={() => {
                      onShare();
                      setShareDropdownOpen(false);
                    }}
                  >
                    <i className="fas fa-edit"></i> Editable
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        <button 
          className="icon-button" 
          onClick={handleImageUpload}
          title="Insert image"
        >
          <i className="fas fa-image"></i>
          <span className="tooltip">Insert Image</span>
        </button>
        
        <button 
          className="icon-button" 
          onClick={handleLinkInsert}
          title="Insert link"
        >
          <i className="fas fa-link"></i>
          <span className="tooltip">Insert Link</span>
        </button>
        
        <div className="toolbar-separator"></div>
        
        {/* Table controls */}
        <button 
          className={`icon-button ${editor?.isActive('table') ? 'active' : ''}`}
          onClick={handleInsertTable}
          title="Insert table"
        >
          <i className="fas fa-table"></i>
          <span className="tooltip">Insert Table</span>
        </button>
        
        {/* Only show these controls when a table is selected */}
        {editor?.isActive('table') && (
          <>
            <div className="table-controls-group">
              <button 
                className="icon-button" 
                onClick={handleAddRowBefore}
                title="Add row before"
              >
                <i className="fas fa-arrow-up"></i>
                <span className="tooltip">Add Row Before</span>
              </button>
              
              <button 
                className="icon-button" 
                onClick={handleAddRowAfter}
                title="Add row after"
              >
                <i className="fas fa-arrow-down"></i>
                <span className="tooltip">Add Row After</span>
              </button>
              
              <button 
                className="icon-button" 
                onClick={handleDeleteRow}
                title="Delete row"
              >
                <i className="fas fa-minus"></i>
                <span className="tooltip">Delete Row</span>
              </button>
            </div>
            
            <div className="table-controls-group">
              <button 
                className="icon-button" 
                onClick={handleAddColumnBefore}
                title="Add column before"
              >
                <i className="fas fa-arrow-left"></i>
                <span className="tooltip">Add Column Before</span>
              </button>
              
              <button 
                className="icon-button" 
                onClick={handleAddColumnAfter}
                title="Add column after"
              >
                <i className="fas fa-arrow-right"></i>
                <span className="tooltip">Add Column After</span>
              </button>
              
              <button 
                className="icon-button" 
                onClick={handleDeleteColumn}
                title="Delete column"
              >
                <i className="fas fa-minus fa-rotate-90"></i>
                <span className="tooltip">Delete Column</span>
              </button>
            </div>
            
            <div className="table-controls-group">
              <button 
                className="icon-button" 
                onClick={handleToggleHeaderCell}
                title="Toggle header"
              >
                <i className="fas fa-heading"></i>
                <span className="tooltip">Toggle Header</span>
              </button>
              
              <button 
                className="icon-button" 
                onClick={handleMergeCells}
                title="Merge cells"
              >
                <i className="fas fa-compress-alt"></i>
                <span className="tooltip">Merge Cells</span>
              </button>
              
              <button 
                className="icon-button" 
                onClick={handleSplitCell}
                title="Split cell"
              >
                <i className="fas fa-expand-alt"></i>
                <span className="tooltip">Split Cell</span>
              </button>
            </div>
            
            <button 
              className="icon-button" 
              onClick={handleDeleteTable}
              title="Delete table"
            >
              <i className="fas fa-trash-alt"></i>
              <span className="tooltip">Delete Table</span>
            </button>
          </>
        )}
        
        {editable && (
          <span className="shortcut-hint">
            Press <kbd>Ctrl</kbd>+<kbd>S</kbd> or <kbd>⌘</kbd>+<kbd>S</kbd> to save
          </span>
        )}
        {/* Hidden file input for image uploads */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleImageFileSelected}
        />
      </div>
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
};

export default MarkdownEditor;
