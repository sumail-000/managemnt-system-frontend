import api from './api';

// Edamam API response structure
export interface EdamamNutrient {
  label: string;
  quantity: number;
  unit: string;
}

export interface EdamamNutritionResponse {
  uri: string;
  yield: number;
  calories: number;
  totalWeight: number;
  totalNutrients: Record<string, EdamamNutrient>;
  totalDaily: Record<string, EdamamNutrient>;
  dietLabels?: string[];
  healthLabels?: string[];
  cautions?: string[];
  ingredients?: any[];
}

// Legacy interface for backward compatibility
export interface NutritionData {
  success: boolean;
  data: {
    calories: number;
    totalWeight: number;
    nutrients: {
      totalFat: { quantity: number; unit: string };
      saturatedFat: { quantity: number; unit: string };
      transFat: { quantity: number; unit: string };
      cholesterol: { quantity: number; unit: string };
      sodium: { quantity: number; unit: string };
      totalCarbohydrate: { quantity: number; unit: string };
      dietaryFiber: { quantity: number; unit: string };
      totalSugars: { quantity: number; unit: string };
      addedSugars: { quantity: number; unit: string };
      protein: { quantity: number; unit: string };
      vitaminD: { quantity: number; unit: string };
      calcium: { quantity: number; unit: string };
      iron: { quantity: number; unit: string };
      potassium: { quantity: number; unit: string };
    };
    dailyValues: {
      totalFat: { quantity: number; unit: string };
      saturatedFat: { quantity: number; unit: string };
      cholesterol: { quantity: number; unit: string };
      sodium: { quantity: number; unit: string };
      totalCarbohydrate: { quantity: number; unit: string };
      dietaryFiber: { quantity: number; unit: string };
      protein: { quantity: number; unit: string };
      vitaminD: { quantity: number; unit: string };
      calcium: { quantity: number; unit: string };
      iron: { quantity: number; unit: string };
      potassium: { quantity: number; unit: string };
    };
  };
}

export interface NutritionAnalysisRequest {
  ingredients: string[];
  title?: string;
}

export class NutritionApi {
  /**
   * Analyze nutrition for a list of ingredients
   * @param ingredients Array of ingredient strings (e.g., ["1 cup tomatoes", "2 tbsp olive oil"])
   * @param title Optional title for the recipe
   * @returns Promise<{data: EdamamNutritionResponse}>
   */
  static async analyzeNutrition(ingredients: string[], title: string = 'Custom Recipe'): Promise<{data: EdamamNutritionResponse}> {
    try {
      const response = await api.post('/nutrition/analyze', {
        ingredients,
        title
      });
      
      console.log('🔍 Raw API Response:', response);
      console.log('📊 Response Data:', response.data);
      console.log('🧪 Response Data Type:', typeof response.data);
      console.log('🔑 Response Data Keys:', response.data ? Object.keys(response.data) : 'No data');
      
      // The backend returns the raw Edamam response directly in response.data
      // But if response.data is undefined, the data might be at the root level
      const nutritionData = response.data || response;
      
      console.log('🔍 Nutrition Data:', nutritionData);
      console.log('🔑 Nutrition Data Keys:', nutritionData ? Object.keys(nutritionData) : 'No nutrition data');
      
      // Check if we have the essential nutrition data fields
      if (!nutritionData || !nutritionData.totalNutrients || !nutritionData.totalDaily) {
        console.error('❌ Invalid nutrition data structure:', nutritionData);
        throw new Error('No nutrition data received from API');
      }
      
      console.log('✅ Valid nutrition data received');
      return { data: nutritionData };
    } catch (error: any) {
      console.error('Nutrition analysis failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to analyze nutrition');
    }
  }

  /**
   * Build ingredient string for nutrition analysis
   * @param quantity Quantity of the ingredient
   * @param unit Unit of measurement
   * @param name Name of the ingredient
   * @returns Formatted ingredient string
   */
  static buildIngredientString(quantity: number, unit: string, name: string): string {
    return `${quantity} ${unit} ${name}`;
  }

  /**
   * Get default empty nutrition data
   * @returns Empty nutrition data structure
   */
  static getEmptyNutritionData(): NutritionData {
    return {
      success: true,
      data: {
        calories: 0,
        totalWeight: 0,
        nutrients: {
          totalFat: { quantity: 0, unit: 'g' },
          saturatedFat: { quantity: 0, unit: 'g' },
          transFat: { quantity: 0, unit: 'g' },
          cholesterol: { quantity: 0, unit: 'mg' },
          sodium: { quantity: 0, unit: 'mg' },
          totalCarbohydrate: { quantity: 0, unit: 'g' },
          dietaryFiber: { quantity: 0, unit: 'g' },
          totalSugars: { quantity: 0, unit: 'g' },
          addedSugars: { quantity: 0, unit: 'g' },
          protein: { quantity: 0, unit: 'g' },
          vitaminD: { quantity: 0, unit: 'mcg' },
          calcium: { quantity: 0, unit: 'mg' },
          iron: { quantity: 0, unit: 'mg' },
          potassium: { quantity: 0, unit: 'mg' }
        },
        dailyValues: {
          totalFat: { quantity: 0, unit: '%' },
          saturatedFat: { quantity: 0, unit: '%' },
          cholesterol: { quantity: 0, unit: '%' },
          sodium: { quantity: 0, unit: '%' },
          totalCarbohydrate: { quantity: 0, unit: '%' },
          dietaryFiber: { quantity: 0, unit: '%' },
          protein: { quantity: 0, unit: '%' },
          vitaminD: { quantity: 0, unit: '%' },
          calcium: { quantity: 0, unit: '%' },
          iron: { quantity: 0, unit: '%' },
          potassium: { quantity: 0, unit: '%' }
        }
      }
    };
  }
}

export default NutritionApi;