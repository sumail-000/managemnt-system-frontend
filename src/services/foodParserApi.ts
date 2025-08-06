import api from './api';

export interface Food {
  foodId: string;
  label: string;
  knownAs: string;
  nutrients: {
    ENERC_KCAL?: number;
    PROCNT?: number;
    FAT?: number;
    CHOCDF?: number;
    FIBTG?: number;
  };
  category: string;
  categoryLabel: string;
  image: string;
}

export interface ParsedIngredient {
  food: Food;
  quantity?: number;
  measure?: {
    uri: string;
    label: string;
    weight: number;
  };
}

export interface Measure {
  uri: string;
  label: string;
  weight: number;
  qualified?: Array<{
    qualifiers: Array<{
      uri: string;
      label: string;
    }>;
    weight: number;
  }>;
}

export interface Hint {
  food: Food;
  measures: Measure[];
}

export interface ParseIngredientResponse {
  text: string;
  count: number;
  parsed: ParsedIngredient[];
  hints: Hint[];
}

export interface ParseIngredientRequest {
  ingredient: string;
}

class FoodParserApi {
  async parseIngredient(ingredient: string): Promise<ParseIngredientResponse> {
    try {
      const response = await api.post<ParseIngredientResponse>('/food/parse-ingredient', {
        ingredient
      });
      return response as unknown as ParseIngredientResponse;
    } catch (error) {
      console.error('Error parsing ingredient:', error);
      throw error;
    }
  }
}

export const foodParserApi = new FoodParserApi();