import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
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
      
      // Upload the image to the server
      const uploadResult = await api.uploadImage(
        markdownDocument.libraryId,
        parseInt(markdownDocument.id),
        file
      );
      
      // Insert the image into the editor
      if (uploadResult && uploadResult.filename) {
        // Store only the filename and construct the URL when displaying
        const imageUrl = `/api/pic/${markdownDocument.libraryId}/${markdownDocument.id}/${uploadResult.filename}`;
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
