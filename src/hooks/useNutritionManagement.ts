import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ProgressiveRecipeApi, ProgressiveRecipeData } from '@/services/progressiveRecipeApi';
import {
  calculatePerServingNutrition,
  mapPerServingDataToFDAFormat,
  getEmptyFDANutritionData,
  getEmptyPerServingNutritionData,
  FDANutritionData,
  NutritionData,
  PerServingNutritionData
} from '@/utils/nutritionDataMapper';
import {
  AddedIngredient,
  calculateNutritionProportions,
  recalculateNutritionLocally,
  analyzeNutrition,
  calculateNutritionFromCustomIngredients
} from '@/utils/nutritionCalculations';

export interface UseNutritionManagementProps {
  currentRecipe: ProgressiveRecipeData | null;
  setRecipeProgress: (progress: any) => void;
  forceProgressUpdate: () => void;
}

export const useNutritionManagement = ({
  currentRecipe,
  setRecipeProgress,
  forceProgressUpdate
}: UseNutritionManagementProps) => {
  const { toast } = useToast();
  
  // Nutrition states
  const [nutritionData, setNutritionData] = useState<FDANutritionData | null>(null);
  const [rawNutritionData, setRawNutritionData] = useState<NutritionData | null>(null);
  const [perServingData, setPerServingData] = useState<PerServingNutritionData | null>(null);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);
  const [totalGramsAtLastAnalysis, setTotalGramsAtLastAnalysis] = useState<number>(0);

  // Initialize nutrition data with empty values when no real data is available
  const initializeEmptyNutrition = useCallback(() => {
    setNutritionData(getEmptyFDANutritionData());
    setRawNutritionData(null);
    setPerServingData(getEmptyPerServingNutritionData());
    setTotalGramsAtLastAnalysis(0);
  }, []);

  // Save nutrition data to backend
  const saveNutritionToBackend = useCallback(async (
    nutritionData: NutritionData,
    servingsPerContainer: number
  ) => {
    if (!currentRecipe?.id) {
      return;
    }
    
    try {
      // Transform nutrition data to processed display format
      const processedNutritionData = {
        // Basic nutrition info
        calories: nutritionData.calories,
        total_weight: nutritionData.totalWeight,
        yield: nutritionData.yield,
        servings_per_container: servingsPerContainer,
        
        // Processed macronutrients (display values)
        macronutrients: {
          total_fat: nutritionData.totalNutrients.FAT.quantity,
          saturated_fat: nutritionData.totalNutrients.FASAT.quantity,
          trans_fat: nutritionData.totalNutrients.FATRN.quantity,
          cholesterol: nutritionData.totalNutrients.CHOLE.quantity,
          sodium: nutritionData.totalNutrients.NA.quantity,
          total_carbohydrate: nutritionData.totalNutrients.CHOCDF.quantity,
          dietary_fiber: nutritionData.totalNutrients.FIBTG.quantity,
          total_sugars: nutritionData.totalNutrients.SUGAR.quantity,
          protein: nutritionData.totalNutrients.PROCNT.quantity
        },
        
        // Processed vitamins & minerals (display values)
        vitamins_minerals: {
          vitamin_d: nutritionData.totalNutrients.VITD.quantity,
          calcium: nutritionData.totalNutrients.CA.quantity,
          iron: nutritionData.totalNutrients.FE.quantity,
          potassium: nutritionData.totalNutrients.K.quantity,
          magnesium: nutritionData.totalNutrients.MG.quantity
        },
        
        // Processed daily values (display percentages)
        daily_values: {
          total_fat_dv: nutritionData.totalDaily.FAT.quantity,
          saturated_fat_dv: nutritionData.totalDaily.FASAT.quantity,
          cholesterol_dv: nutritionData.totalDaily.CHOLE.quantity,
          sodium_dv: nutritionData.totalDaily.NA.quantity,
          total_carbohydrate_dv: nutritionData.totalDaily.CHOCDF.quantity,
          dietary_fiber_dv: nutritionData.totalDaily.FIBTG.quantity,
          protein_dv: nutritionData.totalDaily.PROCNT.quantity,
          vitamin_d_dv: nutritionData.totalDaily.VITD.quantity,
          calcium_dv: nutritionData.totalDaily.CA.quantity,
          iron_dv: nutritionData.totalDaily.FE.quantity,
          potassium_dv: nutritionData.totalDaily.K.quantity
        },
        
        // Health labels as tags
        health_labels: nutritionData.healthLabels || [],
        
        // Per-serving processed data (what displays on label)
        per_serving_data: perServingData ? {
          serving_size: perServingData.servingSize,
          serving_size_grams: perServingData.servingSizeGrams,
          calories_per_serving: perServingData.calories,
          nutrients_per_serving: perServingData.nutrients,
          daily_values_per_serving: perServingData.dailyValues
        } : null
      };
      
      const response = await ProgressiveRecipeApi.saveNutritionData(
        currentRecipe.id,
        processedNutritionData,
        servingsPerContainer,
        perServingData
      );
      
      if (response.success) {
        // Update progress in real-time
        try {
          const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
          if (progressResponse.success) {
            setRecipeProgress(progressResponse.data.progress);
          }
        } catch (progressError) {
          console.error('Live sync nutrition progress error:', progressError);
        }
      } else {
        toast({
          title: "Sync Error",
          description: 'Live sync nutrition failed: ' + (response.message || 'Unknown error'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Sync Error",
        description: 'Live sync nutrition error: ' + (error.message || 'Network error'),
        variant: "destructive"
      });
    }
  }, [currentRecipe, perServingData, setRecipeProgress, toast]);

  // Analyze nutrition using real API
  const performNutritionAnalysis = useCallback(async (
    ingredients: AddedIngredient[],
    recipeName: string,
    setAddedIngredients: (ingredients: AddedIngredient[]) => void
  ) => {
    if (ingredients.length === 0) {
      setNutritionData(null);
      setRawNutritionData(null);
      setPerServingData(null);
      setNutritionError(null);
      return;
    }
    
    try {
      setIsLoadingNutrition(true);
      setNutritionError(null);
      
      const result = await analyzeNutrition(ingredients, recipeName);
      
      // Set raw nutrition data
      setRawNutritionData(result.nutritionData);
      
      // Calculate and store nutrition proportions for each ingredient
      const totalGrams = ingredients.reduce((sum, ing) => sum + ing.grams, 0);
      setTotalGramsAtLastAnalysis(totalGrams);
      
      setAddedIngredients(result.ingredientsWithProportions);
      
      // Set default servings and calculate per-serving nutrition
      const defaultServings = 1;
      
      // Calculate per-serving nutrition data
      const perServingNutrition = calculatePerServingNutrition(result.nutritionData, defaultServings);
      setPerServingData(perServingNutrition);
      
      // Map to FDA format for display
      const mappedData = mapPerServingDataToFDAFormat(perServingNutrition);
      setNutritionData(mappedData);
      
      // Save nutrition data to backend progressively
      if (currentRecipe?.id) {
        await saveNutritionToBackend(result.nutritionData, defaultServings);
      }
      
      // Return the allergen data from API response (this should replace any existing allergen data)
      return result.allergenData;
      
    } catch (error: any) {
      setNutritionError(error.message || 'Failed to analyze nutrition');
      // Fallback to empty nutrition data
      initializeEmptyNutrition();
      return null;
    } finally {
      setIsLoadingNutrition(false);
      
      // Force re-render of progress indicators after nutrition analysis
      forceProgressUpdate();
      setTimeout(() => {
        forceProgressUpdate();
      }, 100);
    }
  }, [currentRecipe, forceProgressUpdate, initializeEmptyNutrition, saveNutritionToBackend]);

  // Calculate nutrition from custom ingredients only
  const performCustomNutritionCalculation = useCallback(async (
    ingredients: AddedIngredient[]
  ) => {
    if (ingredients.length === 0) {
      initializeEmptyNutrition();
      return;
    }

    // Check if all ingredients are custom and have nutrition data
    const allCustomWithNutrition = ingredients.every(ing =>
      ing.id.startsWith('custom-') && ing.nutritionProportion
    );

    if (!allCustomWithNutrition) {
      throw new Error('Not all ingredients are custom or have nutrition data');
    }

    try {
      const customNutritionData = calculateNutritionFromCustomIngredients(ingredients);
      
      // Set the calculated nutrition data
      setRawNutritionData(customNutritionData);
      const totalGrams = ingredients.reduce((sum, ing) => sum + ing.grams, 0);
      setTotalGramsAtLastAnalysis(totalGrams);

      // Set default servings and calculate per-serving nutrition
      const defaultServings = 1;
      
      // Calculate per-serving nutrition data
      const perServingNutrition = calculatePerServingNutrition(customNutritionData, defaultServings);
      setPerServingData(perServingNutrition);
      
      // Map to FDA format for display
      const mappedData = mapPerServingDataToFDAFormat(perServingNutrition);
      setNutritionData(mappedData);
      
      // Force re-render of progress indicators after custom nutrition calculation
      forceProgressUpdate();
      
      // Save nutrition data to backend progressively
      if (currentRecipe?.id) {
        await saveNutritionToBackend(customNutritionData, defaultServings);
      }
      
    } catch (error: any) {
      setNutritionError('Failed to calculate nutrition from custom ingredients');
      initializeEmptyNutrition();
    }
  }, [currentRecipe, forceProgressUpdate, initializeEmptyNutrition, saveNutritionToBackend]);

  // Recalculate nutrition locally
  const performLocalNutritionRecalculation = useCallback((
    ingredients: AddedIngredient[],
    servingsPerContainer: number
  ) => {
    const recalculatedNutrition = recalculateNutritionLocally(ingredients, totalGramsAtLastAnalysis);
    if (recalculatedNutrition) {
      // Update nutrition data with locally recalculated values
      setRawNutritionData(recalculatedNutrition);
      
      // Recalculate per-serving nutrition
      const perServingNutrition = calculatePerServingNutrition(recalculatedNutrition, servingsPerContainer);
      setPerServingData(perServingNutrition);
      
      // Update FDA nutrition data
      const mappedData = mapPerServingDataToFDAFormat(perServingNutrition);
      setNutritionData(mappedData);
      
      // Clear any previous nutrition errors since we successfully recalculated
      setNutritionError(null);
      
      return true;
    }
    return false;
  }, [totalGramsAtLastAnalysis]);

  // Handle serving size changes
  const handleServingChange = useCallback((newServings: number) => {
    if (newServings <= 0 || !rawNutritionData) return;
    
    // Recalculate per-serving nutrition data with new serving count
    const updatedPerServingNutrition = calculatePerServingNutrition(rawNutritionData, newServings);
    setPerServingData(updatedPerServingNutrition);
    
    // Update FDA nutrition data with new per-serving values
    const mappedData = mapPerServingDataToFDAFormat(updatedPerServingNutrition);
    setNutritionData(mappedData);
  }, [rawNutritionData]);

  return {
    // States
    nutritionData,
    rawNutritionData,
    perServingData,
    isLoadingNutrition,
    nutritionError,
    totalGramsAtLastAnalysis,
    
    // Setters
    setNutritionData,
    setRawNutritionData,
    setPerServingData,
    setTotalGramsAtLastAnalysis,
    
    // Functions
    initializeEmptyNutrition,
    saveNutritionToBackend,
    performNutritionAnalysis,
    performCustomNutritionCalculation,
    performLocalNutritionRecalculation,
    handleServingChange
  };
};