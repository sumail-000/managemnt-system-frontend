import api from './api';

export interface CustomIngredientData {
  id?: number;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  ingredient_list?: string;
  serving_size: number;
  serving_unit: string;
  nutrition_data?: any;
  vitamins_minerals?: any;
  additional_nutrients?: any;
  allergens_data?: any;
  nutrition_notes?: string;
  is_public?: boolean;
  status?: 'active' | 'inactive';
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CustomIngredientResponse {
  success: boolean;
  message?: string;
  data?: CustomIngredientData | CustomIngredientData[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  errors?: any;
}

export class CustomIngredientApi {
  /**
   * Get all custom ingredients for the authenticated user
   */
  static async getCustomIngredients(params?: {
    search?: string;
    category?: string;
    per_page?: number;
    page?: number;
  }): Promise<CustomIngredientResponse> {
    try {
      console.log('🔄 Fetching custom ingredients:', params);
      const response = await api.get('/custom-ingredients', { params });
      console.log('📡 Custom ingredients response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching custom ingredients:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch custom ingredients');
    }
  }

  /**
   * Create a new custom ingredient
   */
  static async createCustomIngredient(data: Omit<CustomIngredientData, 'id' | 'created_at' | 'updated_at'>): Promise<CustomIngredientResponse> {
    try {
      console.log('🔄 Creating custom ingredient:', data);
      
      // Transform the data to match backend expectations
      const transformedData = {
        name: data.name,
        brand: data.brand || null,
        category: data.category || null,
        description: data.description || null,
        ingredient_list: data.ingredient_list || null,
        serving_size: data.serving_size || 100,
        serving_unit: data.serving_unit || 'g',
        nutrition_data: data.nutrition_data || null,
        vitamins_minerals: data.vitamins_minerals || null,
        additional_nutrients: data.additional_nutrients || null,
        allergens_data: data.allergens_data || null,
        nutrition_notes: data.nutrition_notes || null,
        is_public: data.is_public || false,
      };

      console.log('🔄 Transformed data for API:', transformedData);
      const response = await api.post('/custom-ingredients', transformedData);
      console.log('📡 Create custom ingredient response:', response);
      
      // The api interceptor already returns response.data, so response is the actual data
      // Check if it's wrapped in success format or direct data
      if (response && typeof response === 'object') {
        if ((response as any).success !== undefined) {
          // Already wrapped format
          return (response as unknown) as CustomIngredientResponse;
        } else {
          // Direct data format - wrap it in success format
          return {
            success: true,
            data: (response as unknown) as CustomIngredientData,
            message: 'Custom ingredient created successfully'
          };
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('❌ Error creating custom ingredient:', error);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error response status:', error.response?.status);
      console.error('❌ Error response headers:', error.response?.headers);
      console.error('❌ Error config:', error.config);
      console.error('❌ Error message:', error.message);
      
      // More detailed error handling
      if (error.response?.status === 404) {
        throw new Error('Custom ingredients API endpoint not found. Please ensure the backend routes are properly configured.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in and try again.');
      } else if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          const errorMessages = Object.values(validationErrors).flat().join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw new Error('Validation failed. Please check your input data.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred. Please try again later.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Failed to create custom ingredient');
      }
    }
  }

  /**
   * Get a specific custom ingredient by ID
   */
  static async getCustomIngredient(id: number): Promise<CustomIngredientResponse> {
    try {
      console.log('🔄 Fetching custom ingredient:', id);
      const response = await api.get(`/custom-ingredients/${id}`);
      console.log('📡 Custom ingredient response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching custom ingredient:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch custom ingredient');
    }
  }

  /**
   * Update a custom ingredient
   */
  static async updateCustomIngredient(id: number, data: Partial<CustomIngredientData>): Promise<CustomIngredientResponse> {
    try {
      console.log('🔄 Updating custom ingredient:', id, data);
      const response = await api.put(`/custom-ingredients/${id}`, data);
      console.log('📡 Update custom ingredient response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating custom ingredient:', error);
      throw new Error(error.response?.data?.message || 'Failed to update custom ingredient');
    }
  }

  /**
   * Delete a custom ingredient
   */
  static async deleteCustomIngredient(id: number): Promise<CustomIngredientResponse> {
    try {
      console.log('🔄 Deleting custom ingredient:', id);
      const response = await api.delete(`/custom-ingredients/${id}`);
      console.log('📡 Delete custom ingredient response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error deleting custom ingredient:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete custom ingredient');
    }
  }

  /**
   * Search custom ingredients (for recipe ingredient search)
   */
  static async searchCustomIngredients(query: string): Promise<CustomIngredientResponse> {
    try {
      console.log('🔄 Searching custom ingredients:', query);
      const response = await api.get('/custom-ingredients/search', { 
        params: { query } 
      });
      console.log('📡 Search custom ingredients response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error searching custom ingredients:', error);
      throw new Error(error.response?.data?.message || 'Failed to search custom ingredients');
    }
  }

  /**
   * Get custom ingredient categories
   */
  static async getCustomIngredientCategories(): Promise<CustomIngredientResponse> {
    try {
      console.log('🔄 Fetching custom ingredient categories');
      const response = await api.get('/custom-ingredients/categories');
      console.log('📡 Custom ingredient categories response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching custom ingredient categories:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  }

  /**
   * Get recipe usage count for a custom ingredient
   */
  static async getIngredientUsage(id: number): Promise<CustomIngredientResponse> {
    try {
      console.log('🔄 Fetching ingredient usage:', id);
      const response = await api.get(`/custom-ingredients/${id}/usage`);
      console.log('📡 Ingredient usage response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching ingredient usage:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch ingredient usage');
    }
  }

  /**
   * Increment usage count when ingredient is used in a recipe
   */
  static async incrementUsage(id: number): Promise<CustomIngredientResponse> {
    try {
      console.log('🔄 Incrementing ingredient usage:', id);
      const response = await api.post(`/custom-ingredients/${id}/increment-usage`);
      console.log('📡 Increment usage response:', response);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error incrementing ingredient usage:', error);
      throw new Error(error.response?.data?.message || 'Failed to increment ingredient usage');
    }
  }
}

export default CustomIngredientApi;