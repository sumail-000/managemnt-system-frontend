// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaymentIntentResponse {
  success: boolean;
  message: string;
  clientSecret?: string;
  subscriptionId?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  message: string;
  status?: string;
  subscriptionEndDate?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Image URL Extraction Response
export interface ImageUrlExtractionResponse {
  original_url: string;
  is_google_url: boolean;
  extracted_url: string | null;
  is_valid_image: boolean;
  message: string;
  error: string | null;
}

// Nutrition API Response Types
export interface NutritionCheckResponse {
  success: boolean;
  exists: boolean;
  data: any;
}

export interface NutritionAnalysisResponse {
  success?: boolean;
  message?: string;
  data?: any;
  // Direct response properties (when no wrapper)
  calories?: number;
  totalNutrients?: any;
  nutritionSummary?: any;
  healthLabels?: string[];
  cautions?: any[];
  yield?: number;
  totalWeight?: number;
  dietLabels?: string[];
  highNutrients?: any[];
  totalDaily?: any;
}

export interface NutritionLoadResponse {
  success: boolean;
  message?: string;
  data?: any;
}