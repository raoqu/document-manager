import React, { useState } from 'react';
import type { Category } from '../../types';

interface CategoryTreeProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: (name: string, parentId: string | null) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const CategoryItem: React.FC<{
  category: Category;
  level: number;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory: (name: string, parentId: string | null) => void;
  onDeleteCategory: (categoryId: string) => void;
}> = ({ 
  category, 
  level, 
  selectedCategoryId, 
  onSelectCategory, 
  onAddCategory, 
  onDeleteCategory 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim(), category.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  return (
    <div className="category-item" style={{ marginLeft: `${level * 16}px` }}>
      <div className="category-header">
        {category.children.length > 0 && (
          <button 
            className="toggle-button" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼' : '►'}
          </button>
        )}
        <div 
          className={`category-name ${selectedCategoryId === category.id ? 'selected' : ''}`}
          onClick={() => onSelectCategory(category.id)}
        >
          {category.name}
        </div>
        <div className="category-actions">
          <button onClick={() => setIsAddingCategory(true)}>+</button>
          <button onClick={() => onDeleteCategory(category.id)}>×</button>
        </div>
      </div>
      
      {isAddingCategory && (
        <div className="add-category-form">
          <input 
            type="text" 
            value={newCategoryName} 
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
          />
          <button onClick={handleAddCategory}>Add</button>
          <button onClick={() => setIsAddingCategory(false)}>Cancel</button>
        </div>
      )}
      
      {isExpanded && category.children.map(child => (
        <CategoryItem 
          key={child.id}
          category={child}
          level={level + 1}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={onSelectCategory}
          onAddCategory={onAddCategory}
          onDeleteCategory={onDeleteCategory}
        />
      ))}
    </div>
  );
};

const CategoryTree: React.FC<CategoryTreeProps> = ({ 
  categories, 
  selectedCategoryId, 
  onSelectCategory, 
  onAddCategory, 
  onDeleteCategory 
}) => {
  const [isAddingRootCategory, setIsAddingRootCategory] = useState(false);
  const [newRootCategoryName, setNewRootCategoryName] = useState('');

  const handleAddRootCategory = () => {
    if (newRootCategoryName.trim()) {
      onAddCategory(newRootCategoryName.trim(), null);
      setNewRootCategoryName('');
      setIsAddingRootCategory(false);
    }
  };

  return (
    <div className="category-tree">
      <div className="category-tree-header">
        <h3>Categories</h3>
        <button onClick={() => setIsAddingRootCategory(true)}>Add Root Category</button>
      </div>
      
      {isAddingRootCategory && (
        <div className="add-category-form">
          <input 
            type="text" 
            value={newRootCategoryName} 
            onChange={(e) => setNewRootCategoryName(e.target.value)}
            placeholder="New root category name"
          />
          <button onClick={handleAddRootCategory}>Add</button>
          <button onClick={() => setIsAddingRootCategory(false)}>Cancel</button>
        </div>
      )}
      
      <div className="category-list">
        {categories.map(category => (
          <CategoryItem 
            key={category.id}
            category={category}
            level={0}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
            onAddCategory={onAddCategory}
            onDeleteCategory={onDeleteCategory}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryTree;
