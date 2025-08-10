import { foodParserApi } from '@/services/foodParserApi';
import { CustomIngredientData } from '@/types/customIngredient';
import { AddedIngredient } from '@/utils/nutritionCalculations';

/**
 * Process ingredient from search result and convert to AddedIngredient
 */
export const processSearchIngredient = async (ingredientName: string): Promise<AddedIngredient | null> => {
  try {
    // Call the food parser API to get detailed ingredient data
    const parseResponse = await foodParserApi.parseIngredient(ingredientName);
    
    if (!parseResponse) {
      console.error('API call failed or no food data:', parseResponse);
      return null;
    }
    
    const foodData = parseResponse;
    
    // Check if we have parsed data
    if (foodData.parsed && foodData.parsed.length > 0) {
      const parsed = foodData.parsed[0];
      
      // Get hints for available measures
      const hints = foodData.hints;
      if (!hints || hints.length === 0) {
        console.error('No hints available for measures');
        return null;
      }
      
      const hint = hints[0];
      
      // Filter out measures without labels
      const allMeasures = hint.measures || [];
      let measures = allMeasures.filter(measure => measure.label && measure.label.trim() !== '');
      
      // Use actual parsed values - NO FALLBACKS
      if (!parsed.quantity) {
        console.error('No quantity in parsed data');
        return null;
      }
      
      if (!parsed.measure) {
        console.error('No measure in parsed data');
        return null;
      }
      
      const actualQuantity = parsed.quantity;
      const actualMeasure = parsed.measure;
      const ingredientNameProcessed = hint.food.label;
      
      // Find the corresponding measure in availableMeasures to ensure consistency
      let correspondingMeasure = measures.find(m => m.label === actualMeasure.label);
      
      // CRITICAL FIX: If parsed measure is not in available measures, add it
      if (!correspondingMeasure && actualMeasure.label && actualMeasure.weight) {
        const parsedMeasureToAdd = {
          uri: actualMeasure.uri || `http://www.edamam.com/ontologies/edamam.owl#Measure_${actualMeasure.label.toLowerCase()}`,
          label: actualMeasure.label,
          weight: actualMeasure.weight
        };
        
        // Add the parsed measure to the beginning of measures array for priority
        measures = [parsedMeasureToAdd, ...measures];
        correspondingMeasure = parsedMeasureToAdd;
      }
      
      if (measures.length === 0) {
        console.error('No valid measures available');
        return null;
      }
      
      // Use the corresponding measure (either found or added) or fallback to first available
      const finalMeasure = correspondingMeasure || measures[0];
      const measureWeight = finalMeasure.weight;
      
      // Calculate grams using the weight from availableMeasures for consistency
      const baseGrams = Math.round((actualQuantity * measureWeight) * 10) / 10;
      
      const newIngredient: AddedIngredient = {
        id: `${ingredientName}-${Date.now()}`,
        name: ingredientNameProcessed,
        quantity: actualQuantity,
        unit: finalMeasure.label,
        waste: 0.0,
        grams: Number(baseGrams),
        availableMeasures: measures,
        allergens: []
      };
      
      return newIngredient;
      
    } else {
      console.error('No parsed data available in response');
      return null;
    }
    
  } catch (error) {
    console.error('Error processing ingredient:', error);
    return null;
  }
};

/**
 * Convert custom ingredient data to AddedIngredient format
 */
export const processCustomIngredient = (ingredientData: CustomIngredientData): AddedIngredient => {
  return {
    id: `custom-${Date.now()}`,
    name: ingredientData.name,
    quantity: 1,
    unit: ingredientData.servingUnit,
    waste: 0.0,
    grams: Number(ingredientData.servingSize),
    availableMeasures: [
      {
        uri: `custom-measure-${ingredientData.servingUnit}`,
        label: ingredientData.servingUnit,
        weight: ingredientData.servingSize
      }
    ],
    allergens: ingredientData.allergens.contains || [],
    // Add nutrition proportion based on custom ingredient data
    nutritionProportion: {
      calories: ingredientData.nutrition.calories,
      // Macronutrients
      totalFat: ingredientData.nutrition.fat,
      saturatedFat: ingredientData.nutrition.saturatedFat,
      transFat: ingredientData.nutrition.transFat,
      monounsaturatedFat: 0, // Not available in custom ingredient form
      polyunsaturatedFat: 0, // Not available in custom ingredient form
      cholesterol: ingredientData.nutrition.cholesterol,
      sodium: ingredientData.nutrition.sodium,
      totalCarbohydrate: ingredientData.nutrition.carbohydrates,
      dietaryFiber: ingredientData.nutrition.fiber,
      totalSugars: ingredientData.nutrition.sugars,
      addedSugars: ingredientData.nutrition.addedSugars,
      sugarAlcohol: 0, // Not available in custom ingredient form
      protein: ingredientData.nutrition.protein,
      
      // Comprehensive Vitamins - Use custom ingredient data or default to 0
      vitaminA: ingredientData.nutrition.vitaminA || 0,
      vitaminC: ingredientData.nutrition.vitaminC || 0,
      vitaminD: ingredientData.nutrition.vitaminD || 0,
      vitaminE: 0, // Not available in custom ingredient form
      vitaminK: 0, // Not available in custom ingredient form
      thiamin: ingredientData.nutrition.thiamine || 0, // Note: thiamine with 'e'
      riboflavin: ingredientData.nutrition.riboflavin || 0,
      niacin: ingredientData.nutrition.niacin || 0,
      vitaminB6: ingredientData.nutrition.vitaminB6 || 0,
      folate: ingredientData.nutrition.folate || 0,
      vitaminB12: ingredientData.nutrition.vitaminB12 || 0,
      pantothenicAcid: ingredientData.nutrition.pantothenicAcid || 0,
      
      // Comprehensive Minerals - Use custom ingredient data or default to 0
      calcium: ingredientData.nutrition.calcium,
      iron: ingredientData.nutrition.iron,
      potassium: ingredientData.nutrition.potassium || 0,
      phosphorus: ingredientData.nutrition.phosphorus || 0,
      magnesium: ingredientData.nutrition.magnesium || 0,
      zinc: ingredientData.nutrition.zinc || 0,
      selenium: ingredientData.nutrition.selenium || 0,
      copper: ingredientData.nutrition.copper || 0,
      manganese: ingredientData.nutrition.manganese || 0,
      
      // Daily values - calculate based on standard daily values
      totalFatDV: (ingredientData.nutrition.fat / 65) * 100,
      saturatedFatDV: (ingredientData.nutrition.saturatedFat / 20) * 100,
      monounsaturatedFatDV: 0, // No DV established for monounsaturated fats
      polyunsaturatedFatDV: 0, // No DV established for polyunsaturated fats
      cholesterolDV: (ingredientData.nutrition.cholesterol / 300) * 100,
      sodiumDV: (ingredientData.nutrition.sodium / 2300) * 100,
      totalCarbohydrateDV: (ingredientData.nutrition.carbohydrates / 300) * 100,
      dietaryFiberDV: (ingredientData.nutrition.fiber / 25) * 100,
      addedSugarsDV: (ingredientData.nutrition.addedSugars / 50) * 100,
      sugarAlcoholDV: 0, // No DV established for sugar alcohols
      proteinDV: (ingredientData.nutrition.protein / 50) * 100,
      vitaminDDV: ((ingredientData.nutrition.vitaminD || 0) / 20) * 100,
      calciumDV: (ingredientData.nutrition.calcium / 1000) * 100,
      ironDV: (ingredientData.nutrition.iron / 18) * 100,
      potassiumDV: ((ingredientData.nutrition.potassium || 0) / 3500) * 100
    }
  };
};

/**
 * Convert database custom ingredient to AddedIngredient format
 */
export const processCustomIngredientFromDB = (customIngredientData: any): AddedIngredient => {
  return {
    id: `custom-${Date.now()}`,
    name: customIngredientData.name,
    quantity: 1,
    unit: customIngredientData.serving_unit || 'g',
    waste: 0.0,
    grams: Number(customIngredientData.serving_size) || 100,
    availableMeasures: [
      {
        uri: `custom-measure-${customIngredientData.serving_unit || 'g'}`,
        label: customIngredientData.serving_unit || 'g',
        weight: customIngredientData.serving_size || 100
      }
    ],
    allergens: customIngredientData.allergens?.contains || [],
    // Add nutrition proportion based on custom ingredient data
    nutritionProportion: {
      calories: customIngredientData.nutrition?.calories || 0,
      // Macronutrients
      totalFat: customIngredientData.nutrition?.fat || 0,
      saturatedFat: customIngredientData.nutrition?.saturated_fat || 0,
      transFat: customIngredientData.nutrition?.trans_fat || 0,
      monounsaturatedFat: 0, // Not available in custom ingredient form
      polyunsaturatedFat: 0, // Not available in custom ingredient form
      cholesterol: customIngredientData.nutrition?.cholesterol || 0,
      sodium: customIngredientData.nutrition?.sodium || 0,
      totalCarbohydrate: customIngredientData.nutrition?.carbohydrates || 0,
      dietaryFiber: customIngredientData.nutrition?.fiber || 0,
      totalSugars: customIngredientData.nutrition?.sugars || 0,
      addedSugars: customIngredientData.nutrition?.added_sugars || 0,
      sugarAlcohol: 0, // Not available in custom ingredient form
      protein: customIngredientData.nutrition?.protein || 0,
      
      // Comprehensive Vitamins - Use custom ingredient data or default to 0
      vitaminA: customIngredientData.nutrition?.vitamin_a || 0,
      vitaminC: customIngredientData.nutrition?.vitamin_c || 0,
      vitaminD: customIngredientData.nutrition?.vitamin_d || 0,
      vitaminE: 0, // Not available in custom ingredient form
      vitaminK: 0, // Not available in custom ingredient form
      thiamin: customIngredientData.nutrition?.thiamine || 0, // Note: thiamine with 'e'
      riboflavin: customIngredientData.nutrition?.riboflavin || 0,
      niacin: customIngredientData.nutrition?.niacin || 0,
      vitaminB6: customIngredientData.nutrition?.vitamin_b6 || 0,
      folate: customIngredientData.nutrition?.folate || 0,
      vitaminB12: customIngredientData.nutrition?.vitamin_b12 || 0,
      pantothenicAcid: customIngredientData.nutrition?.pantothenic_acid || 0,
      
      // Comprehensive Minerals - Use custom ingredient data or default to 0
      calcium: customIngredientData.nutrition?.calcium || 0,
      iron: customIngredientData.nutrition?.iron || 0,
      potassium: customIngredientData.nutrition?.potassium || 0,
      phosphorus: customIngredientData.nutrition?.phosphorus || 0,
      magnesium: customIngredientData.nutrition?.magnesium || 0,
      zinc: customIngredientData.nutrition?.zinc || 0,
      selenium: customIngredientData.nutrition?.selenium || 0,
      copper: customIngredientData.nutrition?.copper || 0,
      manganese: customIngredientData.nutrition?.manganese || 0,
      
      // Daily values - calculate based on standard daily values
      totalFatDV: ((customIngredientData.nutrition?.fat || 0) / 65) * 100,
      saturatedFatDV: ((customIngredientData.nutrition?.saturated_fat || 0) / 20) * 100,
      monounsaturatedFatDV: 0, // No DV established for monounsaturated fats
      polyunsaturatedFatDV: 0, // No DV established for polyunsaturated fats
      cholesterolDV: ((customIngredientData.nutrition?.cholesterol || 0) / 300) * 100,
      sodiumDV: ((customIngredientData.nutrition?.sodium || 0) / 2300) * 100,
      totalCarbohydrateDV: ((customIngredientData.nutrition?.carbohydrates || 0) / 300) * 100,
      dietaryFiberDV: ((customIngredientData.nutrition?.fiber || 0) / 25) * 100,
      addedSugarsDV: ((customIngredientData.nutrition?.added_sugars || 0) / 50) * 100,
      sugarAlcoholDV: 0, // No DV established for sugar alcohols
      proteinDV: ((customIngredientData.nutrition?.protein || 0) / 50) * 100,
      vitaminDDV: ((customIngredientData.nutrition?.vitamin_d || 0) / 20) * 100,
      calciumDV: ((customIngredientData.nutrition?.calcium || 0) / 1000) * 100,
      ironDV: ((customIngredientData.nutrition?.iron || 0) / 18) * 100,
      potassiumDV: ((customIngredientData.nutrition?.potassium || 0) / 3500) * 100
    }
  };
};

/**
 * Update ingredient properties and recalculate grams
 */
export const updateIngredientProperty = (
  ingredient: AddedIngredient,
  field: keyof AddedIngredient,
  value: any
): AddedIngredient => {
  const updatedIngredient = { 
    ...ingredient, 
    [field]: field === 'waste' || field === 'quantity' ? Number(value) || 0 : value 
  };
  
  // Recalculate grams when quantity, unit, or waste changes
  if (field === 'quantity' || field === 'unit' || field === 'waste') {
    const selectedMeasure = updatedIngredient.availableMeasures.find(
      measure => measure.label === updatedIngredient.unit
    );
    
    if (selectedMeasure) {
      // Calculate base grams from quantity and unit
      const baseGrams = updatedIngredient.quantity * selectedMeasure.weight;
      // Apply waste calculation: if 10% waste, only 90% remains
      const wastePercentage = updatedIngredient.waste / 100;
      updatedIngredient.grams = Number(Math.round((baseGrams * (1 - wastePercentage)) * 10) / 10);
    }
  }
  
  return updatedIngredient;
};

/**
 * Calculate total waste and net grams for ingredients
 */
export const calculateIngredientTotals = (ingredients: AddedIngredient[]) => {
  const totalWasteGrams = ingredients.reduce((sum, ing) => {
    const selectedMeasure = ing.availableMeasures.find(m => m.label === ing.unit);
    const baseGrams = selectedMeasure ? ing.quantity * selectedMeasure.weight : 0;
    const wasteGrams = baseGrams * (ing.waste / 100);
    return sum + (Number(wasteGrams) || 0);
  }, 0);
  
  const totalNetGrams = ingredients.reduce((sum, ing) => sum + (Number(ing.grams) || 0), 0);
  
  return {
    totalWasteGrams: Number(totalWasteGrams.toFixed(1)),
    totalNetGrams: Number(totalNetGrams.toFixed(1))
  };
};

/**
 * Check if ingredient name is duplicate
 */
export const isDuplicateIngredient = (
  ingredientName: string,
  addedIngredientNames: Set<string>
): boolean => {
  const ingredientKey = ingredientName.toLowerCase().trim();
  return addedIngredientNames.has(ingredientKey);
};

/**
 * Add ingredient name to tracking set
 */
export const addIngredientNameToTracking = (
  ingredientName: string,
  addedIngredientNames: Set<string>
): Set<string> => {
  const ingredientKey = ingredientName.toLowerCase().trim();
  const newSet = new Set(addedIngredientNames);
  newSet.add(ingredientKey);
  return newSet;
};

/**
 * Remove ingredient name from tracking set
 */
export const removeIngredientNameFromTracking = (
  ingredientName: string,
  addedIngredientNames: Set<string>
): Set<string> => {
  const ingredientKey = ingredientName.toLowerCase().trim();
  const newSet = new Set(addedIngredientNames);
  newSet.delete(ingredientKey);
  return newSet;
};