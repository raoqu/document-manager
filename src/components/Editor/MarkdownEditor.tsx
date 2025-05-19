import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import './MarkdownEditor.css';
import * as api from '../../services/api';
import type { MarkdownDocument } from '../../types';

interface MarkdownEditorProps {
  markdownDocument: MarkdownDocument | null;
  onChange: (content: string) => void;
  editable?: boolean; // Whether the editor should be in edit mode
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ markdownDocument, onChange, editable = true }) => {
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
      alert('Failed to upload image. Please try again.');
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
          alert('Failed to upload pasted image. Please try again.');
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
        <button onClick={handleImageUpload}>Insert Image</button>
        <button onClick={handleLinkInsert}>Link</button>
        
        {/* Table controls */}
        <div className="table-controls">
          <button onClick={handleInsertTable}>Insert Table</button>
          
          {/* Only show these controls when a table is selected */}
          {editor?.isActive('table') && (
            <>
              <div className="table-row-controls">
                <button onClick={handleAddRowBefore}>Add Row Before</button>
                <button onClick={handleAddRowAfter}>Add Row After</button>
                <button onClick={handleDeleteRow}>Delete Row</button>
              </div>
              
              <div className="table-column-controls">
                <button onClick={handleAddColumnBefore}>Add Column Before</button>
                <button onClick={handleAddColumnAfter}>Add Column After</button>
                <button onClick={handleDeleteColumn}>Delete Column</button>
              </div>
              
              <div className="table-cell-controls">
                <button onClick={handleToggleHeaderCell}>Toggle Header</button>
                <button onClick={handleMergeCells}>Merge Cells</button>
                <button onClick={handleSplitCell}>Split Cell</button>
              </div>
              
              <button onClick={handleDeleteTable}>Delete Table</button>
            </>
          )}
        </div>
        
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
