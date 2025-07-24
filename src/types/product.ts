// Shared Product type definition
export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: "draft" | "published";
  is_pinned: boolean;
  is_public: boolean;
  serving_size: number;
  serving_unit: string;
  servings_per_container: number;
  tags: string[];
  image?: string; // This is the main image field returned by backend
  image_url?: string; // Direct URL field
  image_path?: string; // Storage path field
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
  };
}

// Helper type for API operations
export interface ProductFormData {
  name: string;
  description?: string;
  category: string;
  serving_size: number;
  serving_unit: string;
  servings_per_container: number;
  status: "draft" | "published";
  is_public: boolean;
  is_pinned: boolean;
  tags?: string[];
  image_url?: string;
  image_file?: File;
}

// Helper function to transform API response to frontend Product type
export const transformProductFromAPI = (apiProduct: any): Product => {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description,
    category: apiProduct.category,
    status: apiProduct.status,
    is_pinned: apiProduct.is_pinned || false,
    is_public: apiProduct.is_public || false,
    serving_size: apiProduct.serving_size,
    serving_unit: apiProduct.serving_unit,
    servings_per_container: apiProduct.servings_per_container,
    tags: apiProduct.tags || [],
    image: apiProduct.image,
    image_url: apiProduct.image_url,
    image_path: apiProduct.image_path,
    created_at: apiProduct.created_at,
    updated_at: apiProduct.updated_at,
    user: apiProduct.user,
  };
};

// Helper function to transform Product to camelCase for components that expect it
export function transformProductToCamelCase(product: Product): ProductCamelCase {
  return {
    ...product,
    status: product.status === "draft" ? "Draft" : "Published",
    isPinned: product.is_pinned,
    isPublic: product.is_public,
    servingSize: product.serving_size,
    servingUnit: product.serving_unit,
    servingsPerContainer: product.servings_per_container,
    thumbnail: product.image, // Map the image field to thumbnail for display
    createdAt: new Date(product.created_at),
    updatedAt: new Date(product.updated_at),
  };
}

// Type for components that expect camelCase properties
export interface ProductCamelCase {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: "Draft" | "Published";
  isPinned: boolean;
  isPublic: boolean;
  servingSize: number;
  servingUnit: string;
  servingsPerContainer: number;
  tags: string[];
  image?: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
  };
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