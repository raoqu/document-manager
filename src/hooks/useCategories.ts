import { useState, useEffect } from 'react';
import type { Category } from '../types';
import { generateId, saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from '../utils/helpers';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories from local storage on initial render
  useEffect(() => {
    const storedCategories = loadFromLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    setCategories(storedCategories);
  }, []);

  // Save categories to local storage whenever they change
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  // Add a new category
  const addCategory = (name: string, parentId: string | null) => {
    const newCategory: Category = {
      id: generateId(),
      name,
      parentId,
      children: [],
    };

    setCategories(prevCategories => {
      // If it's a root category
      if (!parentId) {
        return [...prevCategories, newCategory];
      }

      // If it's a child category, we need to update the parent's children
      const updatedCategories = [...prevCategories];
      
      // Helper function to recursively update categories
      const updateCategoryChildren = (categories: Category[]): Category[] => {
        return categories.map(category => {
          if (category.id === parentId) {
            return {
              ...category,
              children: [...category.children, newCategory],
            };
          }
          
          if (category.children.length > 0) {
            return {
              ...category,
              children: updateCategoryChildren(category.children),
            };
          }
          
          return category;
        });
      };

      return updateCategoryChildren(updatedCategories);
    });

    return newCategory.id;
  };

  // Delete a category
  const deleteCategory = (categoryId: string) => {
    setCategories(prevCategories => {
      // Helper function to recursively filter out the category and its children
      const filterCategories = (categories: Category[]): Category[] => {
        return categories
          .filter(category => category.id !== categoryId)
          .map(category => ({
            ...category,
            children: filterCategories(category.children),
          }));
      };

      return filterCategories(prevCategories);
    });
  };

  // Get a flat list of all categories (for easier lookup)
  const getAllCategoriesFlat = (): Category[] => {
    const flatCategories: Category[] = [];
    
    const flattenCategories = (categories: Category[]) => {
      categories.forEach(category => {
        flatCategories.push(category);
        if (category.children.length > 0) {
          flattenCategories(category.children);
        }
      });
    };
    
    flattenCategories(categories);
    return flatCategories;
  };

  // Get a category by ID
  const getCategoryById = (categoryId: string): Category | undefined => {
    return getAllCategoriesFlat().find(category => category.id === categoryId);
  };

  return {
    categories,
    addCategory,
    deleteCategory,
    getAllCategoriesFlat,
    getCategoryById,
  };
};
