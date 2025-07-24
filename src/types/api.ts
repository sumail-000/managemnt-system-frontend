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