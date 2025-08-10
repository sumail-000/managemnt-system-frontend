import { NutritionApi } from '@/services/nutritionApi';
import { ProgressiveRecipeApi } from '@/services/progressiveRecipeApi';
import {
  extractNutritionData,
  calculatePerServingNutrition,
  mapPerServingDataToFDAFormat,
  extractAllergenData,
  NutritionData,
  PerServingNutritionData,
  AllergenData
} from '@/utils/nutritionDataMapper';

export interface AddedIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  waste: number;
  grams: number;
  availableMeasures: Array<{
    uri: string;
    label: string;
    weight: number;
  }>;
  allergens: string[];
  nutritionProportion?: {
    calories: number;
    // Macronutrients
    totalFat: number;
    saturatedFat: number;
    transFat: number;
    monounsaturatedFat: number;
    polyunsaturatedFat: number;
    cholesterol: number;
    sodium: number;
    totalCarbohydrate: number;
    dietaryFiber: number;
    totalSugars: number;
    addedSugars: number;
    sugarAlcohol: number;
    protein: number;
    
    // Comprehensive Vitamins
    vitaminA?: number;
    vitaminC?: number;
    vitaminD: number;
    vitaminE?: number;
    vitaminK?: number;
    thiamin?: number;
    riboflavin?: number;
    niacin?: number;
    vitaminB6?: number;
    folate?: number;
    vitaminB12?: number;
    pantothenicAcid?: number;
    
    // Comprehensive Minerals
    calcium: number;
    iron: number;
    potassium: number;
    phosphorus?: number;
    magnesium?: number;
    zinc?: number;
    selenium?: number;
    copper?: number;
    manganese?: number;
    
    // Daily values (percentages)
    totalFatDV: number;
    saturatedFatDV: number;
    monounsaturatedFatDV: number;
    polyunsaturatedFatDV: number;
    cholesterolDV: number;
    sodiumDV: number;
    totalCarbohydrateDV: number;
    dietaryFiberDV: number;
    addedSugarsDV: number;
    sugarAlcoholDV: number;
    proteinDV: number;
    vitaminDDV: number;
    calciumDV: number;
    ironDV: number;
    potassiumDV: number;
  };
}

/**
 * Calculate nutrition proportions for each ingredient with comprehensive vitamins/minerals
 */
export const calculateNutritionProportions = (ingredients: AddedIngredient[], totalNutrition: NutritionData): AddedIngredient[] => {
  const totalGrams = ingredients.reduce((sum, ing) => sum + ing.grams, 0);
  if (totalGrams === 0) return ingredients;

  return ingredients.map(ingredient => {
    const proportion = ingredient.grams / totalGrams;
    return {
      ...ingredient,
      nutritionProportion: {
        calories: totalNutrition.calories * proportion,
        // Macronutrients
        totalFat: totalNutrition.totalNutrients.FAT.quantity * proportion,
        saturatedFat: totalNutrition.totalNutrients.FASAT.quantity * proportion,
        transFat: totalNutrition.totalNutrients.FATRN.quantity * proportion,
        monounsaturatedFat: (totalNutrition.totalNutrients.FAMS?.quantity || 0) * proportion,
        polyunsaturatedFat: (totalNutrition.totalNutrients.FAPU?.quantity || 0) * proportion,
        cholesterol: totalNutrition.totalNutrients.CHOLE.quantity * proportion,
        sodium: totalNutrition.totalNutrients.NA.quantity * proportion,
        totalCarbohydrate: totalNutrition.totalNutrients.CHOCDF.quantity * proportion,
        dietaryFiber: totalNutrition.totalNutrients.FIBTG.quantity * proportion,
        totalSugars: totalNutrition.totalNutrients.SUGAR.quantity * proportion,
        addedSugars: 0, // Not available in current structure
        sugarAlcohol: 0, // Not available in current structure
        protein: totalNutrition.totalNutrients.PROCNT.quantity * proportion,
        
        // Comprehensive Vitamins
        vitaminA: (totalNutrition.totalNutrients.VITA_RAE?.quantity || 0) * proportion,
        vitaminC: (totalNutrition.totalNutrients.VITC?.quantity || 0) * proportion,
        vitaminD: totalNutrition.totalNutrients.VITD.quantity * proportion,
        vitaminE: (totalNutrition.totalNutrients.TOCPHA?.quantity || 0) * proportion,
        vitaminK: (totalNutrition.totalNutrients.VITK1?.quantity || 0) * proportion,
        thiamin: (totalNutrition.totalNutrients.THIA?.quantity || 0) * proportion,
        riboflavin: (totalNutrition.totalNutrients.RIBF?.quantity || 0) * proportion,
        niacin: (totalNutrition.totalNutrients.NIA?.quantity || 0) * proportion,
        vitaminB6: (totalNutrition.totalNutrients.VITB6A?.quantity || 0) * proportion,
        folate: (totalNutrition.totalNutrients.FOLDFE?.quantity || 0) * proportion,
        vitaminB12: (totalNutrition.totalNutrients.VITB12?.quantity || 0) * proportion,
        pantothenicAcid: (totalNutrition.totalNutrients.PANTAC?.quantity || 0) * proportion,
        
        // Comprehensive Minerals
        calcium: totalNutrition.totalNutrients.CA.quantity * proportion,
        iron: totalNutrition.totalNutrients.FE.quantity * proportion,
        potassium: totalNutrition.totalNutrients.K.quantity * proportion,
        phosphorus: (totalNutrition.totalNutrients.P?.quantity || 0) * proportion,
        magnesium: totalNutrition.totalNutrients.MG.quantity * proportion,
        zinc: (totalNutrition.totalNutrients.ZN?.quantity || 0) * proportion,
        selenium: (totalNutrition.totalNutrients.SE?.quantity || 0) * proportion,
        copper: (totalNutrition.totalNutrients.CU?.quantity || 0) * proportion,
        manganese: (totalNutrition.totalNutrients.MN?.quantity || 0) * proportion,
        
        // Daily values (percentages)
        totalFatDV: totalNutrition.totalDaily.FAT.quantity * proportion,
        saturatedFatDV: totalNutrition.totalDaily.FASAT.quantity * proportion,
        monounsaturatedFatDV: 0, // No DV established for monounsaturated fats
        polyunsaturatedFatDV: 0, // No DV established for polyunsaturated fats
        cholesterolDV: totalNutrition.totalDaily.CHOLE.quantity * proportion,
        sodiumDV: totalNutrition.totalDaily.NA.quantity * proportion,
        totalCarbohydrateDV: totalNutrition.totalDaily.CHOCDF.quantity * proportion,
        dietaryFiberDV: totalNutrition.totalDaily.FIBTG.quantity * proportion,
        addedSugarsDV: 0, // Not available in current structure
        sugarAlcoholDV: 0, // No DV established for sugar alcohols
        proteinDV: totalNutrition.totalDaily.PROCNT.quantity * proportion,
        vitaminDDV: totalNutrition.totalDaily.VITD.quantity * proportion,
        calciumDV: totalNutrition.totalDaily.CA.quantity * proportion,
        ironDV: totalNutrition.totalDaily.FE.quantity * proportion,
        potassiumDV: totalNutrition.totalDaily.K.quantity * proportion
      }
    };
  });
};

/**
 * Recalculate nutrition locally based on current ingredient weights
 */
export const recalculateNutritionLocally = (ingredients: AddedIngredient[], totalGramsAtLastAnalysis: number): NutritionData | null => {
  // Check if we have nutrition proportions for all ingredients
  const hasAllProportions = ingredients.every(ing => ing.nutritionProportion);
  if (!hasAllProportions) {
    return null; // Cannot recalculate locally, need API call
  }

  const currentTotalGrams = ingredients.reduce((sum, ing) => sum + ing.grams, 0);
  if (currentTotalGrams === 0) {
    return null;
  }

  // Recalculate total nutrition by scaling each ingredient's proportion based on its current weight
  const recalculatedNutrition: NutritionData = {
    yield: 1,
    calories: 0,
    totalWeight: currentTotalGrams,
    totalNutrients: {
      // Macronutrients
      FAT: { label: 'Total lipid (fat)', quantity: 0, unit: 'g' },
      FASAT: { label: 'Fatty acids, total saturated', quantity: 0, unit: 'g' },
      FATRN: { label: 'Fatty acids, total trans', quantity: 0, unit: 'g' },
      FAMS: { label: 'Fatty acids, total monounsaturated', quantity: 0, unit: 'g' },
      FAPU: { label: 'Fatty acids, total polyunsaturated', quantity: 0, unit: 'g' },
      CHOCDF: { label: 'Carbohydrate, by difference', quantity: 0, unit: 'g' },
      FIBTG: { label: 'Fiber, total dietary', quantity: 0, unit: 'g' },
      SUGAR: { label: 'Sugars, total', quantity: 0, unit: 'g' },
      PROCNT: { label: 'Protein', quantity: 0, unit: 'g' },
      CHOLE: { label: 'Cholesterol', quantity: 0, unit: 'mg' },
      NA: { label: 'Sodium, Na', quantity: 0, unit: 'mg' },
      
      // Comprehensive Vitamins
      VITA_RAE: { label: 'Vitamin A, RAE', quantity: 0, unit: 'µg' },
      VITC: { label: 'Vitamin C, total ascorbic acid', quantity: 0, unit: 'mg' },
      VITD: { label: 'Vitamin D (D2 + D3)', quantity: 0, unit: 'µg' },
      TOCPHA: { label: 'Vitamin E (alpha-tocopherol)', quantity: 0, unit: 'mg' },
      VITK1: { label: 'Vitamin K (phylloquinone)', quantity: 0, unit: 'µg' },
      THIA: { label: 'Thiamin', quantity: 0, unit: 'mg' },
      RIBF: { label: 'Riboflavin', quantity: 0, unit: 'mg' },
      NIA: { label: 'Niacin', quantity: 0, unit: 'mg' },
      VITB6A: { label: 'Vitamin B-6', quantity: 0, unit: 'mg' },
      FOLDFE: { label: 'Folate, DFE', quantity: 0, unit: 'µg' },
      VITB12: { label: 'Vitamin B-12', quantity: 0, unit: 'µg' },
      PANTAC: { label: 'Pantothenic acid', quantity: 0, unit: 'mg' },
      
      // Comprehensive Minerals
      CA: { label: 'Calcium, Ca', quantity: 0, unit: 'mg' },
      FE: { label: 'Iron, Fe', quantity: 0, unit: 'mg' },
      K: { label: 'Potassium, K', quantity: 0, unit: 'mg' },
      P: { label: 'Phosphorus, P', quantity: 0, unit: 'mg' },
      MG: { label: 'Magnesium, Mg', quantity: 0, unit: 'mg' },
      ZN: { label: 'Zinc, Zn', quantity: 0, unit: 'mg' },
      SE: { label: 'Selenium, Se', quantity: 0, unit: 'µg' },
      CU: { label: 'Copper, Cu', quantity: 0, unit: 'mg' },
      MN: { label: 'Manganese, Mn', quantity: 0, unit: 'mg' }
    },
    totalDaily: {
      FAT: { label: 'Total lipid (fat)', quantity: 0, unit: '%' },
      FASAT: { label: 'Fatty acids, total saturated', quantity: 0, unit: '%' },
      CHOCDF: { label: 'Carbohydrate, by difference', quantity: 0, unit: '%' },
      FIBTG: { label: 'Fiber, total dietary', quantity: 0, unit: '%' },
      PROCNT: { label: 'Protein', quantity: 0, unit: '%' },
      CHOLE: { label: 'Cholesterol', quantity: 0, unit: '%' },
      NA: { label: 'Sodium, Na', quantity: 0, unit: '%' },
      CA: { label: 'Calcium, Ca', quantity: 0, unit: '%' },
      MG: { label: 'Magnesium, Mg', quantity: 0, unit: '%' },
      K: { label: 'Potassium, K', quantity: 0, unit: '%' },
      FE: { label: 'Iron, Fe', quantity: 0, unit: '%' },
      VITD: { label: 'Vitamin D', quantity: 0, unit: '%' }
    }
  };

  // Calculate the original weight for each ingredient when proportions were stored
  const originalTotalCalories = ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.calories || 0), 0);
  
  ingredients.forEach(ingredient => {
    if (ingredient.nutritionProportion && originalTotalCalories > 0) {
      // Calculate the original weight of this ingredient based on its calorie proportion
      const originalIngredientWeight = totalGramsAtLastAnalysis * (ingredient.nutritionProportion.calories / originalTotalCalories);
      
      // Calculate scaling factor for this specific ingredient
      const ingredientScaling = originalIngredientWeight > 0 ? ingredient.grams / originalIngredientWeight : 0;
      
      // Scale all nutrition values for this ingredient
      recalculatedNutrition.calories += ingredient.nutritionProportion.calories * ingredientScaling;
      
      // Macronutrients
      recalculatedNutrition.totalNutrients.FAT.quantity += ingredient.nutritionProportion.totalFat * ingredientScaling;
      recalculatedNutrition.totalNutrients.FASAT.quantity += ingredient.nutritionProportion.saturatedFat * ingredientScaling;
      recalculatedNutrition.totalNutrients.FATRN.quantity += ingredient.nutritionProportion.transFat * ingredientScaling;
      recalculatedNutrition.totalNutrients.FAMS.quantity += ingredient.nutritionProportion.monounsaturatedFat * ingredientScaling;
      recalculatedNutrition.totalNutrients.FAPU.quantity += ingredient.nutritionProportion.polyunsaturatedFat * ingredientScaling;
      recalculatedNutrition.totalNutrients.CHOLE.quantity += ingredient.nutritionProportion.cholesterol * ingredientScaling;
      recalculatedNutrition.totalNutrients.NA.quantity += ingredient.nutritionProportion.sodium * ingredientScaling;
      recalculatedNutrition.totalNutrients.CHOCDF.quantity += ingredient.nutritionProportion.totalCarbohydrate * ingredientScaling;
      recalculatedNutrition.totalNutrients.FIBTG.quantity += ingredient.nutritionProportion.dietaryFiber * ingredientScaling;
      recalculatedNutrition.totalNutrients.SUGAR.quantity += ingredient.nutritionProportion.totalSugars * ingredientScaling;
      recalculatedNutrition.totalNutrients.PROCNT.quantity += ingredient.nutritionProportion.protein * ingredientScaling;
      
      // Comprehensive Vitamins
      recalculatedNutrition.totalNutrients.VITA_RAE.quantity += (ingredient.nutritionProportion.vitaminA || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.VITC.quantity += (ingredient.nutritionProportion.vitaminC || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.VITD.quantity += ingredient.nutritionProportion.vitaminD * ingredientScaling;
      recalculatedNutrition.totalNutrients.TOCPHA.quantity += (ingredient.nutritionProportion.vitaminE || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.VITK1.quantity += (ingredient.nutritionProportion.vitaminK || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.THIA.quantity += (ingredient.nutritionProportion.thiamin || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.RIBF.quantity += (ingredient.nutritionProportion.riboflavin || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.NIA.quantity += (ingredient.nutritionProportion.niacin || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.VITB6A.quantity += (ingredient.nutritionProportion.vitaminB6 || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.FOLDFE.quantity += (ingredient.nutritionProportion.folate || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.VITB12.quantity += (ingredient.nutritionProportion.vitaminB12 || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.PANTAC.quantity += (ingredient.nutritionProportion.pantothenicAcid || 0) * ingredientScaling;
      
      // Comprehensive Minerals
      recalculatedNutrition.totalNutrients.CA.quantity += ingredient.nutritionProportion.calcium * ingredientScaling;
      recalculatedNutrition.totalNutrients.FE.quantity += ingredient.nutritionProportion.iron * ingredientScaling;
      recalculatedNutrition.totalNutrients.K.quantity += ingredient.nutritionProportion.potassium * ingredientScaling;
      recalculatedNutrition.totalNutrients.P.quantity += (ingredient.nutritionProportion.phosphorus || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.MG.quantity += (ingredient.nutritionProportion.magnesium || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.ZN.quantity += (ingredient.nutritionProportion.zinc || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.SE.quantity += (ingredient.nutritionProportion.selenium || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.CU.quantity += (ingredient.nutritionProportion.copper || 0) * ingredientScaling;
      recalculatedNutrition.totalNutrients.MN.quantity += (ingredient.nutritionProportion.manganese || 0) * ingredientScaling;
      
      // Scale daily values for this ingredient
      recalculatedNutrition.totalDaily.FAT.quantity += ingredient.nutritionProportion.totalFatDV * ingredientScaling;
      recalculatedNutrition.totalDaily.FASAT.quantity += ingredient.nutritionProportion.saturatedFatDV * ingredientScaling;
      recalculatedNutrition.totalDaily.CHOLE.quantity += ingredient.nutritionProportion.cholesterolDV * ingredientScaling;
      recalculatedNutrition.totalDaily.NA.quantity += ingredient.nutritionProportion.sodiumDV * ingredientScaling;
      recalculatedNutrition.totalDaily.CHOCDF.quantity += ingredient.nutritionProportion.totalCarbohydrateDV * ingredientScaling;
      recalculatedNutrition.totalDaily.FIBTG.quantity += ingredient.nutritionProportion.dietaryFiberDV * ingredientScaling;
      recalculatedNutrition.totalDaily.PROCNT.quantity += ingredient.nutritionProportion.proteinDV * ingredientScaling;
      recalculatedNutrition.totalDaily.VITD.quantity += ingredient.nutritionProportion.vitaminDDV * ingredientScaling;
      recalculatedNutrition.totalDaily.CA.quantity += ingredient.nutritionProportion.calciumDV * ingredientScaling;
      recalculatedNutrition.totalDaily.FE.quantity += ingredient.nutritionProportion.ironDV * ingredientScaling;
      recalculatedNutrition.totalDaily.K.quantity += ingredient.nutritionProportion.potassiumDV * ingredientScaling;
    }
  });

  return recalculatedNutrition;
};

/**
 * Analyze nutrition using real API
 */
export const analyzeNutrition = async (
  ingredients: AddedIngredient[],
  recipeName: string
): Promise<{
  nutritionData: NutritionData;
  allergenData: AllergenData;
  ingredientsWithProportions: AddedIngredient[];
}> => {
  if (ingredients.length === 0) {
    throw new Error('No ingredients provided for nutrition analysis');
  }
  
  // Convert ingredients to strings for API
  const ingredientStrings = ingredients.map(ingredient =>
    NutritionApi.buildIngredientString(
      ingredient.quantity,
      ingredient.unit,
      ingredient.name
    )
  );
  
  // Call nutrition analysis API
  const response = await NutritionApi.analyzeNutrition(
    ingredientStrings,
    recipeName || 'Custom Recipe'
  );
  
  // Check if response exists and has valid nutrition data
  if (!response || !response.data || !response.data.totalNutrients || !response.data.totalDaily) {
    throw new Error('Invalid API response: missing nutrition data');
  }
  
  // Extract raw nutrition data from API response
  const extractedData = extractNutritionData(response.data);
  
  // Extract allergen data from API response
  const extractedAllergens = extractAllergenData(response.data);
  
  // Calculate and store nutrition proportions for each ingredient
  const ingredientsWithProportions = calculateNutritionProportions(ingredients, extractedData);
  
  return {
    nutritionData: extractedData,
    allergenData: extractedAllergens,
    ingredientsWithProportions
  };
};

/**
 * Calculate nutrition from custom ingredients only
 */
export const calculateNutritionFromCustomIngredients = (ingredients: AddedIngredient[]): NutritionData => {
  if (ingredients.length === 0) {
    throw new Error('No ingredients provided');
  }

  // Check if all ingredients are custom and have nutrition data
  const allCustomWithNutrition = ingredients.every(ing =>
    ing.id.startsWith('custom-') && ing.nutritionProportion
  );

  if (!allCustomWithNutrition) {
    throw new Error('Not all ingredients are custom or have nutrition data');
  }

  // Calculate total nutrition from custom ingredients
  const totalGrams = ingredients.reduce((sum, ing) => sum + ing.grams, 0);
  const totalCalories = ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.calories || 0), 0);

  // Create nutrition data structure from custom ingredients
  const customNutritionData: NutritionData = {
    yield: 1,
    calories: totalCalories,
    totalWeight: totalGrams,
    totalNutrients: {
      // Macronutrients
      FAT: {
        label: 'Total lipid (fat)',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.totalFat || 0), 0),
        unit: 'g'
      },
      FASAT: {
        label: 'Fatty acids, total saturated',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.saturatedFat || 0), 0),
        unit: 'g'
      },
      FATRN: {
        label: 'Fatty acids, total trans',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.transFat || 0), 0),
        unit: 'g'
      },
      FAMS: {
        label: 'Fatty acids, total monounsaturated',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.monounsaturatedFat || 0), 0),
        unit: 'g'
      },
      FAPU: {
        label: 'Fatty acids, total polyunsaturated',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.polyunsaturatedFat || 0), 0),
        unit: 'g'
      },
      CHOCDF: {
        label: 'Carbohydrate, by difference',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.totalCarbohydrate || 0), 0),
        unit: 'g'
      },
      FIBTG: {
        label: 'Fiber, total dietary',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.dietaryFiber || 0), 0),
        unit: 'g'
      },
      SUGAR: {
        label: 'Sugars, total',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.totalSugars || 0), 0),
        unit: 'g'
      },
      PROCNT: {
        label: 'Protein',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.protein || 0), 0),
        unit: 'g'
      },
      CHOLE: {
        label: 'Cholesterol',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.cholesterol || 0), 0),
        unit: 'mg'
      },
      NA: {
        label: 'Sodium, Na',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.sodium || 0), 0),
        unit: 'mg'
      },
      
      // Vitamins & Minerals
      VITA_RAE: {
        label: 'Vitamin A, RAE',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminA || 0), 0),
        unit: 'µg'
      },
      VITC: {
        label: 'Vitamin C, total ascorbic acid',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminC || 0), 0),
        unit: 'mg'
      },
      VITD: {
        label: 'Vitamin D (D2 + D3)',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminD || 0), 0),
        unit: 'µg'
      },
      TOCPHA: {
        label: 'Vitamin E (alpha-tocopherol)',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminE || 0), 0),
        unit: 'mg'
      },
      VITK1: {
        label: 'Vitamin K (phylloquinone)',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminK || 0), 0),
        unit: 'µg'
      },
      THIA: {
        label: 'Thiamin',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.thiamin || 0), 0),
        unit: 'mg'
      },
      RIBF: {
        label: 'Riboflavin',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.riboflavin || 0), 0),
        unit: 'mg'
      },
      NIA: {
        label: 'Niacin',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.niacin || 0), 0),
        unit: 'mg'
      },
      VITB6A: {
        label: 'Vitamin B-6',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminB6 || 0), 0),
        unit: 'mg'
      },
      FOLDFE: {
        label: 'Folate, DFE',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.folate || 0), 0),
        unit: 'µg'
      },
      VITB12: {
        label: 'Vitamin B-12',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminB12 || 0), 0),
        unit: 'µg'
      },
      PANTAC: {
        label: 'Pantothenic acid',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.pantothenicAcid || 0), 0),
        unit: 'mg'
      },
      
      CA: {
        label: 'Calcium, Ca',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.calcium || 0), 0),
        unit: 'mg'
      },
      FE: {
        label: 'Iron, Fe',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.iron || 0), 0),
        unit: 'mg'
      },
      K: {
        label: 'Potassium, K',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.potassium || 0), 0),
        unit: 'mg'
      },
      P: {
        label: 'Phosphorus, P',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.phosphorus || 0), 0),
        unit: 'mg'
      },
      MG: {
        label: 'Magnesium, Mg',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.magnesium || 0), 0),
        unit: 'mg'
      },
      ZN: {
        label: 'Zinc, Zn',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.zinc || 0), 0),
        unit: 'mg'
      },
      SE: {
        label: 'Selenium, Se',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.selenium || 0), 0),
        unit: 'µg'
      },
      CU: {
        label: 'Copper, Cu',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.copper || 0), 0),
        unit: 'mg'
      },
      MN: {
        label: 'Manganese, Mn',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.manganese || 0), 0),
        unit: 'mg'
      }
    },
    totalDaily: {
      FAT: {
        label: 'Total lipid (fat)',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.totalFatDV || 0), 0),
        unit: '%'
      },
      FASAT: {
        label: 'Fatty acids, total saturated',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.saturatedFatDV || 0), 0),
        unit: '%'
      },
      CHOCDF: {
        label: 'Carbohydrate, by difference',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.totalCarbohydrateDV || 0), 0),
        unit: '%'
      },
      FIBTG: {
        label: 'Fiber, total dietary',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.dietaryFiberDV || 0), 0),
        unit: '%'
      },
      PROCNT: {
        label: 'Protein',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.proteinDV || 0), 0),
        unit: '%'
      },
      CHOLE: {
        label: 'Cholesterol',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.cholesterolDV || 0), 0),
        unit: '%'
      },
      NA: {
        label: 'Sodium, Na',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.sodiumDV || 0), 0),
        unit: '%'
      },
      CA: {
        label: 'Calcium, Ca',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.calciumDV || 0), 0),
        unit: '%'
      },
      MG: {
        label: 'Magnesium, Mg',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.magnesium || 0), 0) / 400 * 100,
        unit: '%'
      },
      K: {
        label: 'Potassium, K',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.potassiumDV || 0), 0),
        unit: '%'
      },
      FE: {
        label: 'Iron, Fe',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.ironDV || 0), 0),
        unit: '%'
      },
      VITD: {
        label: 'Vitamin D',
        quantity: ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminDDV || 0), 0),
        unit: '%'
      }
    }
  };

  return customNutritionData;
};
      