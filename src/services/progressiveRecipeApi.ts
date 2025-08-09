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
  ingredient_statements?: { [key: string]: string };
  allergens_data?: any;
  total_weight?: number;
  servings_per_container?: number;
  serving_size_grams?: number;
  image_url?: string;
  image_path?: string;
  status?: 'draft' | 'published';
  is_public?: boolean;
  category?: {
    id: number;
    name: string;
  };
}

export interface ProductDetailsData {
  image_url?: string;
  image_path?: string;
  category_id?: number;
}

export interface ImageUrlExtractionResponse {
  success: boolean;
  message: string;
  data: {
    image_url: string;
    original_url: string;
    processed_at: string;
  };
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
  products_count?: number;
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: Category[];
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  data: Category;
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
  ): Promise<any> {
    try {
      const response = await api.post(`/products/${recipeId}/ingredients`, {
        ingredients
      });
      // The base API service returns response.data, which contains the backend response
      return response;
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
  ): Promise<any> {
    try {
      const response = await api.post(`/products/${recipeId}/nutrition`, {
        nutrition_data: nutritionData,
        servings_per_container: servingsPerContainer,
        per_serving_data: perServingData
      });
      // Base API service already extracts response.data, so return response directly
      return response;
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
    isPublic: boolean = false,
    status: 'draft' | 'published' = 'draft'
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      const response = await api.post(`/products/${recipeId}/complete`, {
        is_public: isPublic,
        status: status,
        publish: status === 'published' // Keep backward compatibility
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
      // The api service unwraps the response, so response is the actual data
      // We need to check if it's already unwrapped or still wrapped
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        // Response is still wrapped
        return response as { success: boolean; data: ProgressiveRecipeData };
      } else {
        // Response is unwrapped, wrap it
        return {
          success: true,
          data: response as unknown as ProgressiveRecipeData
        };
      }
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

  /**
   * Step 1.5: Save product details (image and category)
   */
  static async saveProductDetails(
    recipeId: string,
    details: ProductDetailsData
  ): Promise<{ success: boolean; data: ProgressiveRecipeData; message: string }> {
    try {
      const response = await api.post(`/products/${recipeId}/details`, details);
      return response.data;
    } catch (error: any) {
      console.error('Error saving product details:', error);
      throw new Error(error.response?.data?.message || 'Failed to save product details');
    }
  }

  /**
   * Extract image URL from web URL
   */
  static async extractImageUrl(url: string): Promise<ImageUrlExtractionResponse> {
    try {
      console.log('🔄 Extracting image URL:', url);
      const response = await api.post('/products/extract-image-url', { url });
      console.log('📡 Image extraction API response:', response);
      
      // Handle both wrapped and unwrapped responses
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        // Response is wrapped: {success: true, data: {...}}
        console.log('✅ Image URL extracted (wrapped):', response.data);
        return response as unknown as ImageUrlExtractionResponse;
      } else if (response && typeof response === 'object' && 'image_url' in response) {
        // Response is unwrapped: {image_url: '...', original_url: '...', processed_at: '...'}
        console.log('✅ Image URL extracted (unwrapped):', response);
        return {
          success: true,
          message: 'Image URL processed successfully',
          data: response as any
        };
      } else {
        console.error('❌ Unexpected image extraction response format:', response);
        throw new Error('Invalid response format from image extraction');
      }
    } catch (error: any) {
      console.error('❌ Error extracting image URL:', error);
      throw new Error(error.response?.data?.message || 'Failed to extract image URL');
    }
  }

  /**
   * Get all categories for the user
   */
  static async getCategories(): Promise<CategoriesResponse> {
    try {
      console.log('🔄 Fetching categories from API...');
      const response = await api.get('/products/categories/list');
      console.log('📡 Categories API response:', response);
      
      // Handle both wrapped and unwrapped responses
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        // Response is wrapped: {success: true, data: [...]}
        console.log('✅ Categories loaded (wrapped):', response.data);
        return response as unknown as CategoriesResponse;
      } else if (Array.isArray(response)) {
        // Response is unwrapped: [...]
        console.log('✅ Categories loaded (unwrapped):', response);
        return {
          success: true,
          message: 'Categories retrieved successfully',
          data: response as Category[]
        };
      } else {
        console.error('❌ Unexpected response format:', response);
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('❌ Error getting categories:', error);
      throw new Error(error.response?.data?.message || 'Failed to get categories');
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(name: string): Promise<CategoryResponse> {
    try {
      console.log('🔄 Creating category with data:', { name });
      console.log('🔄 Request payload:', JSON.stringify({ name }));
      
      const response = await api.post('/categories', { name });
      console.log('✅ Category creation successful:', response);
      
      // Handle both wrapped and unwrapped responses
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        // Response is wrapped: {success: true, data: {...}}
        console.log('✅ Category created (wrapped):', response.data);
        return response as unknown as CategoryResponse;
      } else if (response && typeof response === 'object' && 'id' in response && 'name' in response) {
        // Response is unwrapped: {id: 1, name: '...', ...}
        console.log('✅ Category created (unwrapped):', response);
        return {
          success: true,
          message: 'Category created successfully',
          data: response as unknown as Category
        };
      } else {
        console.error('❌ Unexpected category creation response format:', response);
        throw new Error('Invalid response format from category creation');
      }
    } catch (error: any) {
      console.error('❌ Error creating category:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error response status:', error.response?.status);
      console.error('❌ Error response headers:', error.response?.headers);
      
      // Extract detailed error information
      const errorData = error.response?.data;
      let errorMessage = 'Failed to create category';
      
      if (errorData) {
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.errors) {
          console.error('❌ Validation errors:', errorData.errors);
          // If there are specific field errors, show them
          if (errorData.errors.name && Array.isArray(errorData.errors.name)) {
            errorMessage = errorData.errors.name[0];
          }
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Search categories
   */
  static async searchCategories(query: string): Promise<CategoriesResponse> {
    try {
      const response = await api.get('/categories/search', { params: { query } });
      return response.data;
    } catch (error: any) {
      console.error('Error searching categories:', error);
      throw new Error(error.response?.data?.message || 'Failed to search categories');
    }
  }

  /**
   * Upload image file for a product
   */
  static async uploadImage(recipeId: string, file: File): Promise<ImageUrlExtractionResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(`/products/${recipeId}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Handle both wrapped and unwrapped responses
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        return response as unknown as ImageUrlExtractionResponse;
      } else if (response && typeof response === 'object' && 'image_path' in response) {
        return {
          success: true,
          message: 'Image uploaded successfully',
          data: response as any
        };
      } else {
        throw new Error('Invalid response format from image upload');
      }
    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload image');
    }
  }

  /**
   * Save ingredient statements for custom ingredient display
   */
  static async saveIngredientStatements(
    recipeId: string,
    statements: { [key: string]: string }
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      console.log('🔄 Saving ingredient statements:', { recipeId, statements });
      const response = await api.post(`/products/${recipeId}/ingredient-statements`, {
        ingredient_statements: statements
      });
      
      // Handle both wrapped and unwrapped responses
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        return response as unknown as { success: boolean; data: any; message: string };
      } else {
        // Response is unwrapped, wrap it
        return {
          success: true,
          data: response,
          message: 'Ingredient statements saved successfully'
        };
      }
    } catch (error: any) {
      console.error('❌ Error saving ingredient statements:', error);
      throw new Error(error.response?.data?.message || 'Failed to save ingredient statements');
    }
  }

  /**
   * Save allergens data for a product
   */
  static async saveAllergens(
    recipeId: string,
    allergensData: any
  ): Promise<{ success: boolean; data: any; message: string }> {
    try {
      console.log('🔄 Saving allergens data:', { recipeId, allergensData });
      
      // Transform the allergens data to match backend validation rules
      const transformedData = {
        detected: [] as any[],
        manual: [] as any[],
        statement: allergensData.statement,
        displayOnLabel: allergensData.displayOnLabel
      };
      
      // Transform detected allergens from category-based structure to flat array
      Object.entries(allergensData.detected || {}).forEach(([categoryId, allergens]: [string, any]) => {
        // Ensure allergens is an array before calling forEach
        if (Array.isArray(allergens)) {
          allergens.forEach(allergen => {
            transformedData.detected.push({
              name: allergen.name,
              source: allergen.source,
              confidence: allergen.confidence,
              details: allergen.details
            });
          });
        }
      });
      
      // Transform manual allergens from category-based structure to flat array
      Object.entries(allergensData.manual || {}).forEach(([categoryId, allergens]: [string, any]) => {
        // Ensure allergens is an array before calling forEach
        if (Array.isArray(allergens)) {
          allergens.forEach(allergen => {
            transformedData.manual.push({
              category: categoryId,
              subcategory: allergen.name,
              name: allergen.name,
              customName: allergen.customName || null
            });
          });
        }
      });
      
      console.log('🔄 Transformed allergens data:', transformedData);
      const response = await api.post(`/products/${recipeId}/allergens`, transformedData);
      
      // Handle both wrapped and unwrapped responses
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        return response as unknown as { success: boolean; data: any; message: string };
      } else {
        // Response is unwrapped, wrap it
        return {
          success: true,
          data: response,
          message: 'Allergens data saved successfully'
        };
      }
    } catch (error: any) {
      console.error('❌ Error saving allergens data:', error);
      throw new Error(error.response?.data?.message || 'Failed to save allergens data');
    }
  }

  /**
   * Clear all ingredients and nutrition data from a recipe
   */
  static async clearAllIngredients(
    recipeId: string
  ): Promise<{ success: boolean; data: ProgressiveRecipeData; message: string }> {
    try {
      console.log('🔄 Clearing all ingredients and nutrition data:', recipeId);
      const response = await api.post(`/products/${recipeId}/clear-ingredients`);
      
      // Handle both wrapped and unwrapped responses
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        return response as unknown as { success: boolean; data: ProgressiveRecipeData; message: string };
      } else {
        // Response is unwrapped, wrap it
        return {
          success: true,
          data: response as unknown as ProgressiveRecipeData,
          message: 'All ingredients and nutrition data cleared successfully'
        };
      }
    } catch (error: any) {
      console.error('❌ Error clearing ingredients:', error);
      throw new Error(error.response?.data?.message || 'Failed to clear ingredients');
    }
  }
}

export default ProgressiveRecipeApi;