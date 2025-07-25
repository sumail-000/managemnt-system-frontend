import { useState, useEffect, useCallback } from 'react';
import { Category, CategoryFormData, CategoryResponse, CategoriesResponse } from '@/types/category';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

// Categories API service
const categoriesAPI = {
  // Get user's categories
  getAll: () => {
    console.log('[CATEGORIES_API] Get all categories request initiated');
    return api.get('/categories');
  },
  
  // Create new category
  create: (categoryData: CategoryFormData) => {
    console.log('[CATEGORIES_API] Create category request initiated', categoryData);
    return api.post('/categories', categoryData);
  },
  
  // Update category
  update: (id: string, categoryData: CategoryFormData) => {
    console.log('[CATEGORIES_API] Update category request initiated', { id, ...categoryData });
    return api.put(`/categories/${id}`, categoryData);
  },
  
  // Delete category
  delete: (id: string) => {
    console.log('[CATEGORIES_API] Delete category request initiated', { id });
    return api.delete(`/categories/${id}`);
  },
  
  // Search categories
  search: (query: string) => {
    console.log('[CATEGORIES_API] Search categories request initiated', { query });
    return api.get('/categories/search', { params: { query } });
  },

};

export interface UseCategoriesOptions {
  autoLoad?: boolean;
}

export interface UseCategoriesReturn {
  // Data
  categories: Category[];
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  searching: boolean;
  
  // Actions
  loadCategories: () => Promise<void>;
  searchCategories: (query: string) => Promise<void>;
  createCategory: (categoryData: CategoryFormData) => Promise<Category | null>;
  updateCategory: (id: string, categoryData: CategoryFormData) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  refresh: () => void;
  
  // Computed
  isEmpty: boolean;
  categoryNames: string[];
}

/**
 * Hook for managing user categories
 */
export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesReturn {
  const { autoLoad = true } = options;
  const { toast } = useToast();
  
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searching, setSearching] = useState(false);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      console.log('[useCategories] Categories API response:', response);
      
      if (response) {
        // Handle different response formats
        let categoriesData: Category[] = [];
        
        if (Array.isArray(response)) {
          categoriesData = response;
        } else if (response.data && Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data)) {
          categoriesData = response.data.data;
        }
        
        setCategories(categoriesData);
        console.log('[useCategories] Categories loaded:', categoriesData);
      }
    } catch (error) {
      console.error('[useCategories] Failed to load categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Search categories
  const searchCategories = useCallback(async (query: string) => {
    try {
      setSearching(true);
      const response = await categoriesAPI.search(query);
      console.log('[useCategories] Search categories API response:', response);
      
      if (response) {
        // Handle different response formats
        let categoriesData: Category[] = [];
        
        if (Array.isArray(response)) {
          categoriesData = response;
        } else if (response.data && Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data)) {
          categoriesData = response.data.data;
        }
        
        setCategories(categoriesData);
        console.log('[useCategories] Search results loaded:', categoriesData);
      }
    } catch (error) {
      console.error('[useCategories] Failed to search categories:', error);
      toast({
        title: "Error",
        description: "Failed to search categories. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  }, [toast]);

  // Create category
  const createCategory = useCallback(async (categoryData: CategoryFormData): Promise<Category | null> => {
    try {
      setCreating(true);
      const response = await categoriesAPI.create(categoryData);
      console.log('[useCategories] Create category response:', response);
      
      let newCategory: Category | null = null;
      
      if (response) {
        // Handle different response formats
        if (response.data && response.data.data) {
          newCategory = response.data.data;
        } else if (response.data && response.data.id) {
          newCategory = response.data;
        }
        
        if (newCategory) {
          setCategories(prev => [...prev, newCategory!]);
          toast({
            title: "Success",
            description: `Category "${newCategory.name}" created successfully`,
          });
        }
      }
      
      return newCategory;
    } catch (error: any) {
      console.error('[useCategories] Failed to create category:', error);
      
      // Handle validation errors
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.name?.[0] ||
                          "Failed to create category. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setCreating(false);
    }
  }, [toast]);

  // Update category
  const updateCategory = useCallback(async (id: string, categoryData: CategoryFormData): Promise<Category | null> => {
    try {
      setUpdating(true);
      const response = await categoriesAPI.update(id, categoryData);
      console.log('[useCategories] Update category response:', response);
      
      let updatedCategory: Category | null = null;
      
      if (response) {
        // Handle different response formats
        if (response.data && response.data.data) {
          updatedCategory = response.data.data;
        } else if (response.data && response.data.id) {
          updatedCategory = response.data;
        }
        
        if (updatedCategory) {
          setCategories(prev => 
            prev.map(cat => cat.id === id ? updatedCategory! : cat)
          );
          toast({
            title: "Success",
            description: `Category "${updatedCategory.name}" updated successfully`,
          });
        }
      }
      
      return updatedCategory;
    } catch (error: any) {
      console.error('[useCategories] Failed to update category:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.name?.[0] ||
                          "Failed to update category. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setUpdating(false);
    }
  }, [toast]);

  // Delete category
  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);
      await categoriesAPI.delete(id);
      console.log('[useCategories] Category deleted:', id);
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      
      return true;
    } catch (error: any) {
      console.error('[useCategories] Failed to delete category:', error);
      
      const errorMessage = error.response?.data?.message || 
                          "Failed to delete category. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setDeleting(false);
    }
  }, [toast]);

  // Refresh categories
  const refresh = useCallback(() => {
    loadCategories();
  }, [loadCategories]);

  // Computed values
  const isEmpty = categories.length === 0 && !loading;
  const categoryNames = categories.map(cat => cat.name);

  // Effects
  useEffect(() => {
    if (autoLoad) {
      loadCategories();
    }
  }, [autoLoad, loadCategories]);

  return {
    // Data
    categories,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    searching,
    
    // Actions
    loadCategories,
    searchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh,
    
    // Computed
    isEmpty,
    categoryNames
  };
}