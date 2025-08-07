import api from './api';

export interface ProgressiveRecipeData {
  id?: string;
  name: string;
  description?: string;
  category_id?: number;
  creation_step?: string;
  ingredients_data?: any[];
  nutrition_data?: any;
  serving_configuration?: any;
  total_weight?: number;
  servings_per_container?: number;
  serving_size_grams?: number;
}

export interface RecipeProgress {
  current_step: string;
  steps_completed: {
    name_created: boolean;
    ingredients_added: boolean;
    nutrition_analyzed: boolean;
    serving_configured: boolean;
    completed: boolean;
  };
  data_available: {
    ingredients: boolean;
    nutrition: boolean;
    serving_config: boolean;
  };
  timestamps: {
    created_at: string;
    ingredients_updated_at?: string;
    nutrition_updated_at?: string;
    serving_updated_at?: string;
    updated_at: string;
  };
}

export class ProgressiveRecipeApi {
  /**
   * Step 1: Create recipe with name and basic info
   */
  static async createRecipe(data: {
    name: string;
    description?: string;
    category_id?: number;
    is_public?: boolean;
  }): Promise<{ success: boolean; data: ProgressiveRecipeData; message: string }> {
    try {
      const response = await api.post('/products', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating recipe:', error);
      throw new Error(error.response?.data?.message || 'Failed to create recipe');
    }
  }

  /**
   * Step 2: Add ingredients to recipe
   */
  static async addIngredients(
    recipeId: string,
    ingredients: any[]
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const response = await api.post(`/products/${recipeId}/ingredients`, {
        ingredients
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adding ingredients:', error);
      throw new Error(error.response?.data?.message || 'Failed to add ingredients');
    }
  }

  /**
   * Step 3: Save nutrition analysis data
   */
  static async saveNutritionData(
    recipeId: string,
    nutritionData: any,
    servingsPerContainer: number,
    perServingData?: any
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const response = await api.post(`/products/${recipeId}/nutrition`, {
        nutrition_data: nutritionData,
        servings_per_container: servingsPerContainer,
        per_serving_data: perServingData
      });
      return response.data;
    } catch (error: any) {
      console.error('Error saving nutrition data:', error);
      throw new Error(error.response?.data?.message || 'Failed to save nutrition data');
    }
  }

  /**
   * Step 4: Configure serving information
   */
  static async configureServing(
    recipeId: string,
    servingConfig: {
      mode: 'package' | 'serving';
      servings_per_container: number;
      serving_size_grams: number;
      net_weight_per_package?: number;
      servings_per_package?: number;
    }
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const response = await api.post(`/products/${recipeId}/serving`, {
        serving_configuration: servingConfig
      });
      return response.data;
    } catch (error: any) {
      console.error('Error configuring serving:', error);
      throw new Error(error.response?.data?.message || 'Failed to configure serving');
    }
  }

  /**
   * Step 5: Complete recipe creation
   */
  static async completeRecipe(
    recipeId: string,
    publish: boolean = false
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const response = await api.post(`/products/${recipeId}/complete`, {
        publish
      });
      return response.data;
    } catch (error: any) {
      console.error('Error completing recipe:', error);
      throw new Error(error.response?.data?.message || 'Failed to complete recipe');
    }
  }

  /**
   * Get recipe creation progress
   */
  static async getProgress(
    recipeId: string
  ): Promise<{ success: boolean; data: { product: ProgressiveRecipeData; progress: RecipeProgress } }> {
    try {
      const response = await api.get(`/products/${recipeId}/progress`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting progress:', error);
      throw new Error(error.response?.data?.message || 'Failed to get progress');
    }
  }

  /**
   * Update single ingredient
   */
  static async updateIngredient(
    recipeId: string,
    ingredientId: string,
    updates: {
      quantity?: number;
      unit?: string;
      waste?: number;
      grams?: number;
    }
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const response = await api.put(`/products/${recipeId}/ingredients/${ingredientId}`, updates);
      return response.data;
    } catch (error: any) {
      console.error('Error updating ingredient:', error);
      throw new Error(error.response?.data?.message || 'Failed to update ingredient');
    }
  }

  /**
   * Remove ingredient from recipe
   */
  static async removeIngredient(
    recipeId: string,
    ingredientId: string
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const response = await api.delete(`/products/${recipeId}/ingredients/${ingredientId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error removing ingredient:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove ingredient');
    }
  }

  /**
   * Get recipe details
   */
  static async getRecipe(recipeId: string): Promise<{ success: boolean; data: ProgressiveRecipeData }> {
    try {
      const response = await api.get(`/products/${recipeId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting recipe:', error);
      throw new Error(error.response?.data?.message || 'Failed to get recipe');
    }
  }

  /**
   * Update recipe basic info
   */
  static async updateRecipe(
    recipeId: string,
    updates: {
      name?: string;
      description?: string;
      category_id?: number;
      is_public?: boolean;
      status?: string;
    }
  ): Promise<{ success: boolean; data: ProgressiveRecipeData; message: string }> {
    try {
      const response = await api.put(`/products/${recipeId}`, updates);
      return response.data;
    } catch (error: any) {
      console.error('Error updating recipe:', error);
      throw new Error(error.response?.data?.message || 'Failed to update recipe');
    }
  }
}

export default ProgressiveRecipeApi;