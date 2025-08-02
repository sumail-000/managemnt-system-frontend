// Dynamic Nutrition Types - Based on Edamam API Response Structure
// This file contains TypeScript interfaces that match the actual API response format
// ensuring data integrity and dynamic handling of nutritional analysis data

// Core nutrient structure from Edamam API
export interface Nutrient {
  label: string;
  quantity: number;
  unit: string;
  percentage?: number;
}

// Daily value structure for nutrients
export interface DailyValue {
  label: string;
  quantity: number;
  unit: string;
}

// High nutrient structure with level classification
export interface HighNutrient {
  nutrient: string;
  label: string;
  percentage: number;
  level: 'very_high' | 'high' | 'moderate';
}

// Macronutrient summary structure
export interface MacronutrientSummary {
  protein?: {
    grams: number;
    calories: number;
    percentage: number;
  };
  carbs?: {
    grams: number;
    calories: number;
    percentage: number;
  };
  fat?: {
    grams: number;
    calories: number;
    percentage: number;
  };
}

// Nutrition summary structure from API - complete structure
export interface NutritionSummary {
  calories: number;
  caloriesPerGram: number; // Missing field from API
  macronutrients: MacronutrientSummary;
  fiber: number;
  sodium: number;
  sugar: number;
  [key: string]: any; // Allow for additional dynamic fields
}

// Analysis metadata structure - matches actual API response
export interface AnalysisMetadata {
  analyzedAt: string;
  source: string;
  version: string;
}

// Warning structure for nutritional warnings
export interface NutritionWarning {
  type: 'warning' | 'error' | 'info';
  message: string;
  severity: 'low' | 'medium' | 'high';
  nutrient?: string;
}

// Main nutrition data interface - matches the actual API response structure exactly
export interface NutritionData {
  // Basic nutrition information
  calories: number;
  totalWeight: number;
  servings?: number;
  weightPerServing?: number;
  
  // Labels and classifications
  dietLabels: string[];
  healthLabels: string[];
  cautions: string[];
  
  // Detailed nutrient breakdown - dynamic structure
  totalNutrients: Record<string, Nutrient>;
  
  // Daily values - dynamic structure
  totalDaily: Record<string, DailyValue>;
  
  // Additional API fields for complete data integrity
  ingredients: any[]; // Ingredients array from API
  totalNutrientsKCal: any[]; // Calorie breakdown by nutrient
  co2EmissionsClass: string | null; // Environmental data
  totalCO2Emissions: number | null; // CO2 emissions data
  
  // High nutrients array
  highNutrients: HighNutrient[];
  
  // Organized nutrition summary
  nutritionSummary: NutritionSummary;
  
  // Analysis metadata
  analysisMetadata: AnalysisMetadata;
  
  // Optional warnings and allergens
  warnings?: NutritionWarning[];
  allergens?: string[];
  
  // Additional dynamic fields that might come from API
  [key: string]: any;
}

// Meta information structure from API response
export interface ApiMeta {
  cached: boolean;
  timestamp: string;
  request_id: string;
}

// API Response wrapper structure - matches actual API response
export interface NutritionAnalysisResponse {
  success: boolean;
  data: NutritionData;
  meta: ApiMeta; // Critical meta information for audit trails
  message?: string;
  error?: string;
}

// Helper interfaces for component props
export interface NutritionDisplayProps {
  nutritionData: NutritionData;
  showDetailed?: boolean;
  compact?: boolean;
}

// Nutrient category groupings for display
export interface NutrientCategory {
  name: string;
  nutrients: string[]; // Nutrient keys
  color?: string;
  icon?: string;
}

// Predefined nutrient categories based on common Edamam response keys
export const NUTRIENT_CATEGORIES: NutrientCategory[] = [
  {
    name: 'Macronutrients',
    nutrients: ['ENERC_KCAL', 'PROCNT', 'FAT', 'CHOCDF', 'CHOCDF.net', 'FIBTG'],
    color: 'blue',
    icon: 'activity'
  },
  {
    name: 'Vitamins',
    nutrients: [
      'VITA_RAE', 'VITC', 'VITD', 'TOCPHA', 'VITK1', 
      'THIA', 'RIBF', 'NIA', 'VITB6A', 
      'FOLDFE', 'FOLFD', 'FOLAC', 'VITB12',
      'PANTAC', 'BIOTIN'
    ],
    color: 'green',
    icon: 'heart'
  },
  {
    name: 'Minerals',
    nutrients: [
      'CA', 'FE', 'MG', 'P', 'K', 'NA', 'ZN', 
      'CU', 'MN', 'SE', 'CR', 'MO', 'CL'
    ],
    color: 'purple',
    icon: 'shield'
  },
  {
    name: 'Fats',
    nutrients: ['FASAT', 'FAMS', 'FAPU', 'FATRN', 'CHOLE'],
    color: 'yellow',
    icon: 'droplet'
  },
  {
    name: 'Carbohydrates',
    nutrients: [
      'SUGAR', 'SUGAR.added', 'STARCH', 
      'GLUS', 'FRUS', 'GALS', 'LACS', 'MALS', 'SUCS'
    ],
    color: 'orange',
    icon: 'zap'
  },
  {
    name: 'Other',
    nutrients: ['WATER', 'ALC', 'CAFFN'],
    color: 'gray',
    icon: 'droplets'
  }
];

// Utility type for nutrient keys commonly found in Edamam responses
export type CommonNutrientKey = 
  // Macronutrients
  | 'ENERC_KCAL'   // Energy (calories)
  | 'PROCNT'       // Protein
  | 'FAT'          // Total Fat
  | 'CHOCDF'       // Carbohydrates
  | 'CHOCDF.net'   // Net Carbohydrates
  | 'FIBTG'        // Fiber
  
  // Vitamins
  | 'VITA_RAE'     // Vitamin A
  | 'VITC'         // Vitamin C
  | 'VITD'         // Vitamin D
  | 'TOCPHA'       // Vitamin E (alpha-tocopherol)
  | 'VITK1'        // Vitamin K
  | 'THIA'         // Thiamin (B1)
  | 'RIBF'         // Riboflavin (B2)
  | 'NIA'          // Niacin (B3)
  | 'VITB6A'       // Vitamin B6
  | 'FOLDFE'       // Folate DFE
  | 'FOLFD'        // Folate (food)
  | 'FOLAC'        // Folic acid
  | 'VITB12'       // Vitamin B12
  | 'PANTAC'       // Pantothenic acid (B5)
  | 'BIOTIN'       // Biotin (B7)
  
  // Minerals
  | 'CA'           // Calcium
  | 'FE'           // Iron
  | 'MG'           // Magnesium
  | 'P'            // Phosphorus
  | 'K'            // Potassium
  | 'NA'           // Sodium
  | 'ZN'           // Zinc
  | 'CU'           // Copper
  | 'MN'           // Manganese
  | 'SE'           // Selenium
  | 'CR'           // Chromium
  | 'MO'           // Molybdenum
  | 'CL'           // Chloride
  
  // Fats
  | 'FASAT'        // Saturated Fat
  | 'FAMS'         // Monounsaturated Fat
  | 'FAPU'         // Polyunsaturated Fat
  | 'FATRN'        // Trans Fat
  | 'CHOLE'        // Cholesterol
  
  // Carbohydrates
  | 'SUGAR'        // Sugar
  | 'SUGAR.added'  // Added Sugar
  | 'STARCH'       // Starch
  | 'GLUS'         // Glucose
  | 'FRUS'         // Fructose
  | 'GALS'         // Galactose
  | 'LACS'         // Lactose
  | 'MALS'         // Maltose
  | 'SUCS'         // Sucrose
  
  // Other
  | 'WATER'        // Water
  | 'ALC'          // Alcohol
  | 'CAFFN';       // Caffeine

// Helper function type for nutrient lookup
export type NutrientLookupFunction = (nutrients: Record<string, Nutrient>, key: string) => Nutrient | undefined;

// Export utility functions for working with nutrition data
export const nutritionUtils = {
  // Get nutrient by key with fallback
  getNutrient: (nutrients: Record<string, Nutrient>, key: string): Nutrient | null => {
    return nutrients[key] || null;
  },
  
  // Format nutrient value for display
  formatNutrientValue: (nutrient: Nutrient | null, decimals: number = 1): string => {
    if (!nutrient) return 'N/A';
    return `${Number(nutrient.quantity.toFixed(decimals))}${nutrient.unit}`;
  },
  
  // Get daily value percentage
  getDailyValuePercentage: (dailyValues: Record<string, DailyValue>, key: string): number => {
    const dailyValue = dailyValues[key];
    return dailyValue ? Math.round(dailyValue.quantity) : 0;
  },
  
  // Check if nutrient is high
  isHighNutrient: (highNutrients: HighNutrient[], nutrientKey: string): HighNutrient | null => {
    return highNutrients.find(hn => hn.nutrient === nutrientKey) || null;
  },
  
  // Get nutrient category
  getNutrientCategory: (nutrientKey: string): NutrientCategory | null => {
    return NUTRIENT_CATEGORIES.find(category => 
      category.nutrients.includes(nutrientKey)
    ) || null;
  },

  // NEW: Transform saved nutrition data from database to NutritionData format
  transformSavedNutritionData: (savedData: any): NutritionData | null => {
    if (!savedData || typeof savedData !== 'object') {
      console.warn('⚠️ Invalid saved nutrition data provided');
      return null;
    }

    try {
      console.log('🔄 Transforming saved nutrition data:', savedData);
      
      // Handle different possible data structures
      const data = savedData.data || savedData;
      
      const transformedData: NutritionData = {
        // Basic nutrition info
        calories: data.calories || data.ENERC_KCAL?.quantity || 0,
        totalWeight: data.totalWeight || data.weight || 0,
        servings: data.servings || 1,
        weightPerServing: data.weightPerServing || data.weight_per_serving || 0,
        
        // Labels
        dietLabels: Array.isArray(data.dietLabels) ? data.dietLabels : 
                   Array.isArray(data.diet_labels) ? data.diet_labels : [],
        healthLabels: Array.isArray(data.healthLabels) ? data.healthLabels : 
                     Array.isArray(data.health_labels) ? data.health_labels : [],
        cautions: Array.isArray(data.cautions) ? data.cautions : 
                 Array.isArray(data.caution_labels) ? data.caution_labels : [],
        
        // Nutrients - handle both API format and saved format
        totalNutrients: data.totalNutrients || data.total_nutrients || 
                       data.basic_nutrition || data.micronutrients || {},
        totalDaily: data.totalDaily || data.total_daily || data.daily_values || {},
        
        // Additional data
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        totalNutrientsKCal: Array.isArray(data.totalNutrientsKCal) ? data.totalNutrientsKCal : [],
        co2EmissionsClass: data.co2EmissionsClass || data.co2_emissions_class || null,
        totalCO2Emissions: data.totalCO2Emissions || data.total_co2_emissions || null,
        
        // High nutrients
        highNutrients: Array.isArray(data.highNutrients) ? data.highNutrients : 
                      Array.isArray(data.high_nutrients) ? data.high_nutrients : [],
        
        // Nutrition summary - handle macronutrients field
        nutritionSummary: data.nutritionSummary || data.nutrition_summary || {
          calories: data.calories || 0,
          caloriesPerGram: data.caloriesPerGram || 0,
          macronutrients: data.macronutrients || {},
          fiber: data.fiber || 0,
          sodium: data.sodium || 0,
          sugar: data.sugar || 0
        },
        
        // Analysis metadata
        analysisMetadata: data.analysisMetadata || data.analysis_metadata || {
          analyzedAt: data.analyzedAt || new Date().toISOString(),
          source: data.source || 'database',
          version: data.version || '1.0'
        },
        
        // Optional warnings and allergens
        warnings: Array.isArray(data.warnings) ? data.warnings : [],
        allergens: Array.isArray(data.allergens) ? data.allergens : []
      };

      console.log('✅ Successfully transformed saved nutrition data:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('❌ Error transforming saved nutrition data:', error);
      return null;
    }
  },

  // NEW: Process ingredients data from database
  processIngredientsData: (ingredientsData: any): { ingredients: any[], nutritionData: NutritionData | null } => {
    if (!ingredientsData) {
      return { ingredients: [], nutritionData: null };
    }

    try {
      // Parse JSON if it's a string
      const data = typeof ingredientsData === 'string' ? JSON.parse(ingredientsData) : ingredientsData;
      
      console.log('🔍 Processing ingredients data structure:', data);
      
      // Check if this is the ingredients_data array from database
      if (Array.isArray(data)) {
        // Extract ingredients from the ingredients_data array
        const ingredients = data.map((item, index) => ({
          id: `ingredient-${index}`,
          text: item.name || item.text || '',
          image: item.image_url,
          foodCategory: item.food_category,
          isMainIngredient: item.is_main_ingredient,
          quantity: item.quantity,
          measure: item.measure,
          weight: item.weight
        })).filter(ingredient => ingredient.text.trim() !== '');
        
        // Look for nutrition data in the first ingredient entry
        let nutritionData = null;
        const firstIngredient = data[0];
        if (firstIngredient && firstIngredient.nutrition_data) {
          nutritionData = nutritionUtils.transformSavedNutritionData(firstIngredient.nutrition_data);
        }
        
        console.log('✅ Processed ingredients data:', { 
          ingredientsCount: ingredients.length, 
          hasNutritionData: !!nutritionData 
        });
        
        return { ingredients, nutritionData };
      } else {
        // Fallback: treat as legacy nutrition data structure
        const nutritionData = nutritionUtils.transformSavedNutritionData(data);
        const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
        
        console.log('✅ Processed legacy nutrition data:', { 
          ingredientsCount: ingredients.length, 
          hasNutritionData: !!nutritionData 
        });
        
        return { ingredients, nutritionData };
      }
    } catch (error) {
      console.error('❌ Error processing ingredients data:', error);
      return { ingredients: [], nutritionData: null };
    }
  },

  // NEW: Validate nutrition data structure
  validateNutritionData: (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    
    // Check for essential fields
    const hasEssentialFields = 
      typeof data.calories === 'number' &&
      data.totalNutrients &&
      typeof data.totalNutrients === 'object';
    
    return hasEssentialFields;
  },

  // NEW: Create empty nutrition data structure
  createEmptyNutritionData: (): NutritionData => {
    return {
      calories: 0,
      totalWeight: 0,
      servings: 1,
      weightPerServing: 0,
      dietLabels: [],
      healthLabels: [],
      cautions: [],
      totalNutrients: {},
      totalDaily: {},
      ingredients: [],
      totalNutrientsKCal: [],
      co2EmissionsClass: null,
      totalCO2Emissions: null,
      highNutrients: [],
      nutritionSummary: {
        calories: 0,
        caloriesPerGram: 0,
        macronutrients: {},
        fiber: 0,
        sodium: 0,
        sugar: 0
      },
      analysisMetadata: {
        analyzedAt: new Date().toISOString(),
        source: 'empty',
        version: '1.0'
      },
      warnings: [],
      allergens: []
    };
  }
};