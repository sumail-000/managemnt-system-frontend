// Category type definitions
export interface Category {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  products_count?: number;
}

// Form data for creating/updating categories
export interface CategoryFormData {
  name: string;
}

// API response types
export interface CategoryResponse {
  success: boolean;
  data: Category;
  message: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
  message: string;
}