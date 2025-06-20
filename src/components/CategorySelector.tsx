import React, { useState } from 'react';
import { ChevronDown, Tag, Check } from 'lucide-react';
import { useCategories } from '../contexts/CategoriesContext';
import { CategoryId } from '../types/common';

interface CategorySelectorProps {
  selectedCategoryId?: CategoryId | null;
  onCategorySelect: (categoryId: CategoryId | null) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryId,
  onCategorySelect,
  placeholder = "Sélectionner une catégorie",
  required = false,
  className = "",
}) => {
  const { categories, getCategoryById } = useCategories();
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategory = selectedCategoryId ? getCategoryById(selectedCategoryId) : null;

  const handleSelect = (categoryId: CategoryId | null) => {
    onCategorySelect(categoryId);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest('.category-selector')) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative category-selector ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-left transition-colors ${
          isOpen
            ? 'border-red-500 ring-2 ring-red-500 ring-opacity-20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <div className="flex items-center flex-1 min-w-0">
          {selectedCategory ? (
            <>
              <div
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: selectedCategory.color }}
              />
              <span className="text-gray-900 dark:text-white truncate">
                {selectedCategory.name}
              </span>
            </>
          ) : (
            <>
              <Tag size={16} className="text-gray-400 mr-2 flex-shrink-0" />
              <span className="text-gray-500 dark:text-gray-400 truncate">
                {placeholder}
              </span>
            </>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {/* Option "Aucune catégorie" */}
          {!required && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                !selectedCategoryId ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0 border border-gray-300 dark:border-gray-600" />
              <span className="flex-1">Aucune catégorie</span>
              {!selectedCategoryId && (
                <Check size={16} className="text-red-600 dark:text-red-400" />
              )}
            </button>
          )}

          {/* Séparateur si option "Aucune catégorie" présente */}
          {!required && categories.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-600" />
          )}

          {/* Liste des catégories */}
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleSelect(category.id)}
              className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                selectedCategoryId === category.id 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="truncate">{category.name}</div>
                {category.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {category.description}
                  </div>
                )}
              </div>
              {selectedCategoryId === category.id && (
                <Check size={16} className="text-red-600 dark:text-red-400 ml-2 flex-shrink-0" />
              )}
            </button>
          ))}

          {categories.length === 0 && (
            <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
              <Tag size={20} className="mx-auto mb-2" />
              <p className="text-sm">Aucune catégorie disponible</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelector; 