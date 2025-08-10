// Backend API service for ingredient search
// Calls backend endpoints which proxy to Edamam APIs

import { TokenManager } from '../utils/tokenManager';

// EdamamIngredient interface removed - backend now returns simple strings

export interface EdamamSearchResult {
  ingredients: string[]; // Backend now returns array of strings, not objects
  sources?: {
    recipe_count: number;
  };
  query: string;
  success: boolean;
  total?: number;
}

class EdamamDirectApi {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    this.timeout = 45000; // 45 seconds timeout for enhanced search
  }

  /**
   * Get authentication token using TokenManager
   */
  private getAuthToken(): string | null {
    const isAdminContext = TokenManager.isAdminContext();
    const { token } = TokenManager.getToken(isAdminContext);
    return token;
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }


  /**
   * Search recipes using the backend API
   * The backend will handle the actual Edamam Recipe API calls
   */
  async searchRecipes(query: string): Promise<any> {
    if (!query || query.trim().length < 2) {
      return {
        recipes: [],
        query: query.trim(),
        success: false,
        total: 0
      };
    }

    const trimmedQuery = query.trim();
    const url = `${this.baseUrl}/food/search-recipes`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          q: trimmedQuery
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from backend');
      }

      // Handle both success and error responses from backend
      if (data.success === false) {
        console.warn('Backend recipe search failed:', data.message);
        return {
          recipes: [],
          query: trimmedQuery,
          success: false,
          total: 0
        };
      }

      // Return the raw Edamam response
      return {
        ...data,
        query: trimmedQuery,
        success: true
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Recipe search request timed out');
      } else {
        console.error('Recipe search failed:', error);
      }
      
      return {
        recipes: [],
        query: trimmedQuery,
        success: false,
        total: 0
      };
    }
  }

  /**
   * Search Food Database Parser API - Parallel call to enhance search results
   * This provides additional ingredient data alongside recipe search
   */
  async searchFoodDatabase(query: string): Promise<any> {
    if (!query || query.trim().length < 2) {
      return {
        success: false,
        query: query.trim(),
        data: [],
        hints_count: 0,
        parsed_count: 0
      };
    }

    const trimmedQuery = query.trim();
    const url = `${this.baseUrl}/food/search-food-database`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          q: trimmedQuery
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from backend');
      }

      // Handle both success and error responses from backend
      if (data.success === false) {
        console.warn('Backend food database search failed:', data.message);
        return {
          success: false,
          query: trimmedQuery,
          data: [],
          hints_count: 0,
          parsed_count: 0
        };
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  /**
   * Get nutrition information for a specific ingredient
   * This calls the backend which will use Edamam Food Database API
   */
  async getNutritionInfo(ingredientName: string): Promise<any> {
    if (!ingredientName || ingredientName.trim().length < 2) {
      throw new Error('Ingredient name is required');
    }

    const url = `${this.baseUrl}/food/nutrition-info`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ingredient: ingredientName.trim()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.message || 'Failed to get nutrition information');
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }
}

export const edamamDirectApi = new EdamamDirectApi();
export default edamamDirectApi;