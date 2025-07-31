import { useState, useCallback, useEffect } from 'react';
import { Ingredient } from '@/types/ingredient';
import { useToast } from '@/hooks/use-toast';
import { ingredientApi } from '@/services/ingredientApi';

export const useIngredients = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const { toast } = useToast();

  // Load ingredients on mount
  useEffect(() => {
    const loadIngredients = async () => {
      try {
        setIsLoading(true);
        const data = await ingredientApi.getAllIngredients();
        setIngredients(data);
      } catch (error) {
        // Fallback to empty array if API fails
        setIngredients([]);
        toast({
          title: "Connection issue",
          description: "Using offline mode. Some features may be limited.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadIngredients();
  }, [toast]);

  const addIngredient = useCallback(async (ingredientData: { name: string; quantity: number; unit: string; notes?: string }) => {
    setIsLoading(true);
    try {
      const newIngredient = await ingredientApi.createIngredient(ingredientData);
      setIngredients(prev => [...prev, newIngredient]);
      
      toast({
        title: "Ingredient added",
        description: `${ingredientData.name} has been added successfully.`,
      });
    } catch (error) {
      // Fallback to mock creation if API fails
      const mockTags = ['organic', 'gluten-free'];
      const mockAllergens = ['gluten'];
      
      const newIngredient: Ingredient = {
        ...ingredientData,
        id: crypto.randomUUID(),
        order: ingredients.length,
        tags: mockTags,
        allergens: mockAllergens,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setIngredients(prev => [...prev, newIngredient]);
      toast({
        title: "Ingredient added (offline)",
        description: `${ingredientData.name} has been added locally.`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [ingredients.length, toast]);

  const updateIngredient = useCallback(async (id: string, updates: Partial<Ingredient>) => {
    setIsLoading(true);
    try {
      await ingredientApi.updateIngredient(id, updates);
      setIngredients(prev => prev.map(ingredient => 
        ingredient.id === id 
          ? { ...ingredient, ...updates, updatedAt: new Date() }
          : ingredient
      ));
      toast({
        title: "Ingredient updated",
        description: "Changes have been saved successfully.",
      });
    } catch (error) {
      // Fallback to local update if API fails
      setIngredients(prev => prev.map(ingredient => 
        ingredient.id === id 
          ? { ...ingredient, ...updates, updatedAt: new Date() }
          : ingredient
      ));
      toast({
        title: "Ingredient updated (offline)",
        description: "Changes saved locally.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteIngredient = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await ingredientApi.deleteIngredient(id);
      setIngredients(prev => prev.filter(ingredient => ingredient.id !== id));
      toast({
        title: "Ingredient deleted",
        description: "Ingredient has been removed successfully.",
      });
    } catch (error) {
      // Fallback to local deletion if API fails
      setIngredients(prev => prev.filter(ingredient => ingredient.id !== id));
      toast({
        title: "Ingredient deleted (offline)",
        description: "Ingredient removed locally.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const reorderIngredients = useCallback(async (reorderedIngredients: Ingredient[]) => {
    const ingredientsWithNewOrder = reorderedIngredients.map((ingredient, index) => ({
      ...ingredient,
      order: index,
      updatedAt: new Date(),
    }));
    
    setIngredients(ingredientsWithNewOrder);
    
    try {
      await ingredientApi.reorderIngredients({
        ingredientIds: ingredientsWithNewOrder.map(ing => ing.id)
      });
    } catch (error) {
      // Silently fail for reordering - local state is updated
      console.warn('Failed to sync ingredient order with server');
    }
  }, []);

  const openNotesModal = useCallback((ingredientId: string) => {
    setSelectedIngredient(ingredientId);
    setShowNotesModal(true);
  }, []);

  const closeNotesModal = useCallback(() => {
    setShowNotesModal(false);
    setSelectedIngredient(null);
  }, []);

  const startEditing = useCallback((ingredientId: string) => {
    setEditingItem(ingredientId);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingItem(null);
  }, []);



  return {
    ingredients,
    isLoading,
    draggedItem,
    editingItem,
    showNotesModal,
    selectedIngredient,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    reorderIngredients,
    openNotesModal,
    closeNotesModal,
    startEditing,
    stopEditing,

    setDraggedItem,
  };
};