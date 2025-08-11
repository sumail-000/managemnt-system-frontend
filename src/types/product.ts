// Nutritional Data interface
export interface NutritionalData {
  id: number;
  product_id: number;
  basic_nutrition: {
    total_calories: number;
    servings: number;
    weight_per_serving: number;
  };
  macronutrients: {
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
  micronutrients: Record<string, {
    label: string;
    quantity: number;
    unit: string;
    percentage: number;
  }>;
  daily_values: Record<string, {
    label: string;
    quantity: number;
    unit: string;
  }>;
  health_labels?: string[];
  diet_labels?: string[];
  allergens?: string[];
  cautions?: string[];
  warnings?: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  high_nutrients?: Array<{
    nutrient: string;
    label: string;
    percentage: number;
    level: 'very_high' | 'high' | 'moderate';
  }>;
  nutrition_summary?: any;
  analysis_metadata: {
    analyzed_at: string;
    ingredient_query: string;
    product_name?: string;
  };
  created_at: string;
  updated_at: string;
}

// Ingredient interface
export interface Ingredient {
  id: string;
  name: string;
  pivot?: {
    amount?: number;
    unit?: string;
    order?: number;
  };
}

// Collection interface
export interface Collection {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// QR Code interface
export interface QrCode {
  id: string;
  product_id: string;
  url_slug: string;
  image_path?: string;
  image_url?: string;
  scan_count: number;
  last_scanned_at?: string;
  created_at: string;
  updated_at: string;
}

// Label interface
export interface Label {
  id: string;
  product_id: string;
  qr_code_id?: string;
  name: string;
  template_type: string;
  content: any;
  image_path?: string;
  created_at: string;
  updated_at: string;
}

// Shared Product type definition
export interface Product {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  category?: {
    id: string;
    name: string;
  };
  status: "draft" | "published";
  is_pinned: boolean;
  is_favorite: boolean;
  is_public: boolean;
  serving_size: number;
  serving_unit: string;
  servings_per_container: number;
  tags: string[];
  image?: string; // This is the main image field returned by backend
  image_url?: string; // Direct URL field
  image_path?: string; // Storage path field
  ingredients?: Ingredient[]; // Product ingredients with pivot data
  ingredients_data?: any[]; // New JSON ingredients data format
  ingredient_notes?: string; // Free-text ingredient notes
  collections?: Collection[]; // Collections this product belongs to
  qrCodes?: QrCode[]; // QR codes associated with this product
  labels?: Label[]; // Labels associated with this product
  created_at: string;
  updated_at: string;
  deleted_at?: string; // For trashed products
  user: {
    id: string;
    name: string;
  };
  nutritional_data?: NutritionalData[];
  nutrition_data?: any; // Backend nutrition data field with health_labels and diet_labels
}

// Helper type for API operations
export interface ProductFormData {
  name: string;
  description?: string;
  category_id: string;
  serving_size: number;
  serving_unit: string;
  servings_per_container: number;
  status: "draft" | "published";
  is_public: boolean;
  is_pinned: boolean;
  tags?: string[];
  image_url?: string;
  image_file?: File;
  // Recipe rating and nutrition score fields
  datametrics_rating?: number;
  nutrition_score?: number;
  // Individual macronutrient fields per serving
  protein_per_serving?: number;
  carbs_per_serving?: number;
  fat_per_serving?: number;
}

// Helper function to transform API response to frontend Product type
export const transformProductFromAPI = (apiProduct: any): Product => {
  if (!apiProduct) {
    throw new Error('API product data is undefined or null');
  }
  
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description,
    category_id: apiProduct.category_id,
    category: apiProduct.category,
    status: apiProduct.status,
    is_pinned: apiProduct.is_pinned || false,
    is_favorite: apiProduct.is_favorite || false,
    is_public: apiProduct.is_public || false,
    // Serving info fallback to serving_configuration/serving_size_grams
    serving_size: apiProduct.serving_size ?? apiProduct.serving_size_grams ?? apiProduct.serving_configuration?.serving_size_grams ?? 0,
    serving_unit: apiProduct.serving_unit ?? 'g',
    servings_per_container: apiProduct.servings_per_container ?? apiProduct.serving_configuration?.servings_per_container ?? 1,
    tags: apiProduct.tags || [],
    // Image resolution: prefer image, then direct URL, then storage path
    image: apiProduct.image || apiProduct.image_url || (apiProduct.image_path ? `${window.location.origin}/storage/${apiProduct.image_path}` : undefined),
    image_url: apiProduct.image_url,
    image_path: apiProduct.image_path,
    // Ingredients: support both relation-based and JSON ingredients_data
    ingredients: Array.isArray(apiProduct.ingredients)
      ? apiProduct.ingredients
      : (Array.isArray(apiProduct.ingredients_data)
        ? apiProduct.ingredients_data.map((ing: any, idx: number) => ({
            id: ing.id || `ingredient-${idx}`,
            name: ing.name,
            pivot: {
              amount: ing.quantity ?? (ing.grams !== undefined ? Math.round(ing.grams) : undefined),
              unit: ing.unit ?? (ing.grams !== undefined ? 'g' : undefined),
            }
          }))
        : []),
    ingredients_data: apiProduct.ingredients_data,
    ingredient_notes: apiProduct.ingredient_notes,
    collections: apiProduct.collections || [],
    qrCodes: apiProduct.qr_codes || [],
    labels: apiProduct.labels || [],
    created_at: apiProduct.created_at,
    updated_at: apiProduct.updated_at,
    user: apiProduct.user,
    // Pass through raw nutrition data if available for other views
    nutrition_data: apiProduct.nutrition_data
  };
};

// Helper function to transform Product to camelCase for components that expect it
export function transformProductToCamelCase(product: Product): ProductCamelCase {
  return {
    ...product,
    categoryId: product.category_id,
    status: product.status === "draft" ? "Draft" : "Published",
    isPinned: product.is_pinned,
    isFavorite: product.is_favorite,
    isPublic: product.is_public,
    servingSize: product.serving_size,
    servingUnit: product.serving_unit,
    servingsPerContainer: product.servings_per_container,
    thumbnail: product.image, // Map the image field to thumbnail for display
    createdAt: new Date(product.created_at),
    updatedAt: new Date(product.updated_at),
    deletedAt: product.deleted_at ? new Date(product.deleted_at) : undefined,
    nutritionData: (product as any).nutrition_data, // Map nutrition_data from backend
  };
}

// Type for components that expect camelCase properties
export interface ProductCamelCase {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  status: "Draft" | "Published";
  isPinned: boolean;
  isFavorite: boolean;
  isPublic: boolean;
  servingSize: number;
  servingUnit: string;
  servingsPerContainer: number;
  tags: string[];
  image?: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  user: {
    id: string;
    name: string;
  };
  nutritionData?: any; // Add nutrition data field
}

// Laravel pagination response type
export interface LaravelPaginationResponse<T = any> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  from: number;
  to: number;
  per_page: number;
  path?: string;
  first_page_url?: string;
  last_page_url?: string;
  next_page_url?: string | null;
  prev_page_url?: string | null;
  links?: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}