import { useState, useEffect } from 'react';
import { generateId, saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from '../utils/helpers';
import * as api from '../services/api';
import type { Library } from '../services/api';

export const useLibraries = () => {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [currentLibraryId, setCurrentLibraryId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch libraries from API on initial render
  useEffect(() => {
    const fetchLibraries = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to fetch libraries from API
        const apiLibraries = await api.getLibraries();
        setLibraries(apiLibraries);
        
        // If libraries were fetched successfully, set the first one as current if none is selected
        if (apiLibraries.length > 0) {
          setCurrentLibraryId(prev => prev || apiLibraries[0].id);
        }
        // No automatic default library creation
      } catch (err) {
        console.error('Failed to fetch libraries:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch libraries');
        
        // Fallback to local storage if API fails
        const storedLibraries = loadFromLocalStorage<Library[]>(STORAGE_KEYS.LIBRARIES, []);
        setLibraries(storedLibraries);
        
        if (storedLibraries.length > 0) {
          setCurrentLibraryId(prev => prev || storedLibraries[0].id);
        }
        // No automatic default library creation
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLibraries();
  }, []);

  // Save libraries to local storage whenever they change
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.LIBRARIES, libraries);
  }, [libraries]);

  // Create a new library
  const createLibrary = async (name: string, path: string = ''): Promise<Library> => {
    try {
      // Call the API to create the library
      const response = await api.createLibrary(name, path);
      
      // Create a library object with the response data
      const newLibrary: Library = {
        id: generateId(),
        name,
        path: response.path || path, // Use the path returned from the API if available
        createdAt: new Date(),
      };

      setLibraries(prevLibraries => [...prevLibraries, newLibrary]);
      return newLibrary;
    } catch (error) {
      console.error('Failed to create library:', error);
      throw error;
    }
  };

  // Update an existing library
  const updateLibrary = (updatedLibrary: Library) => {
    setLibraries(prevLibraries =>
      prevLibraries.map(lib =>
        lib.id === updatedLibrary.id ? updatedLibrary : lib
      )
    );
  };

  // Delete a library
  const deleteLibrary = (libraryId: string) => {
    setLibraries(prevLibraries =>
      prevLibraries.filter(lib => lib.id !== libraryId)
    );

    // If the deleted library was the current one, select another one
    if (currentLibraryId === libraryId) {
      const remainingLibraries = libraries.filter(lib => lib.id !== libraryId);
      if (remainingLibraries.length > 0) {
        setCurrentLibraryId(remainingLibraries[0].id);
      } else {
        setCurrentLibraryId(null);
      }
    }
  };

  // Get a library by ID
  const getLibraryById = (libraryId: string): Library | undefined => {
    return libraries.find(lib => lib.id === libraryId);
  };

  return {
    libraries,
    currentLibraryId,
    setCurrentLibraryId,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    getLibraryById,
    isLoading,
    error,
  };
};
