import { AddedIngredient } from '@/utils/nutritionCalculations';
import { ProgressiveRecipeApi, ProgressiveRecipeData } from '@/services/progressiveRecipeApi';
import { useToast } from '@/hooks/use-toast';

/**
 * Save ingredients to backend with live sync
 */
export const saveIngredientsToBackend = async (
  ingredients: AddedIngredient[],
  currentRecipe: ProgressiveRecipeData | null,
  setRecipeProgress: (progress: any) => void,
  toast: ReturnType<typeof useToast>['toast']
) => {
  if (!currentRecipe?.id) {
    console.warn('⚠️ No current recipe ID, skipping ingredient save');
    return;
  }
  
  // Handle empty ingredients array - clear database data
  if (ingredients.length === 0) {
    console.log('🔄 All ingredients removed, clearing database data...');
    await clearAllIngredientsFromBackend(currentRecipe, setRecipeProgress, toast);
    return;
  }
  
  try {
    // Transform ingredients to processed display data format (not raw API data)
    const processedIngredients = ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      waste_percentage: ing.waste,
      grams: ing.grams,
      available_measures: ing.availableMeasures,
      allergens: ing.allergens,
      // Include processed nutrition data if available
      nutrition_proportion: ing.nutritionProportion || null
    }));
    
    console.log('🔄 Live sync: Saving processed ingredient data to backend:', {
      recipeId: currentRecipe.id,
      ingredientCount: processedIngredients.length,
      processedData: processedIngredients
    });
    
    const response = await ProgressiveRecipeApi.addIngredients(currentRecipe.id, processedIngredients);
    
    console.log('📡 Live sync API response:', response);
    
    // Check if response has success property (wrapped format) or expected data structure (unwrapped format)
    const isSuccess = response?.success === true ||
                     (response && (response.product || response.total_weight !== undefined || response.ingredients_count !== undefined));
    
    if (isSuccess) {
      console.log('✅ Live sync: Processed ingredients saved successfully');
      
      // Update progress in real-time
      try {
        const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
        if (progressResponse?.success) {
          console.log('📊 Live progress update:', progressResponse.data.progress);
          setRecipeProgress(progressResponse.data.progress);
        }
      } catch (progressError) {
        console.error('❌ Live sync progress error:', progressError);
      }
    } else {
      console.error('❌ Live sync failed:', response);
      toast({
        title: "Sync Error",
        description: 'Live sync failed: ' + (response?.message || 'Unknown error'),
        variant: "destructive"
      });
    }
  } catch (error: any) {
    console.error('❌ Live sync error:', error);
    toast({
      title: "Sync Error",
      description: 'Live sync error: ' + (error.message || 'Network error'),
      variant: "destructive"
    });
  }
};

/**
 * Clear all ingredients and nutrition data from backend
 */
export const clearAllIngredientsFromBackend = async (
  currentRecipe: ProgressiveRecipeData | null,
  setRecipeProgress: (progress: any) => void,
  toast: ReturnType<typeof useToast>['toast']
) => {
  if (!currentRecipe?.id) {
    console.warn('⚠️ No current recipe ID, skipping clear operation');
    return;
  }

  try {
    console.log('🔄 Clearing all ingredients and nutrition data from backend...');
    
    // Use the new API method to clear all ingredients and nutrition data
    const response = await ProgressiveRecipeApi.clearAllIngredients(currentRecipe.id);
    
    if (response.success) {
      console.log('✅ Successfully cleared all ingredients and nutrition data from backend');
      
      // Update progress in real-time
      try {
        const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
        if (progressResponse.success) {
          console.log('📊 Progress updated after clearing data:', progressResponse.data.progress);
          setRecipeProgress(progressResponse.data.progress);
        }
      } catch (progressError) {
        console.error('❌ Error updating progress after clear:', progressError);
      }
      
      toast({
        title: "✅ Ingredients Cleared",
        description: "All ingredients and nutrition data have been removed from the database.",
      });
    } else {
      console.error('❌ Failed to clear backend data:', response);
      toast({
        title: "Clear Error",
        description: 'Failed to clear ingredients from database: ' + (response.message || 'Unknown error'),
        variant: "destructive"
      });
    }
  } catch (error: any) {
    console.error('❌ Error clearing backend data:', error);
    toast({
      title: "Clear Error",
      description: 'Failed to clear ingredients from database: ' + (error.message || 'Network error'),
      variant: "destructive"
    });
  }
};