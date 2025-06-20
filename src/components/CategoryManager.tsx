import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Tag, Palette, Check, X } from 'lucide-react';
import { useCategories } from '../contexts/CategoriesContext';
import { Category } from '../types/schemas';
import { CategoryId } from '../types/common';

interface CategoryManagerProps {
  onCategorySelect?: (categoryId: CategoryId) => void;
  selectedCategoryId?: CategoryId | null;
  showCreateForm?: boolean;
  compact?: boolean;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  onCategorySelect,
  selectedCategoryId,
  showCreateForm = true,
  compact = false,
}) => {
  const { categories, addCategory, updateCategory, removeCategory, isLoading, error } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6B7280',
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#6B7280' });
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name as any,
          description: formData.description,
          color: formData.color,
        });
      } else {
        await addCategory(formData.name, formData.description, formData.color);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    if (category.isDefault) return; // Ne pas permettre d'éditer les catégories par défaut
    
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: CategoryId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await removeCategory(categoryId);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const predefinedColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E', '#6B7280', '#374151', '#1F2937'
  ];

  if (compact) {
    return (
      <div className="space-y-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect?.(category.id)}
            className={`flex items-center w-full p-2 rounded-lg text-left transition-colors ${
              selectedCategoryId === category.id
                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div
              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm font-medium truncate">{category.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="p-5 lg:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Tag className="mr-2" size={20} />
            Catégories
          </h2>
          {showCreateForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              disabled={isLoading}
            >
              <Plus size={16} className="mr-1" />
              Nouvelle
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 mx-5 mt-4 rounded">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Formulaire de création/édition */}
      {showForm && (
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom de la catégorie
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ex: Gaming, Musique..."
                required
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optionnelle)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={2}
                placeholder="Description de la catégorie..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Palette size={16} className="inline mr-1" />
                Couleur
              </label>
              <div className="grid grid-cols-10 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      formData.color === color
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {formData.color === color && (
                      <Check size={14} className="text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Check size={16} className="mr-1" />
                {editingCategory ? 'Modifier' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                <X size={16} className="mr-1" />
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des catégories */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`p-4 lg:p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
              selectedCategoryId === category.id ? 'bg-red-50 dark:bg-red-900/20' : ''
            }`}
          >
            <div 
              className="flex items-center flex-1 cursor-pointer"
              onClick={() => onCategorySelect?.(category.id)}
            >
              <div
                className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {category.description}
                  </p>
                )}
                {category.isDefault && (
                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                    Par défaut
                  </span>
                )}
              </div>
            </div>

            {!category.isDefault && (
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Modifier"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && !isLoading && (
        <div className="p-8 text-center">
          <Tag size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-3">
            Aucune catégorie
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Les catégories par défaut seront créées automatiquement
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryManager; 