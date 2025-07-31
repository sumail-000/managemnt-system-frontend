// Serving calculation utilities
// This file contains helper functions for calculating serving-related information

import { NutritionData } from '@/types/nutrition';
import { Recipe } from '@/types/recipe';

// Interface for serving information calculations
export interface ServingCalculations {
  caloriesPerServing: number;
  weightPerServing: number;
  servingsCount: number;
  totalCalories: number;
  totalWeight: number;
  portionSize: string;
  servingType: string;
}

// Interface for serving breakdown display
export interface ServingBreakdown {
  perServing: {
    calories: number;
    weight: number;
    weightUnit: string;
  };
  total: {
    calories: number;
    weight: number;
    weightUnit: string;
    servings: number;
  };
  display: {
    servingSize: string;
    servingsPerContainer: number;
    caloriesPerServing: string;
    weightPerServing: string;
  };
}

// Calculate serving information from various data sources
export const calculateServingInfo = (
  formData?: {
    calories_per_serving?: number;
    total_servings?: number;
    portion_size?: string;
    serving_type?: string;
  },
  selectedRecipe?: Recipe,
  nutritionData?: NutritionData
): ServingCalculations => {
  // Priority: Form data > Recipe data > Nutrition data > Defaults
  
  const servingsCount = 
    formData?.total_servings ||
    selectedRecipe?.servingInfo?.servings ||
    nutritionData?.servings ||
    1;

  const totalCalories = 
    nutritionData?.calories ||
    selectedRecipe?.calories ||
    (formData?.calories_per_serving ? formData.calories_per_serving * servingsCount : 0);

  const totalWeight = 
    nutritionData?.totalWeight ||
    0;

  const caloriesPerServing = 
    formData?.calories_per_serving ||
    selectedRecipe?.servingInfo?.caloriesPerServing ||
    (nutritionData?.calories && nutritionData?.servings 
      ? Math.round(nutritionData.calories / nutritionData.servings)
      : Math.round(totalCalories / servingsCount));

  const weightPerServing = 
    nutritionData?.weightPerServing ||
    (totalWeight > 0 ? Math.round(totalWeight / servingsCount) : 0);

  const portionSize = 
    formData?.portion_size ||
    selectedRecipe?.servingInfo?.portionSize ||
    'medium';

  const servingType = 
    formData?.serving_type ||
    selectedRecipe?.servingInfo?.servingType ||
    'main';

  return {
    caloriesPerServing,
    weightPerServing,
    servingsCount,
    totalCalories,
    totalWeight,
    portionSize,
    servingType
  };
};

// Generate serving breakdown for display
export const generateServingBreakdown = (
  servingInfo: ServingCalculations
): ServingBreakdown => {
  return {
    perServing: {
      calories: servingInfo.caloriesPerServing,
      weight: servingInfo.weightPerServing,
      weightUnit: 'g'
    },
    total: {
      calories: servingInfo.totalCalories,
      weight: servingInfo.totalWeight,
      weightUnit: 'g',
      servings: servingInfo.servingsCount
    },
    display: {
      servingSize: `1 portion (${servingInfo.portionSize})`,
      servingsPerContainer: servingInfo.servingsCount,
      caloriesPerServing: `${servingInfo.caloriesPerServing} kcal`,
      weightPerServing: servingInfo.weightPerServing > 0 
        ? `${servingInfo.weightPerServing}g` 
        : 'N/A'
    }
  };
};

// Format weight for display with appropriate units
export const formatWeight = (weightInGrams: number): string => {
  if (weightInGrams === 0) return 'N/A';
  
  if (weightInGrams >= 1000) {
    const kg = (weightInGrams / 1000).toFixed(1);
    return `${kg}kg`;
  }
  
  return `${Math.round(weightInGrams)}g`;
};

// Calculate weight breakdown by macronutrients (if available)
export const calculateWeightBreakdown = (
  nutritionData: NutritionData,
  servingsCount: number
): {
  perServing: Record<string, { weight: number; percentage: number }>;
  total: Record<string, { weight: number; percentage: number }>;
} | null => {
  if (!nutritionData.totalNutrients || !nutritionData.totalWeight) {
    return null;
  }

  const macronutrients = {
    protein: nutritionData.totalNutrients.PROCNT,
    carbs: nutritionData.totalNutrients.CHOCDF,
    fat: nutritionData.totalNutrients.FAT,
    fiber: nutritionData.totalNutrients.FIBTG
  };

  const totalMacroWeight = Object.values(macronutrients)
    .filter(nutrient => nutrient)
    .reduce((sum, nutrient) => sum + (nutrient?.quantity || 0), 0);

  const breakdown: Record<string, { weight: number; percentage: number }> = {};
  
  Object.entries(macronutrients).forEach(([key, nutrient]) => {
    if (nutrient) {
      breakdown[key] = {
        weight: nutrient.quantity,
        percentage: totalMacroWeight > 0 ? (nutrient.quantity / totalMacroWeight) * 100 : 0
      };
    }
  });

  // Calculate per serving breakdown
  const perServingBreakdown: Record<string, { weight: number; percentage: number }> = {};
  Object.entries(breakdown).forEach(([key, data]) => {
    perServingBreakdown[key] = {
      weight: data.weight / servingsCount,
      percentage: data.percentage
    };
  });

  return {
    perServing: perServingBreakdown,
    total: breakdown
  };
};

// Serving utilities object for easy import
export const servingUtils = {
  calculateServingInfo,
  generateServingBreakdown,
  formatWeight,
  calculateWeightBreakdown
};

export default servingUtils;