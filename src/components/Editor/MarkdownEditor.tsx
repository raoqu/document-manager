import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import './MarkdownEditor.css';
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

  const handleImageUpload = () => {
    const url = window.prompt('Enter image URL');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleAddLink = () => {
    const url = window.prompt('Enter URL');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
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
        handleAddLink();
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
    <div className="markdown-editor">
      <div className="editor-toolbar">
        <button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        >
          H1
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        >
          H2
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
        >
          Bold
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
        >
          Italic
        </button>
        <button onClick={handleImageUpload}>
          Image
        </button>
        <button onClick={handleAddLink}>
          Link
        </button>
        {/* {editable && (
          <span className="shortcut-hint">
            Press <kbd>Ctrl</kbd>+<kbd>S</kbd> or <kbd>⌘</kbd>+<kbd>S</kbd> to save
          </span>
        )} */}
      </div>
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
};

export default MarkdownEditor;
