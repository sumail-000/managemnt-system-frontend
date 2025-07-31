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
  }
};