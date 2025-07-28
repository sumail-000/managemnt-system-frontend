// Recipe API Types - matching backend EdamamRecipeService response format

export interface RecipeIngredient {
  text: string;
  quantity: number;
  measure: string | null;
  food: string;
  weight: number;
  foodCategory: string | null;
  foodId: string | null;
  image: string | null;
}

export interface RecipeNutrient {
  label: string;
  quantity: number;
  unit: string;
}

export interface RecipeDigestItem {
  label: string;
  tag: string;
  schemaOrgTag: string | null;
  total: number;
  hasRDI: boolean;
  daily: number;
  unit: string;
  sub: RecipeDigestItem[];
}

export interface RecipeImages {
  THUMBNAIL?: { url: string; width: number; height: number };
  SMALL?: { url: string; width: number; height: number };
  REGULAR?: { url: string; width: number; height: number };
  LARGE?: { url: string; width: number; height: number };
}

// Main Recipe interface matching backend formatRecipe response
export interface EdamamRecipe {
  uri: string | null;
  label: string;
  image: string | null;
  images: RecipeImages;
  source: string;
  url: string;
  shareAs: string;
  yield: number;
  dietLabels: string[];
  healthLabels: string[];
  cautions: string[];
  ingredientLines: string[];
  ingredients: RecipeIngredient[];
  calories: number;
  totalCO2Emissions: number;
  co2EmissionsClass: string | null;
  totalTime: number;
  cuisineType: string[];
  mealType: string[];
  dishType: string[];
  totalNutrients: Record<string, RecipeNutrient>;
  totalDaily: Record<string, RecipeNutrient>;
  digest: RecipeDigestItem[];
}

// Recipe search API response
export interface RecipeSearchResponse {
  success: boolean;
  data?: {
    data: EdamamRecipe[];
    meta: {
      total: number;
      searchedAt: string;
      source: string;
      version: string;
      summary: {
        totalRecipes: number;
        averageCalories: number;
        averageTime: number;
        averageYield: number;
        totalCalories: number;
        totalTime: number;
        popularCuisines: string[];
        popularMealTypes: string[];
        popularDishTypes: string[];
        commonDietLabels: string[];
        commonHealthLabels: string[];
        difficultyDistribution: Record<string, number>;
        costDistribution: Record<string, number>;
      };
    };
    filters: {
      cuisineTypes: string[];
      mealTypes: string[];
      dishTypes: string[];
      dietLabels: string[];
      healthLabels: string[];
      timeRanges: string[];
      calorieRanges: string[];
      difficulties: string[];
      costs: string[];
    };
    suggestions: Record<string, any>;
    aggregated: Record<string, any>;
    pagination?: {
      has_more: boolean;
    };
  };
  // Fallback for simpler response structure
  query?: string;
  filters?: Record<string, any>;
  pagination?: {
    from: number;
    to: number;
    count: number;
    total: number;
    has_more: boolean;
  };
  recipes?: EdamamRecipe[];
  _links?: Record<string, any>;
}

// Recipe details API response
export interface RecipeDetailsResponse {
  success: boolean;
  recipe: EdamamRecipe;
}

// Frontend Recipe interface for UI components (simplified from EdamamRecipe)
export interface Recipe {
  id: string; // derived from uri
  name: string; // label
  image: string;
  calories: number;
  cookTime: number; // totalTime
  servings: number; // yield
  difficulty: 'Easy' | 'Medium' | 'Hard'; // derived from totalTime
  diet: string[]; // dietLabels + healthLabels
  ingredients: string[]; // ingredientLines
  rating: number; // mock for now
  description: string; // derived from source or mock
  cuisine: string; // first cuisineType
  tags: string[]; // mealType + dishType
  source: string;
  url: string;
  uri: string;
}

// Recipe search parameters
export interface RecipeSearchParams {
  q?: string;
  limit?: number;
  diet?: string[];
  health?: string[];
  cuisineType?: string[];
  mealType?: string[];
  dishType?: string[];
  calories?: string;
  time?: string;
  excluded?: string[];
  from?: number;
  to?: number;
}

// Recipe filters response
export interface RecipeFiltersResponse {
  diet: string[];
  health: string[];
  cuisineType: string[];
  mealType: string[];
  dishType: string[];
}

// Helper function to transform EdamamRecipe to frontend Recipe
export const transformRecipeFromAPI = (edamamRecipe: EdamamRecipe): Recipe => {
  // Generate ID from URI
  const id = edamamRecipe.uri ? 
    edamamRecipe.uri.split('#recipe_')[1] || edamamRecipe.uri.split('/').pop() || Math.random().toString(36) :
    Math.random().toString(36);

  // Determine difficulty based on total time
  let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy';
  if (edamamRecipe.totalTime > 60) {
    difficulty = 'Hard';
  } else if (edamamRecipe.totalTime > 30) {
    difficulty = 'Medium';
  }

  // Combine diet and health labels
  const diet = [...edamamRecipe.dietLabels, ...edamamRecipe.healthLabels.slice(0, 3)];

  // Get best available image
  const image = edamamRecipe.image || 
    edamamRecipe.images?.REGULAR?.url ||
    edamamRecipe.images?.SMALL?.url ||
    edamamRecipe.images?.THUMBNAIL?.url ||
    '/api/placeholder/400/300';

  // Create description from source
  const description = `Delicious ${edamamRecipe.cuisineType[0] || 'international'} recipe from ${edamamRecipe.source}.`;

  // Combine tags from meal and dish types
  const tags = [...edamamRecipe.mealType, ...edamamRecipe.dishType.slice(0, 2)];

  return {
    id,
    name: edamamRecipe.label,
    image,
    calories: Math.round(edamamRecipe.calories),
    cookTime: edamamRecipe.totalTime || 30,
    servings: edamamRecipe.yield || 1,
    difficulty,
    diet,
    ingredients: edamamRecipe.ingredientLines,
    rating: 4.0 + Math.random() * 1.0, // Mock rating for now
    description,
    cuisine: edamamRecipe.cuisineType[0] || 'International',
    tags,
    source: edamamRecipe.source,
    url: edamamRecipe.url,
    uri: edamamRecipe.uri || ''
  };
};

// Helper function to transform frontend search params to API params
export const transformSearchParamsToAPI = (params: {
  query?: string;
  diet?: string;
  cuisine?: string;
  difficulty?: string;
  limit?: number;
  page?: number;
}) => {
  const apiParams: any = {
    type: 'public'
  };

  if (params.query) {
    apiParams.q = params.query;
  }

  if (params.limit) {
    apiParams.to = params.limit;
    apiParams.from = 0;
  }

  if (params.page && params.limit) {
    apiParams.from = (params.page - 1) * params.limit;
    apiParams.to = params.page * params.limit;
  }

  if (params.diet && params.diet !== 'All') {
    // Map frontend diet to API health labels
    const dietMap: Record<string, string> = {
      'Vegetarian': 'vegetarian',
      'Vegan': 'vegan',
      'Gluten-Free': 'gluten-free',
      'Dairy-Free': 'dairy-free',
      'Keto': 'keto-friendly',
      'Paleo': 'paleo'
    };
    if (dietMap[params.diet]) {
      apiParams.health = [dietMap[params.diet]];
    }
  }

  if (params.cuisine && params.cuisine !== 'All') {
    apiParams.cuisineType = [params.cuisine];
  }

  // Map difficulty to time ranges
  if (params.difficulty && params.difficulty !== 'All') {
    const timeMap: Record<string, string> = {
      'Easy': '1-30',
      'Medium': '31-60',
      'Hard': '61+'
    };
    if (timeMap[params.difficulty]) {
      apiParams.time = timeMap[params.difficulty];
    }
  }

  return apiParams;
};