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
      throw new Error('EDAMAM_NO_DATA');
    }
    
    const foodData = parseResponse;
    
    // Get hints for available measures - this is always available
    const hints = foodData.hints;
    if (!hints || hints.length === 0) {
      console.error('No hints available for measures');
      throw new Error('EDAMAM_NO_DATA');
    }
    
    const hint = hints[0];
    const ingredientNameProcessed = hint.food.label;
    
    // Filter out measures without labels
    const allMeasures = hint.measures || [];
    let measures = allMeasures.filter(measure => measure.label && measure.label.trim() !== '');
    
    if (measures.length === 0) {
      console.error('No valid measures available');
      throw new Error('EDAMAM_NO_DATA');
    }
    
    let actualQuantity = 1; // Default quantity
    let finalMeasure = measures[0]; // Default to first available measure
    
    // Check if we have parsed data with quantity and measure
    if (foodData.parsed && foodData.parsed.length > 0) {
      const parsed = foodData.parsed[0];
      
      // Use parsed values if available
      if (parsed.quantity && parsed.measure) {
        actualQuantity = parsed.quantity;
        
        // Find the corresponding measure in availableMeasures to ensure consistency
        let correspondingMeasure = measures.find(m => m.label === parsed.measure.label);
        
        // If parsed measure is not in available measures, add it
        if (!correspondingMeasure && parsed.measure.label && parsed.measure.weight) {
          const parsedMeasureToAdd = {
            uri: parsed.measure.uri || `http://www.edamam.com/ontologies/edamam.owl#Measure_${parsed.measure.label.toLowerCase()}`,
            label: parsed.measure.label,
            weight: parsed.measure.weight
          };
          
          // Add the parsed measure to the beginning of measures array for priority
          measures = [parsedMeasureToAdd, ...measures];
          correspondingMeasure = parsedMeasureToAdd;
        }
        
        // Use the corresponding measure if found
        if (correspondingMeasure) {
          finalMeasure = correspondingMeasure;
        }
      } else {
        // Parsed data exists but missing quantity/measure - use intelligent defaults
        console.log(`Using default quantity (1) and measure (${measures[0].label}) for ingredient: ${ingredientNameProcessed}`);
        
        // Try to find a more appropriate measure for garnish-type ingredients
        const preferredMeasures = ['Piece', 'Whole', 'Unit', 'Twist', 'Strip', 'Slice', 'Serving'];
        const preferredMeasure = measures.find(m =>
          preferredMeasures.some(preferred =>
            m.label.toLowerCase().includes(preferred.toLowerCase())
          )
        );
        
        if (preferredMeasure) {
          finalMeasure = preferredMeasure;
          console.log(`Selected preferred measure: ${preferredMeasure.label} for ${ingredientNameProcessed}`);
        }
      }
    } else {
      // No parsed data at all - use defaults with intelligent measure selection
      console.log(`No parsed data available. Using defaults for ingredient: ${ingredientNameProcessed}`);
      
      // Try to find a more appropriate measure
      const preferredMeasures = ['Piece', 'Whole', 'Unit', 'Serving', 'Gram'];
      const preferredMeasure = measures.find(m =>
        preferredMeasures.some(preferred =>
          m.label.toLowerCase().includes(preferred.toLowerCase())
        )
      );
      
      if (preferredMeasure) {
        finalMeasure = preferredMeasure;
        console.log(`Selected preferred measure: ${preferredMeasure.label} for ${ingredientNameProcessed}`);
      }
    }
    
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
    
  } catch (error: any) {
    console.error('Error processing ingredient:', error);
    
    // Check for specific Edamam API errors
    if (error.response?.status === 404 ||
        error.message?.includes('No food data found') ||
        error.response?.data?.message?.includes('No food data found')) {
      throw new Error('EDAMAM_NO_DATA');
    }
    
    // Check for network errors
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      throw new Error('NETWORK_ERROR');
    }
    
    // Generic error
    throw new Error('PROCESSING_ERROR');
  }
};

/**
 * Convert custom ingredient data to AddedIngredient format
 */
export const processCustomIngredient = (ingredientData: CustomIngredientData): AddedIngredient => {
  // Handle both camelCase and snake_case properties for compatibility
  const servingUnit = (ingredientData as any).servingUnit || (ingredientData as any).serving_unit || 'g';
  const servingSize = (ingredientData as any).servingSize || (ingredientData as any).serving_size || 100;
  const allergens = (ingredientData as any).allergens?.contains ||
                   (ingredientData as any).allergens_data?.contains ||
                   [];
  const nutrition = (ingredientData as any).nutrition || (ingredientData as any).nutrition_data || {};
  
  return {
    id: `custom-${Date.now()}`,
    name: ingredientData.name,
    quantity: 1,
    unit: servingUnit,
    waste: 0.0,
    grams: Number(servingSize),
    availableMeasures: [
      {
        uri: `custom-measure-${servingUnit}`,
        label: servingUnit,
        weight: servingSize
      }
    ],
    allergens: allergens,
    // Add nutrition proportion based on custom ingredient data
    nutritionProportion: {
      calories: nutrition.calories || 0,
      // Macronutrients
      totalFat: nutrition.fat || 0,
      saturatedFat: nutrition.saturatedFat || nutrition.saturated_fat || 0,
      transFat: nutrition.transFat || nutrition.trans_fat || 0,
      monounsaturatedFat: 0, // Not available in custom ingredient form
      polyunsaturatedFat: 0, // Not available in custom ingredient form
      cholesterol: nutrition.cholesterol || 0,
      sodium: nutrition.sodium || 0,
      totalCarbohydrate: nutrition.carbohydrates || nutrition.total_carbohydrate || 0,
      dietaryFiber: nutrition.fiber || nutrition.dietary_fiber || 0,
      totalSugars: nutrition.sugars || nutrition.total_sugars || 0,
      addedSugars: nutrition.addedSugars || nutrition.added_sugars || 0,
      sugarAlcohol: 0, // Not available in custom ingredient form
      protein: nutrition.protein || 0,
      
      // Comprehensive Vitamins - Use custom ingredient data or default to 0
      vitaminA: nutrition.vitaminA || nutrition.vitamin_a || 0,
      vitaminC: nutrition.vitaminC || nutrition.vitamin_c || 0,
      vitaminD: nutrition.vitaminD || nutrition.vitamin_d || 0,
      vitaminE: 0, // Not available in custom ingredient form
      vitaminK: 0, // Not available in custom ingredient form
      thiamin: nutrition.thiamine || nutrition.thiamin || 0, // Note: both spellings
      riboflavin: nutrition.riboflavin || 0,
      niacin: nutrition.niacin || 0,
      vitaminB6: nutrition.vitaminB6 || nutrition.vitamin_b6 || 0,
      folate: nutrition.folate || 0,
      vitaminB12: nutrition.vitaminB12 || nutrition.vitamin_b12 || 0,
      pantothenicAcid: nutrition.pantothenicAcid || nutrition.pantothenic_acid || 0,
      
      // Comprehensive Minerals - Use custom ingredient data or default to 0
      calcium: nutrition.calcium || 0,
      iron: nutrition.iron || 0,
      potassium: nutrition.potassium || 0,
      phosphorus: nutrition.phosphorus || 0,
      magnesium: nutrition.magnesium || 0,
      zinc: nutrition.zinc || 0,
      selenium: nutrition.selenium || 0,
      copper: nutrition.copper || 0,
      manganese: nutrition.manganese || 0,
      
      // Daily values - calculate based on standard daily values
      totalFatDV: ((nutrition.fat || 0) / 65) * 100,
      saturatedFatDV: ((nutrition.saturatedFat || nutrition.saturated_fat || 0) / 20) * 100,
      monounsaturatedFatDV: 0, // No DV established for monounsaturated fats
      polyunsaturatedFatDV: 0, // No DV established for polyunsaturated fats
      cholesterolDV: ((nutrition.cholesterol || 0) / 300) * 100,
      sodiumDV: ((nutrition.sodium || 0) / 2300) * 100,
      totalCarbohydrateDV: ((nutrition.carbohydrates || nutrition.total_carbohydrate || 0) / 300) * 100,
      dietaryFiberDV: ((nutrition.fiber || nutrition.dietary_fiber || 0) / 25) * 100,
      addedSugarsDV: ((nutrition.addedSugars || nutrition.added_sugars || 0) / 50) * 100,
      sugarAlcoholDV: 0, // No DV established for sugar alcohols
      proteinDV: ((nutrition.protein || 0) / 50) * 100,
      vitaminDDV: ((nutrition.vitaminD || nutrition.vitamin_d || 0) / 20) * 100,
      calciumDV: ((nutrition.calcium || 0) / 1000) * 100,
      ironDV: ((nutrition.iron || 0) / 18) * 100,
      potassiumDV: ((nutrition.potassium || 0) / 3500) * 100
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
    allergens: customIngredientData.allergens_data?.contains ||
               customIngredientData.allergens?.contains ||
               [],
    // Add nutrition proportion based on custom ingredient data
    nutritionProportion: {
      calories: customIngredientData.nutrition_data?.calories ||
                customIngredientData.nutrition?.calories ||
                0,
      // Macronutrients
      totalFat: customIngredientData.nutrition_data?.fat || customIngredientData.nutrition?.fat || 0,
      saturatedFat: customIngredientData.nutrition_data?.saturated_fat || customIngredientData.nutrition?.saturated_fat || 0,
      transFat: customIngredientData.nutrition_data?.trans_fat || customIngredientData.nutrition?.trans_fat || 0,
      monounsaturatedFat: 0, // Not available in custom ingredient form
      polyunsaturatedFat: 0, // Not available in custom ingredient form
      cholesterol: customIngredientData.nutrition_data?.cholesterol || customIngredientData.nutrition?.cholesterol || 0,
      sodium: customIngredientData.nutrition_data?.sodium || customIngredientData.nutrition?.sodium || 0,
      totalCarbohydrate: customIngredientData.nutrition_data?.carbohydrates || customIngredientData.nutrition?.carbohydrates || 0,
      dietaryFiber: customIngredientData.nutrition_data?.fiber || customIngredientData.nutrition?.fiber || 0,
      totalSugars: customIngredientData.nutrition_data?.sugars || customIngredientData.nutrition?.sugars || 0,
      addedSugars: customIngredientData.nutrition_data?.added_sugars || customIngredientData.nutrition?.added_sugars || 0,
      sugarAlcohol: 0, // Not available in custom ingredient form
      protein: customIngredientData.nutrition_data?.protein || customIngredientData.nutrition?.protein || 0,
      
      // Comprehensive Vitamins - Use custom ingredient data or default to 0
      vitaminA: customIngredientData.nutrition_data?.vitamin_a || customIngredientData.nutrition?.vitamin_a || 0,
      vitaminC: customIngredientData.nutrition_data?.vitamin_c || customIngredientData.nutrition?.vitamin_c || 0,
      vitaminD: customIngredientData.nutrition_data?.vitamin_d || customIngredientData.nutrition?.vitamin_d || 0,
      vitaminE: 0, // Not available in custom ingredient form
      vitaminK: 0, // Not available in custom ingredient form
      thiamin: customIngredientData.nutrition_data?.thiamine || customIngredientData.nutrition?.thiamine || 0,
      riboflavin: customIngredientData.nutrition_data?.riboflavin || customIngredientData.nutrition?.riboflavin || 0,
      niacin: customIngredientData.nutrition_data?.niacin || customIngredientData.nutrition?.niacin || 0,
      vitaminB6: customIngredientData.nutrition_data?.vitamin_b6 || customIngredientData.nutrition?.vitamin_b6 || 0,
      folate: customIngredientData.nutrition_data?.folate || customIngredientData.nutrition?.folate || 0,
      vitaminB12: customIngredientData.nutrition_data?.vitamin_b12 || customIngredientData.nutrition?.vitamin_b12 || 0,
      pantothenicAcid: customIngredientData.nutrition_data?.pantothenic_acid || customIngredientData.nutrition?.pantothenic_acid || 0,
      
      // Comprehensive Minerals - Use custom ingredient data or default to 0
      calcium: customIngredientData.nutrition_data?.calcium || customIngredientData.nutrition?.calcium || 0,
      iron: customIngredientData.nutrition_data?.iron || customIngredientData.nutrition?.iron || 0,
      potassium: customIngredientData.nutrition_data?.potassium || customIngredientData.nutrition?.potassium || 0,
      phosphorus: customIngredientData.nutrition_data?.phosphorus || customIngredientData.nutrition?.phosphorus || 0,
      magnesium: customIngredientData.nutrition_data?.magnesium || customIngredientData.nutrition?.magnesium || 0,
      zinc: customIngredientData.nutrition_data?.zinc || customIngredientData.nutrition?.zinc || 0,
      selenium: customIngredientData.nutrition_data?.selenium || customIngredientData.nutrition?.selenium || 0,
      copper: customIngredientData.nutrition_data?.copper || customIngredientData.nutrition?.copper || 0,
      manganese: customIngredientData.nutrition_data?.manganese || customIngredientData.nutrition?.manganese || 0,
      
      // Daily values - calculate based on standard daily values
      totalFatDV: ((customIngredientData.nutrition_data?.fat || customIngredientData.nutrition?.fat || 0) / 65) * 100,
      saturatedFatDV: ((customIngredientData.nutrition_data?.saturated_fat || customIngredientData.nutrition?.saturated_fat || 0) / 20) * 100,
      monounsaturatedFatDV: 0, // No DV established for monounsaturated fats
      polyunsaturatedFatDV: 0, // No DV established for polyunsaturated fats
      cholesterolDV: ((customIngredientData.nutrition_data?.cholesterol || customIngredientData.nutrition?.cholesterol || 0) / 300) * 100,
      sodiumDV: ((customIngredientData.nutrition_data?.sodium || customIngredientData.nutrition?.sodium || 0) / 2300) * 100,
      totalCarbohydrateDV: ((customIngredientData.nutrition_data?.carbohydrates || customIngredientData.nutrition?.carbohydrates || 0) / 300) * 100,
      dietaryFiberDV: ((customIngredientData.nutrition_data?.fiber || customIngredientData.nutrition?.fiber || 0) / 25) * 100,
      addedSugarsDV: ((customIngredientData.nutrition_data?.added_sugars || customIngredientData.nutrition?.added_sugars || 0) / 50) * 100,
      sugarAlcoholDV: 0, // No DV established for sugar alcohols
      proteinDV: ((customIngredientData.nutrition_data?.protein || customIngredientData.nutrition?.protein || 0) / 50) * 100,
      vitaminDDV: ((customIngredientData.nutrition_data?.vitamin_d || customIngredientData.nutrition?.vitamin_d || 0) / 20) * 100,
      calciumDV: ((customIngredientData.nutrition_data?.calcium || customIngredientData.nutrition?.calcium || 0) / 1000) * 100,
      ironDV: ((customIngredientData.nutrition_data?.iron || customIngredientData.nutrition?.iron || 0) / 18) * 100,
      potassiumDV: ((customIngredientData.nutrition_data?.potassium || customIngredientData.nutrition?.potassium || 0) / 3500) * 100
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