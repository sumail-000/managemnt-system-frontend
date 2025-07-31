import axios from 'axios';
import { Ingredient } from '@/types/ingredient';

const API_BASE_URL = '/api/ingredients';

export interface CreateIngredientRequest {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface UpdateIngredientRequest {
  name?: string;
  quantity?: number;
  unit?: string;
  notes?: string;
}

export interface ReorderIngredientsRequest {
  ingredientIds: string[];
}

export interface EdamamAnalysisResponse {
  tags: string[];
  allergens: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
  };
}

class IngredientApiService {
  async getAllIngredients(): Promise<Ingredient[]> {
    try {
      const response = await axios.get<Ingredient[]>(API_BASE_URL);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
      throw new Error('Failed to fetch ingredients');
    }
  }

  async createIngredient(data: CreateIngredientRequest): Promise<Ingredient> {
    try {
      // First, analyze the ingredient for auto-tagging
      const analysis = await this.analyzeIngredient(data.name);
      
      const response = await axios.post<Ingredient>(API_BASE_URL, {
        ...data,
        tags: analysis.tags,
        allergens: analysis.allergens,
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to create ingredient:', error);
      throw new Error('Failed to create ingredient');
    }
  }

  async updateIngredient(id: string, data: UpdateIngredientRequest): Promise<Ingredient> {
    try {
      const response = await axios.put<Ingredient>(`${API_BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update ingredient:', error);
      throw new Error('Failed to update ingredient');
    }
  }

  async deleteIngredient(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      throw new Error('Failed to delete ingredient');
    }
  }

  async reorderIngredients(data: ReorderIngredientsRequest): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/reorder`, data);
    } catch (error) {
      console.error('Failed to reorder ingredients:', error);
      throw new Error('Failed to reorder ingredients');
    }
  }

  async analyzeIngredient(ingredientName: string): Promise<EdamamAnalysisResponse> {
    try {
      const response = await axios.post<EdamamAnalysisResponse>(`${API_BASE_URL}/analyze`, {
        ingredient: ingredientName,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to analyze ingredient:', error);
      // Fallback to mock data if API fails
      return this.getMockAnalysis(ingredientName);
    }
  }

  private getMockAnalysis(ingredientName: string): EdamamAnalysisResponse {
    // Mock analysis based on common ingredient patterns
    const name = ingredientName.toLowerCase();
    const tags: string[] = [];
    const allergens: string[] = [];

    // Common allergen patterns
    if (name.includes('wheat') || name.includes('flour')) {
      allergens.push('gluten');
    }
    if (name.includes('milk') || name.includes('dairy') || name.includes('cheese')) {
      allergens.push('dairy');
    }
    if (name.includes('egg')) {
      allergens.push('eggs');
    }
    if (name.includes('peanut') || name.includes('almond') || name.includes('walnut')) {
      allergens.push('nuts');
    }
    if (name.includes('soy')) {
      allergens.push('soy');
    }
    if (name.includes('fish') || name.includes('salmon') || name.includes('tuna')) {
      allergens.push('fish');
    }
    if (name.includes('shrimp') || name.includes('crab') || name.includes('lobster')) {
      allergens.push('shellfish');
    }

    // Common dietary tags
    if (name.includes('organic')) {
      tags.push('organic');
    }
    if (name.includes('sugar-free') || name.includes('sugarfree')) {
      tags.push('sugar-free');
    }
    if (name.includes('fat-free') || name.includes('fatfree')) {
      tags.push('fat-free');
    }
    if (name.includes('low-sodium')) {
      tags.push('low-sodium');
    }
    if (name.includes('vegan')) {
      tags.push('vegan');
    }
    if (name.includes('vegetarian')) {
      tags.push('vegetarian');
    }
    if (!allergens.includes('gluten')) {
      tags.push('gluten-free');
    }

    return { tags, allergens };
  }



  async exportIngredients(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await axios.get(`${API_BASE_URL}/export`, {
        params: { format },
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to export ingredients:', error);
      throw new Error('Failed to export ingredients');
    }
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    try {
      const response = await axios.get<Ingredient[]>(`${API_BASE_URL}/search`, {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search ingredients:', error);
      throw new Error('Failed to search ingredients');
    }
  }
}

export const ingredientApi = new IngredientApiService();