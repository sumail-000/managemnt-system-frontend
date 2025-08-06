import { EdamamNutritionResponse } from '../services/nutritionApi';

// Interface for the mapped nutrition data from Edamam API
export interface NutritionData {
  // Basic recipe info
  yield: number;
  calories: number;
  totalWeight: number;
  
  // Total nutrients (raw quantities) - Based on exact API response structure
  totalNutrients: {
    // Macronutrients
    FAT: { label: string; quantity: number; unit: string };
    FASAT: { label: string; quantity: number; unit: string };
    FATRN: { label: string; quantity: number; unit: string };
    FAMS: { label: string; quantity: number; unit: string }; // Monounsaturated fats
    FAPU: { label: string; quantity: number; unit: string }; // Polyunsaturated fats
    CHOCDF: { label: string; quantity: number; unit: string };
    FIBTG: { label: string; quantity: number; unit: string };
    SUGAR: { label: string; quantity: number; unit: string };
    PROCNT: { label: string; quantity: number; unit: string };
    CHOLE: { label: string; quantity: number; unit: string };
    NA: { label: string; quantity: number; unit: string };
    
    // Comprehensive Vitamins - Based on exact API response structure
    VITA_RAE?: { label: string; quantity: number; unit: string }; // Vitamin A, RAE
    VITC?: { label: string; quantity: number; unit: string }; // Vitamin C, total ascorbic acid
    VITD: { label: string; quantity: number; unit: string }; // Vitamin D (D2 + D3)
    TOCPHA?: { label: string; quantity: number; unit: string }; // Vitamin E (alpha-tocopherol)
    VITK1?: { label: string; quantity: number; unit: string }; // Vitamin K (phylloquinone)
    THIA?: { label: string; quantity: number; unit: string }; // Thiamin
    RIBF?: { label: string; quantity: number; unit: string }; // Riboflavin
    NIA?: { label: string; quantity: number; unit: string }; // Niacin
    VITB6A?: { label: string; quantity: number; unit: string }; // Vitamin B-6
    FOLDFE?: { label: string; quantity: number; unit: string }; // Folate, DFE
    VITB12?: { label: string; quantity: number; unit: string }; // Vitamin B-12
    PANTAC?: { label: string; quantity: number; unit: string }; // Pantothenic acid
    
    // Comprehensive Minerals - Based on exact API response structure
    CA: { label: string; quantity: number; unit: string }; // Calcium, Ca
    FE: { label: string; quantity: number; unit: string }; // Iron, Fe
    K: { label: string; quantity: number; unit: string }; // Potassium, K
    P?: { label: string; quantity: number; unit: string }; // Phosphorus, P
    MG: { label: string; quantity: number; unit: string }; // Magnesium, Mg
    ZN?: { label: string; quantity: number; unit: string }; // Zinc, Zn
    SE?: { label: string; quantity: number; unit: string }; // Selenium, Se
    CU?: { label: string; quantity: number; unit: string }; // Copper, Cu
    MN?: { label: string; quantity: number; unit: string }; // Manganese, Mn
  };
  
  // Daily values (percentages)
  totalDaily: {
    FAT: { label: string; quantity: number; unit: string };
    FASAT: { label: string; quantity: number; unit: string };
    CHOCDF: { label: string; quantity: number; unit: string };
    FIBTG: { label: string; quantity: number; unit: string };
    PROCNT: { label: string; quantity: number; unit: string };
    CHOLE: { label: string; quantity: number; unit: string };
    NA: { label: string; quantity: number; unit: string };
    CA: { label: string; quantity: number; unit: string };
    MG: { label: string; quantity: number; unit: string };
    K: { label: string; quantity: number; unit: string };
    FE: { label: string; quantity: number; unit: string };
    VITD: { label: string; quantity: number; unit: string };
  };
}

// Interface for per-serving nutrition data
export interface PerServingNutritionData {
  // Serving info
  servingsPerContainer: number;
  servingSize: string;
  servingSizeGrams: number;
  
  // Per-serving values
  calories: number;
  
  // Per-serving nutrients
  nutrients: {
    FAT: { label: string; quantity: number; unit: string };
    FASAT: { label: string; quantity: number; unit: string };
    FATRN: { label: string; quantity: number; unit: string };
    CHOCDF: { label: string; quantity: number; unit: string };
    FIBTG: { label: string; quantity: number; unit: string };
    SUGAR: { label: string; quantity: number; unit: string };
    PROCNT: { label: string; quantity: number; unit: string };
    CHOLE: { label: string; quantity: number; unit: string };
    NA: { label: string; quantity: number; unit: string };
    CA: { label: string; quantity: number; unit: string };
    MG: { label: string; quantity: number; unit: string };
    K: { label: string; quantity: number; unit: string };
    FE: { label: string; quantity: number; unit: string };
    VITD: { label: string; quantity: number; unit: string };
  };
  
  // Per-serving daily values
  dailyValues: {
    FAT: { label: string; quantity: number; unit: string };
    FASAT: { label: string; quantity: number; unit: string };
    CHOCDF: { label: string; quantity: number; unit: string };
    FIBTG: { label: string; quantity: number; unit: string };
    PROCNT: { label: string; quantity: number; unit: string };
    CHOLE: { label: string; quantity: number; unit: string };
    NA: { label: string; quantity: number; unit: string };
    CA: { label: string; quantity: number; unit: string };
    MG: { label: string; quantity: number; unit: string };
    K: { label: string; quantity: number; unit: string };
    FE: { label: string; quantity: number; unit: string };
    VITD: { label: string; quantity: number; unit: string };
  };
}

// Legacy interface for FDA label compatibility
export interface FDANutritionData {
  servings: number;
  servingSize: string;
  servingSizeGrams: number;
  calories: number;
  
  // Macronutrients (per serving)
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
  
  // Vitamins and Minerals (per serving)
  vitaminD: number;
  calcium: number;
  iron: number;
  potassium: number;
  vitaminA: number;
  vitaminC: number;
  vitaminE: number;
  vitaminK: number;
  thiamin: number;
  riboflavin: number;
  niacin: number;
  vitaminB6: number;
  folate: number;
  vitaminB12: number;
  biotin: number;
  pantothenicAcid: number;
  phosphorus: number;
  iodine: number;
  magnesium: number;
  zinc: number;
  selenium: number;
  copper: number;
  manganese: number;
  chromium: number;
  molybdenum: number;
  chloride: number;
  
  // Daily Values (percentages per serving)
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
}

/**
 * Extracts specific nutrition data from Edamam API response
 * @param response - The Edamam nutrition API response
 * @returns Mapped nutrition data with only the required fields
 */
export function extractNutritionData(response: EdamamNutritionResponse): NutritionData {
  const { totalNutrients, totalDaily, calories, totalWeight } = response;
  const yieldValue = response.yield || 1;
  
  // Helper function to safely extract nutrient data
  const extractNutrient = (nutrientKey: string) => {
    const nutrient = totalNutrients[nutrientKey];
    return nutrient ? {
      label: nutrient.label,
      quantity: nutrient.quantity || 0,
      unit: nutrient.unit || ''
    } : { label: '', quantity: 0, unit: '' };
  };
  
  // Helper function to safely extract daily value data
  const extractDailyValue = (nutrientKey: string) => {
    const dailyValue = totalDaily[nutrientKey];
    return dailyValue ? {
      label: dailyValue.label,
      quantity: dailyValue.quantity || 0,
      unit: dailyValue.unit || '%'
    } : { label: '', quantity: 0, unit: '%' };
  };
  
  return {
    yield: yieldValue,
    calories: calories || 0,
    totalWeight: totalWeight || 0,
    
    totalNutrients: {
      // Macronutrients
      FAT: extractNutrient('FAT'),
      FASAT: extractNutrient('FASAT'),
      FATRN: extractNutrient('FATRN'),
      FAMS: extractNutrient('FAMS'),
      FAPU: extractNutrient('FAPU'),
      CHOCDF: extractNutrient('CHOCDF'),
      FIBTG: extractNutrient('FIBTG'),
      SUGAR: extractNutrient('SUGAR'),
      PROCNT: extractNutrient('PROCNT'),
      CHOLE: extractNutrient('CHOLE'),
      NA: extractNutrient('NA'),
      
      // Comprehensive Vitamins - Based on exact API response structure
      VITA_RAE: extractNutrient('VITA_RAE'),
      VITC: extractNutrient('VITC'),
      VITD: extractNutrient('VITD'),
      TOCPHA: extractNutrient('TOCPHA'),
      VITK1: extractNutrient('VITK1'),
      THIA: extractNutrient('THIA'),
      RIBF: extractNutrient('RIBF'),
      NIA: extractNutrient('NIA'),
      VITB6A: extractNutrient('VITB6A'),
      FOLDFE: extractNutrient('FOLDFE'),
      VITB12: extractNutrient('VITB12'),
      PANTAC: extractNutrient('PANTAC'),
      
      // Comprehensive Minerals - Based on exact API response structure
      CA: extractNutrient('CA'),
      FE: extractNutrient('FE'),
      K: extractNutrient('K'),
      P: extractNutrient('P'),
      MG: extractNutrient('MG'),
      ZN: extractNutrient('ZN'),
      SE: extractNutrient('SE'),
      CU: extractNutrient('CU'),
      MN: extractNutrient('MN'),
    },
    
    totalDaily: {
      FAT: extractDailyValue('FAT'),
      FASAT: extractDailyValue('FASAT'),
      CHOCDF: extractDailyValue('CHOCDF'),
      FIBTG: extractDailyValue('FIBTG'),
      PROCNT: extractDailyValue('PROCNT'),
      CHOLE: extractDailyValue('CHOLE'),
      NA: extractDailyValue('NA'),
      CA: extractDailyValue('CA'),
      MG: extractDailyValue('MG'),
      K: extractDailyValue('K'),
      FE: extractDailyValue('FE'),
      VITD: extractDailyValue('VITD'),
    }
  };
}

/**
 * Calculates per-serving nutrition data from total nutrition data
 * @param nutritionData - The total nutrition data from Edamam API
 * @param servingsPerContainer - Number of servings per container (defaults to yield)
 * @returns Per-serving nutrition data with calculated values
 */
export function calculatePerServingNutrition(
  nutritionData: NutritionData, 
  servingsPerContainer?: number
): PerServingNutritionData {
  const servings = servingsPerContainer || nutritionData.yield || 1;
  const servingSizeGrams = Math.round(nutritionData.totalWeight / servings);
  
  // Helper function to calculate per-serving nutrient values
  const calculatePerServingNutrient = (nutrient: { label: string; quantity: number; unit: string }) => ({
    label: nutrient.label,
    quantity: Math.round((nutrient.quantity / servings) * 100) / 100, // Round to 2 decimal places
    unit: nutrient.unit
  });
  
  // Helper function to calculate per-serving daily values
  const calculatePerServingDailyValue = (dailyValue: { label: string; quantity: number; unit: string }) => ({
    label: dailyValue.label,
    quantity: Math.round((dailyValue.quantity / servings) * 100) / 100, // Round to 2 decimal places
    unit: dailyValue.unit
  });
  
  return {
    servingsPerContainer: servings,
    servingSize: `${servingSizeGrams}g`,
    servingSizeGrams: servingSizeGrams,
    calories: Math.round(nutritionData.calories / servings),
    
    nutrients: {
      FAT: calculatePerServingNutrient(nutritionData.totalNutrients.FAT),
      FASAT: calculatePerServingNutrient(nutritionData.totalNutrients.FASAT),
      FATRN: calculatePerServingNutrient(nutritionData.totalNutrients.FATRN),
      CHOCDF: calculatePerServingNutrient(nutritionData.totalNutrients.CHOCDF),
      FIBTG: calculatePerServingNutrient(nutritionData.totalNutrients.FIBTG),
      SUGAR: calculatePerServingNutrient(nutritionData.totalNutrients.SUGAR),
      PROCNT: calculatePerServingNutrient(nutritionData.totalNutrients.PROCNT),
      CHOLE: calculatePerServingNutrient(nutritionData.totalNutrients.CHOLE),
      NA: calculatePerServingNutrient(nutritionData.totalNutrients.NA),
      CA: calculatePerServingNutrient(nutritionData.totalNutrients.CA),
      MG: calculatePerServingNutrient(nutritionData.totalNutrients.MG),
      K: calculatePerServingNutrient(nutritionData.totalNutrients.K),
      FE: calculatePerServingNutrient(nutritionData.totalNutrients.FE),
      VITD: calculatePerServingNutrient(nutritionData.totalNutrients.VITD),
    },
    
    dailyValues: {
      FAT: calculatePerServingDailyValue(nutritionData.totalDaily.FAT),
      FASAT: calculatePerServingDailyValue(nutritionData.totalDaily.FASAT),
      CHOCDF: calculatePerServingDailyValue(nutritionData.totalDaily.CHOCDF),
      FIBTG: calculatePerServingDailyValue(nutritionData.totalDaily.FIBTG),
      PROCNT: calculatePerServingDailyValue(nutritionData.totalDaily.PROCNT),
      CHOLE: calculatePerServingDailyValue(nutritionData.totalDaily.CHOLE),
      NA: calculatePerServingDailyValue(nutritionData.totalDaily.NA),
      CA: calculatePerServingDailyValue(nutritionData.totalDaily.CA),
      MG: calculatePerServingDailyValue(nutritionData.totalDaily.MG),
      K: calculatePerServingDailyValue(nutritionData.totalDaily.K),
      FE: calculatePerServingDailyValue(nutritionData.totalDaily.FE),
      VITD: calculatePerServingDailyValue(nutritionData.totalDaily.VITD),
    }
  };
}

/**
 * Comprehensive function: Extracts and maps nutrition data from Edamam API response to FDA label format
 * Based on exact API response structure from nutritionapiresponse.json
 * @param response - The Edamam nutrition API response
 * @returns Mapped nutrition data for FDA label display with comprehensive vitamins/minerals
 */
export function mapNutritionDataToFDAFormat(response: EdamamNutritionResponse): FDANutritionData {
  const { totalNutrients, totalDaily, calories, totalWeight } = response;
  const yieldValue = response.yield || 1;
  
  // Helper function to safely extract and calculate per-serving values
  const getPerServingValue = (nutrient: any, precision: number = 1): number => {
    if (!nutrient?.quantity) return 0;
    const raw = nutrient.quantity;
    const perServing = raw / yieldValue;
    const multiplier = Math.pow(10, precision);
    return Math.round(perServing * multiplier) / multiplier;
  };
  
  // Helper function for daily value percentages
  const getDailyValuePercentage = (nutrient: any): number => {
    if (!nutrient?.quantity) return 0;
    const raw = nutrient.quantity;
    const perServing = raw / yieldValue;
    return Math.round(perServing);
  };
  
  return {
    servings: 1,
    servingSize: "1 serving",
    servingSizeGrams: Math.round((totalWeight || 0) / yieldValue),
    calories: Math.round((calories || 0) / yieldValue),
    
    // Macronutrients (per serving)
    totalFat: getPerServingValue(totalNutrients.FAT, 1),
    saturatedFat: getPerServingValue(totalNutrients.FASAT, 1),
    transFat: getPerServingValue(totalNutrients.FATRN, 1),
    monounsaturatedFat: getPerServingValue(totalNutrients.FAMS, 1),
    polyunsaturatedFat: getPerServingValue(totalNutrients.FAPU, 1),
    cholesterol: getPerServingValue(totalNutrients.CHOLE, 0),
    sodium: getPerServingValue(totalNutrients.NA, 0),
    totalCarbohydrate: getPerServingValue(totalNutrients.CHOCDF, 1),
    dietaryFiber: getPerServingValue(totalNutrients.FIBTG, 1),
    totalSugars: getPerServingValue(totalNutrients.SUGAR, 1),
    addedSugars: getPerServingValue(totalNutrients['SUGAR.added'], 1),
    sugarAlcohol: 0, // Not available in current API response
    protein: getPerServingValue(totalNutrients.PROCNT, 1),
    
    // Comprehensive Vitamins (per serving) - Based on exact API response structure
    vitaminA: getPerServingValue(totalNutrients.VITA_RAE, 0), // Vitamin A, RAE (µg)
    vitaminC: getPerServingValue(totalNutrients.VITC, 1), // Vitamin C, total ascorbic acid (mg)
    vitaminD: getPerServingValue(totalNutrients.VITD, 1), // Vitamin D (D2 + D3) (µg)
    vitaminE: getPerServingValue(totalNutrients.TOCPHA, 1), // Vitamin E (alpha-tocopherol) (mg)
    vitaminK: getPerServingValue(totalNutrients.VITK1, 1), // Vitamin K (phylloquinone) (µg)
    thiamin: getPerServingValue(totalNutrients.THIA, 2), // Thiamin (mg)
    riboflavin: getPerServingValue(totalNutrients.RIBF, 2), // Riboflavin (mg)
    niacin: getPerServingValue(totalNutrients.NIA, 1), // Niacin (mg)
    vitaminB6: getPerServingValue(totalNutrients.VITB6A, 2), // Vitamin B-6 (mg)
    folate: getPerServingValue(totalNutrients.FOLDFE, 0), // Folate, DFE (µg)
    vitaminB12: getPerServingValue(totalNutrients.VITB12, 2), // Vitamin B-12 (µg)
    pantothenicAcid: getPerServingValue(totalNutrients.PANTAC, 1), // Pantothenic acid (mg)
    
    // Comprehensive Minerals (per serving) - Based on exact API response structure
    calcium: getPerServingValue(totalNutrients.CA, 0), // Calcium, Ca (mg)
    iron: getPerServingValue(totalNutrients.FE, 1), // Iron, Fe (mg)
    potassium: getPerServingValue(totalNutrients.K, 0), // Potassium, K (mg)
    phosphorus: getPerServingValue(totalNutrients.P, 0), // Phosphorus, P (mg)
    magnesium: getPerServingValue(totalNutrients.MG, 0), // Magnesium, Mg (mg)
    zinc: getPerServingValue(totalNutrients.ZN, 1), // Zinc, Zn (mg)
    selenium: getPerServingValue(totalNutrients.SE, 1), // Selenium, Se (µg)
    copper: getPerServingValue(totalNutrients.CU, 2), // Copper, Cu (mg)
    manganese: getPerServingValue(totalNutrients.MN, 2), // Manganese, Mn (mg)
    
    // Legacy minerals (not in current API response but kept for compatibility)
    biotin: getPerServingValue(totalNutrients.BIOTC, 1),
    iodine: getPerServingValue(totalNutrients.ID, 0),
    chromium: getPerServingValue(totalNutrients.CR, 1),
    molybdenum: getPerServingValue(totalNutrients.MO, 1),
    chloride: getPerServingValue(totalNutrients.CLD, 0),
    
    // Daily Values (percentages per serving) - Based on exact API response structure
    totalFatDV: getDailyValuePercentage(totalDaily.FAT),
    saturatedFatDV: getDailyValuePercentage(totalDaily.FASAT),
    monounsaturatedFatDV: 0, // No DV established for monounsaturated fats
    polyunsaturatedFatDV: 0, // No DV established for polyunsaturated fats
    cholesterolDV: getDailyValuePercentage(totalDaily.CHOLE),
    sodiumDV: getDailyValuePercentage(totalDaily.NA),
    totalCarbohydrateDV: getDailyValuePercentage(totalDaily.CHOCDF),
    dietaryFiberDV: getDailyValuePercentage(totalDaily.FIBTG),
    addedSugarsDV: 0, // Calculate from added sugars if available
    sugarAlcoholDV: 0, // No DV established for sugar alcohols
    proteinDV: getDailyValuePercentage(totalDaily.PROCNT),
    vitaminDDV: getDailyValuePercentage(totalDaily.VITD),
    calciumDV: getDailyValuePercentage(totalDaily.CA),
    ironDV: getDailyValuePercentage(totalDaily.FE),
    potassiumDV: getDailyValuePercentage(totalDaily.K)
  };
}

/**
 * Converts PerServingNutritionData to FDANutritionData format
 */
export function mapPerServingDataToFDAFormat(perServingData: PerServingNutritionData): FDANutritionData {
  return {
    servings: perServingData.servingsPerContainer,
    servingSize: perServingData.servingSize,
    servingSizeGrams: perServingData.servingSizeGrams,
    calories: perServingData.calories,
    
    // Macronutrients
    totalFat: perServingData.nutrients.FAT.quantity,
    saturatedFat: perServingData.nutrients.FASAT.quantity,
    transFat: perServingData.nutrients.FATRN.quantity,
    monounsaturatedFat: 0, // Not available in current per-serving structure
    polyunsaturatedFat: 0, // Not available in current per-serving structure
    cholesterol: perServingData.nutrients.CHOLE.quantity,
    sodium: perServingData.nutrients.NA.quantity,
    totalCarbohydrate: perServingData.nutrients.CHOCDF.quantity,
    dietaryFiber: perServingData.nutrients.FIBTG.quantity,
    totalSugars: perServingData.nutrients.SUGAR.quantity,
    addedSugars: 0, // Not available in per-serving data
    sugarAlcohol: 0, // Not available in per-serving data
    protein: perServingData.nutrients.PROCNT.quantity,
    
    // Vitamins and Minerals
    vitaminD: perServingData.nutrients.VITD.quantity,
    calcium: perServingData.nutrients.CA.quantity,
    iron: perServingData.nutrients.FE.quantity,
    potassium: perServingData.nutrients.K.quantity,
    vitaminA: 0, // Not available in current structure
    vitaminC: 0, // Not available in current structure
    vitaminE: 0, // Not available in current structure
    vitaminK: 0, // Not available in current structure
    thiamin: 0, // Not available in current structure
    riboflavin: 0, // Not available in current structure
    niacin: 0, // Not available in current structure
    vitaminB6: 0, // Not available in current structure
    folate: 0, // Not available in current structure
    vitaminB12: 0, // Not available in current structure
    biotin: 0, // Not available in current structure
    pantothenicAcid: 0, // Not available in current structure
    phosphorus: 0, // Not available in current structure
    iodine: 0, // Not available in current structure
    magnesium: perServingData.nutrients.MG.quantity,
    zinc: 0, // Not available in current structure
    selenium: 0, // Not available in current structure
    copper: 0, // Not available in current structure
    manganese: 0, // Not available in current structure
    chromium: 0, // Not available in current structure
    molybdenum: 0, // Not available in current structure
    chloride: 0, // Not available in current structure
    
    // Daily Values (percentages)
    totalFatDV: perServingData.dailyValues.FAT.quantity,
    saturatedFatDV: perServingData.dailyValues.FASAT.quantity,
    monounsaturatedFatDV: 0, // No DV established
    polyunsaturatedFatDV: 0, // No DV established
    cholesterolDV: perServingData.dailyValues.CHOLE.quantity,
    sodiumDV: perServingData.dailyValues.NA.quantity,
    totalCarbohydrateDV: perServingData.dailyValues.CHOCDF.quantity,
    dietaryFiberDV: perServingData.dailyValues.FIBTG.quantity,
    addedSugarsDV: 0, // Not available in per-serving data
    sugarAlcoholDV: 0, // No DV established
    proteinDV: perServingData.dailyValues.PROCNT.quantity,
    vitaminDDV: perServingData.dailyValues.VITD.quantity,
    calciumDV: perServingData.dailyValues.CA.quantity,
    ironDV: perServingData.dailyValues.FE.quantity,
    potassiumDV: perServingData.dailyValues.K.quantity
  };
}

/**
 * Returns empty nutrition data structure for the new interface
 */
export function getEmptyNutritionData(): NutritionData {
  const emptyNutrient = { label: '', quantity: 0, unit: '' };
  const emptyDailyValue = { label: '', quantity: 0, unit: '%' };
  
  return {
    yield: 1,
    calories: 0,
    totalWeight: 0,
    
    totalNutrients: {
      // Macronutrients
      FAT: emptyNutrient,
      FASAT: emptyNutrient,
      FATRN: emptyNutrient,
      FAMS: emptyNutrient,
      FAPU: emptyNutrient,
      CHOCDF: emptyNutrient,
      FIBTG: emptyNutrient,
      SUGAR: emptyNutrient,
      PROCNT: emptyNutrient,
      CHOLE: emptyNutrient,
      NA: emptyNutrient,
      
      // Comprehensive Vitamins
      VITA_RAE: emptyNutrient,
      VITC: emptyNutrient,
      VITD: emptyNutrient,
      TOCPHA: emptyNutrient,
      VITK1: emptyNutrient,
      THIA: emptyNutrient,
      RIBF: emptyNutrient,
      NIA: emptyNutrient,
      VITB6A: emptyNutrient,
      FOLDFE: emptyNutrient,
      VITB12: emptyNutrient,
      PANTAC: emptyNutrient,
      
      // Comprehensive Minerals
      CA: emptyNutrient,
      FE: emptyNutrient,
      K: emptyNutrient,
      P: emptyNutrient,
      MG: emptyNutrient,
      ZN: emptyNutrient,
      SE: emptyNutrient,
      CU: emptyNutrient,
      MN: emptyNutrient,
    },
    
    totalDaily: {
      FAT: emptyDailyValue,
      FASAT: emptyDailyValue,
      CHOCDF: emptyDailyValue,
      FIBTG: emptyDailyValue,
      PROCNT: emptyDailyValue,
      CHOLE: emptyDailyValue,
      NA: emptyDailyValue,
      CA: emptyDailyValue,
      MG: emptyDailyValue,
      K: emptyDailyValue,
      FE: emptyDailyValue,
      VITD: emptyDailyValue,
    }
  };
}

/**
 * Returns empty FDA nutrition data structure for legacy compatibility
 */
export function getEmptyFDANutritionData(): FDANutritionData {
  return {
    servings: 1,
    servingSize: "1 serving",
    servingSizeGrams: 0,
    calories: 0,
    
    // Macronutrients
    totalFat: 0,
    saturatedFat: 0,
    transFat: 0,
    monounsaturatedFat: 0,
    polyunsaturatedFat: 0,
    cholesterol: 0,
    sodium: 0,
    totalCarbohydrate: 0,
    dietaryFiber: 0,
    totalSugars: 0,
    addedSugars: 0,
    sugarAlcohol: 0,
    protein: 0,
    
    // Vitamins and Minerals
    vitaminD: 0,
    calcium: 0,
    iron: 0,
    potassium: 0,
    vitaminA: 0,
    vitaminC: 0,
    vitaminE: 0,
    vitaminK: 0,
    thiamin: 0,
    riboflavin: 0,
    niacin: 0,
    vitaminB6: 0,
    folate: 0,
    vitaminB12: 0,
    biotin: 0,
    pantothenicAcid: 0,
    phosphorus: 0,
    iodine: 0,
    magnesium: 0,
    zinc: 0,
    selenium: 0,
    copper: 0,
    manganese: 0,
    chromium: 0,
    molybdenum: 0,
    chloride: 0,
    
    // Daily Values
    totalFatDV: 0,
    saturatedFatDV: 0,
    monounsaturatedFatDV: 0,
    polyunsaturatedFatDV: 0,
    cholesterolDV: 0,
    sodiumDV: 0,
    totalCarbohydrateDV: 0,
    dietaryFiberDV: 0,
    addedSugarsDV: 0,
    sugarAlcoholDV: 0,
    proteinDV: 0,
    vitaminDDV: 0,
    calciumDV: 0,
    ironDV: 0,
    potassiumDV: 0
  };
}

/**
 * Returns empty per-serving nutrition data structure
 */
export function getEmptyPerServingNutritionData(): PerServingNutritionData {
  return {
    servingsPerContainer: 1,
    servingSize: "1 serving",
    servingSizeGrams: 0,
    calories: 0,
    
    nutrients: {
      FAT: { label: "Fat", quantity: 0, unit: "g" },
      FASAT: { label: "Saturated Fat", quantity: 0, unit: "g" },
      FATRN: { label: "Trans Fat", quantity: 0, unit: "g" },
      CHOCDF: { label: "Total Carbohydrate", quantity: 0, unit: "g" },
      FIBTG: { label: "Dietary Fiber", quantity: 0, unit: "g" },
      SUGAR: { label: "Total Sugars", quantity: 0, unit: "g" },
      PROCNT: { label: "Protein", quantity: 0, unit: "g" },
      CHOLE: { label: "Cholesterol", quantity: 0, unit: "mg" },
      NA: { label: "Sodium", quantity: 0, unit: "mg" },
      CA: { label: "Calcium", quantity: 0, unit: "mg" },
      MG: { label: "Magnesium", quantity: 0, unit: "mg" },
      K: { label: "Potassium", quantity: 0, unit: "mg" },
      FE: { label: "Iron", quantity: 0, unit: "mg" },
      VITD: { label: "Vitamin D", quantity: 0, unit: "µg" },
    },
    
    dailyValues: {
      FAT: { label: "Fat", quantity: 0, unit: "%" },
      FASAT: { label: "Saturated Fat", quantity: 0, unit: "%" },
      CHOCDF: { label: "Total Carbohydrate", quantity: 0, unit: "%" },
      FIBTG: { label: "Dietary Fiber", quantity: 0, unit: "%" },
      PROCNT: { label: "Protein", quantity: 0, unit: "%" },
      CHOLE: { label: "Cholesterol", quantity: 0, unit: "%" },
      NA: { label: "Sodium", quantity: 0, unit: "%" },
      CA: { label: "Calcium", quantity: 0, unit: "%" },
      MG: { label: "Magnesium", quantity: 0, unit: "%" },
      K: { label: "Potassium", quantity: 0, unit: "%" },
      FE: { label: "Iron", quantity: 0, unit: "%" },
      VITD: { label: "Vitamin D", quantity: 0, unit: "%" },
    }
  };
}