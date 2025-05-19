/**
 * API service for interacting with the backend
 */

// Document interface matching the backend model
export interface Document {
  id: number;
  title: string;
  content: string;
  parent_id: number | null;
  children?: Document[];
}

/**
 * Create a new library
 * @param name Library name
 * @param basePath Base path for the library
 * @returns Promise with the API response
 */
export const createLibrary = async (name: string, basePath: string) => {
  try {
    const response = await fetch(`/api/library/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        base_path: basePath,
      }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create library: ${response.status} ${response.statusText}`);
      } catch (jsonError) {
        // If the response is not valid JSON
        throw new Error(`Failed to create library: ${response.status} ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating library:', error);
    throw error;
  }
};

/**
 * Get all libraries
 * @returns Promise with the list of libraries
 */
export const getLibraries = async () => {
  try {
    const response = await fetch(`/api/library/list`);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch libraries: ${response.status} ${response.statusText}`);
      } catch (jsonError) {
        // If the response is not valid JSON
        throw new Error(`Failed to fetch libraries: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    return data.libraries.map((lib: { name: string; path: string }) => ({
      id: lib.path, // Using path as ID since it's unique
      name: lib.name,
      path: lib.path,
      createdAt: new Date() // Since API doesn't provide creation date, use current date
    }));
  } catch (error) {
    console.error('Error fetching libraries:', error);
    throw error;
  }
};

/**
 * Get document tree for a library
 * @param libraryName Name of the library
 * @returns Promise with the document tree
 */
export const getDocumentTree = async (libraryName: string): Promise<Document[]> => {
  try {
    const response = await fetch(`/api/document/tree?library=${encodeURIComponent(libraryName)}`);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch document tree: ${response.status} ${response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to fetch document tree: ${response.status} ${response.statusText}`);
      }
    }

    const documents = await response.json();
    
    // Convert flat list to tree structure
    return buildDocumentTree(documents);
  } catch (error) {
    console.error('Error fetching document tree:', error);
    throw error;
  }
};

/**
 * Create a new document
 * @param libraryName Name of the library
 * @param title Document title
 * @param content Document content
 * @param parentId Parent document ID (null for root documents)
 * @returns Promise with the created document ID
 */
export const createDocument = async (
  libraryName: string,
  title: string,
  content: string = '',
  parentId: number | null = null
): Promise<number> => {
  try {
    const response = await fetch(`/api/document/create?library=${encodeURIComponent(libraryName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        parent_id: parentId,
      }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create document: ${response.status} ${response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to create document: ${response.status} ${response.statusText}`);
      }
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

/**
 * Update document parent
 * @param libraryName Name of the library
 * @param id Document ID
 * @param parentId New parent ID
 * @returns Promise with success message
 */
export const updateDocumentParent = async (
  libraryName: string,
  id: number,
  parentId: number | null
): Promise<void> => {
  try {
    const response = await fetch(`/api/document/update-parent?library=${encodeURIComponent(libraryName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        parent_id: parentId,
      }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update document parent: ${response.status} ${response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to update document parent: ${response.status} ${response.statusText}`);
      }
    }

    await response.json();
  } catch (error) {
    console.error('Error updating document parent:', error);
    throw error;
  }
};

/**
 * Update a document's title or content
 * @param libraryName Name of the library
 * @param id Document ID
 * @param title New title (optional)
 * @param content New content (optional)
 * @returns Promise with the updated document
 */
/**
 * Fetch a document by its ID
 * @param libraryName Name of the library
 * @param id Document ID
 * @returns Promise with the document information
 */
/**
 * Upload an image for a specific document
 * @param libraryName Name of the library
 * @param documentId Document ID
 * @param file File to upload
 * @returns Promise with the upload response
 */
export const uploadImage = async (libraryName: string, documentId: number, file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`/api/upload/${documentId}?library=${encodeURIComponent(libraryName)}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to upload image: ${response.status} ${response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`);
      }
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const getDocument = async (libraryName: string, id: number) => {
  try {
    const response = await fetch(`/api/document?library=${encodeURIComponent(libraryName)}&id=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch document: ${response.status} ${response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }
    }
    
    const document = await response.json();
    return document;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

export const updateDocument = async (
  libraryName: string,
  id: number,
  title?: string,
  content?: string
) => {
  try {
    const updateData: { id: number; title?: string; content?: string } = { id };
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    
    const response = await fetch(`/api/document/update?library=${encodeURIComponent(libraryName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update document: ${response.status} ${response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to update document: ${response.status} ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

/**
 * Helper function to build a document tree from a flat list
 * @param documents Flat list of documents
 * @returns Tree structure of documents
 */
function buildDocumentTree(documents: Document[]): Document[] {
  const documentMap = new Map<number, Document>();
  const rootDocuments: Document[] = [];

  // First pass: create a map of all documents
  documents.forEach(doc => {
    documentMap.set(doc.id, { ...doc, children: [] });
  });

  // Second pass: build the tree structure
  documents.forEach(doc => {
    const document = documentMap.get(doc.id)!;
    
    if (doc.parent_id === null) {
      // Root document
      rootDocuments.push(document);
    } else {
      // Child document
      const parent = documentMap.get(doc.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(document);
      } else {
        // Parent not found, treat as root
        rootDocuments.push(document);
      }
    }
  });

  return rootDocuments;
}
