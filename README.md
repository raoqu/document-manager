# Markdown Manager

A powerful markdown document management application built with React, TypeScript, and Tiptap. This application allows you to create, organize, and edit markdown documents with a rich text editor and a hierarchical category system.

## Features

- **Rich Text Editor**: Powered by Tiptap for a seamless editing experience
- **Image Upload**: Add images to your markdown documents
- **Link Management**: Easily add and manage links
- **Category Tree**: Organize your documents in a multi-level category structure
- **Keyboard Shortcuts**: Boost productivity with keyboard shortcuts
  - `Ctrl + #`: Insert header
  - `Ctrl + !`: Add image
  - `Ctrl + [`: Add link
- **Local Storage**: Documents and categories are saved to your browser's local storage

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Package Manager**: PNPM
- **Editor**: Tiptap (based on ProseMirror)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PNPM package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/markdown-manager.git
cd markdown-manager

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

## Usage

1. **Create Categories**: Start by creating categories to organize your documents
2. **Create Documents**: Select a category and create a new document
3. **Edit Documents**: Use the rich text editor to write and format your content
4. **Organize**: Drag and drop documents between categories (coming soon)

## Project Structure

```
src/
├── components/         # React components
│   ├── CategoryTree/   # Category management components
│   ├── Editor/         # Markdown editor components
│   └── common/         # Shared UI components
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
