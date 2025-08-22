import axios from 'axios';
import { TokenManager } from '../utils/tokenManager';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token and logging
api.interceptors.request.use(
  (config) => {
    // Determine which token to use based on the current path or request URL
    const isAdminRequest = config.url?.includes('/admin') || TokenManager.isAdminContext();
    const { token } = TokenManager.getToken(isAdminRequest);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle FormData - remove Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
      console.log('[API] FormData detected - removing Content-Type header to allow browser to set boundary');
      delete config.headers['Content-Type'];
    }
    
    // Log API request
    console.log('[API] Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      data: config.data instanceof FormData ? 'FormData (file upload)' : config.data,
      params: config.params,
      hasToken: !!token,
      isFormData: config.data instanceof FormData
    });
    
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Removed camelCase conversion to maintain snake_case consistency with backend

// Response interceptor to handle errors and logging
api.interceptors.response.use(
  (response) => {
    // Log successful API response
    console.log('[API] Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      data: response.config.responseType === 'blob' ? 'Blob data' : response.data
    });
    
    // Enhanced debugging for QR code generation
    if (response.config.url?.includes('/qr-codes/') && response.config.url?.includes('/generate')) {
      console.log('[API] QR Code Generation Response Details:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'No data',
        success: response.data?.success,
        qrCode: response.data?.qr_code,
        imageUrl: response.data?.image_url,
        publicUrl: response.data?.public_url,
        downloadUrl: response.data?.download_url,
        message: response.data?.message
      });
    }
    
    // Check for token refresh headers
    const newToken = response.headers['x-new-token'];
    const tokenRefreshed = response.headers['x-token-refreshed'];
    
    if (newToken && tokenRefreshed === 'true') {
      console.log('[API] Token refreshed automatically, updating localStorage');
      
      // Determine which token storage to update based on request context
      const isAdminRequest = response.config.url?.includes('/admin') || TokenManager.isAdminContext();
      
      // Get current expiry for the refreshed token
      const currentTokenInfo = TokenManager.getToken(isAdminRequest);
      TokenManager.setToken(newToken, currentTokenInfo.expiresAt, isAdminRequest);
      
      // Dispatch custom event to notify components of token refresh
      window.dispatchEvent(new CustomEvent('tokenRefreshed', {
        detail: { newToken }
      }));
    }
    
    // For blob responses, return the full response object so frontend can access response.data
    if (response.config.responseType === 'blob') {
      return response;
    }
    
    // Return data as-is to maintain snake_case consistency with backend
    return response.data;
  },
  (error) => {
    // Log API error with more detailed information
    console.error('[API] Response error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
      errors: error.response?.data?.errors,
      errorCode: error.response?.data?.error_code,
      fullResponse: error.response
    });
    
    // Special logging for registration errors
    if (error.config?.url?.includes('/auth/register')) {
      console.error('[API] Registration error details:', {
        validationErrors: error.response?.data?.errors,
        emailError: error.response?.data?.errors?.email,
        statusCode: error.response?.status,
        responseData: error.response?.data
      });
    }
    
    // Handle IP restriction violations for admin panel
    if (error.response?.data?.error_code === 'IP_RESTRICTION_VIOLATION') {
      console.warn('[API] IP restriction violation detected for admin panel');
      const currentPath = window.location.pathname;
      
      // Only redirect if we're in the admin panel area
      if (currentPath.startsWith('/admin')) {
        console.warn('[API] Redirecting to IP restriction error page');
        window.location.href = '/admin/ip-restricted';
        return Promise.reject(error);
      }
    }

    // Handle plan gating / limit reached errors globally and emit upgrade modal event
    if (error.response?.status === 403) {
      const code = error.response?.data?.error_code;
      if (code === 'PLAN_LIMIT_REACHED' || code === 'PLAN_GATING') {
        const limitInfo = error.response?.data?.limit_info || {};
        const message = error.response?.data?.message || 'Upgrade required to use this feature.';
        try {
          window.dispatchEvent(new CustomEvent('planLimitReached', {
            detail: {
              message,
              code,
              limit_info: limitInfo
            }
          }));
        } catch (e) {
          console.warn('[API] Failed to dispatch planLimitReached event', e);
        }
      }
    }
    
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized access detected');
      // Only auto-logout if we're not already on login/register pages
      // and if this isn't a token validation request that might be expected to fail
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register';
      const isTokenValidation = error.config?.url?.includes('/auth/user');
      const isPaymentPage = currentPath === '/payment';
      
      if (!isAuthPage && !isTokenValidation) {
        console.warn('[API] Auto-logout triggered - redirecting to login');
        
        // Clear appropriate tokens based on current context
        const isAdminContext = TokenManager.isAdminContext();
        TokenManager.clearToken(isAdminContext);
        
        // If user is on payment page, show a more helpful message
        if (isPaymentPage) {
          // Store a flag to show a specific message on login page
          localStorage.setItem('payment_session_expired', 'true');
          window.location.href = '/login?redirect=payment&reason=session_expired';
        } else {
          window.location.href = '/login';
        }
      } else {
        console.warn('[API] 401 error on auth page or token validation - not auto-logging out');
      }
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials: { email: string; password: string }) => {
    console.log('[AUTH_API] Login request initiated', { email: credentials.email });
    return api.post('/auth/login', credentials);
  },
  
  register: (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    company?: string;
    contact_number?: string;
    tax_id?: string;
  }) => {
    console.log('[AUTH_API] Registration request initiated', {
      email: userData.email,
      name: userData.name,
      company: userData.company
    });
    return api.post('/auth/register', userData);
  },
  
  logout: () => {
    console.log('[AUTH_API] Logout request initiated');
    return api.post('/auth/logout');
  },
  
  logoutFromAllDevices: () => {
    console.log('[AUTH_API] Logout from all devices request initiated');
    return api.post('/auth/logout-all-devices');
  },
  
  changePassword: (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }) => {
    console.log('[AUTH_API] Change password request initiated');
    // Map frontend fields to typical Laravel expectation: password + password_confirmation
    const payload = {
      current_password: data.current_password,
      password: data.new_password,
      password_confirmation: data.new_password_confirmation,
    };
    return api.post('/auth/change-password', payload);
  },
  
  deleteAccount: (data: { password: string; reason?: string }) => {
    console.log('[AUTH_API] Request account deletion initiated');
    return api.post('/auth/request-account-deletion', data);
  },
  
  getUser: () => {
    console.log('[AUTH_API] Get user request initiated');
    return api.get('/auth/user');
  },
  
  sendPasswordResetOtp: (email: string) => {
    console.log('[AUTH_API] Password reset OTP request initiated', { email });
    return api.post('/password/send-otp', { email });
  },
  
  verifyOtp: (data: { email: string; otp: string }) => {
    console.log('[AUTH_API] OTP verification request initiated', { email: data.email });
    return api.post('/password/verify-otp', data);
  },
  
  resetPassword: (data: {
    otp: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => {
    console.log('[AUTH_API] Password reset request initiated', { email: data.email });
    return api.post('/password/reset', data);
  },
  
  updateProfile: (data: FormData | {
    name?: string;
    email?: string;
    company?: string;
    contact_number?: string;
    tax_id?: string;
  }) => {
    console.log('[AUTH_API] Update profile request initiated');
    return api.post('/auth/update-profile', data);
  },
};

// Products API
export const productsAPI = {
  // Basic CRUD operations
  getAll: (params?: { 
    search?: string; 
    category?: string; 
    status?: string;
    is_pinned?: boolean;
    tags?: string[];
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }) => {
    console.log('[PRODUCTS_API] Get all products request initiated', params);
    return api.get('/products', { params });
  },
  
  getById: (id: number | string) => {
    console.log('[PRODUCTS_API] Get product by ID request initiated', { id });
    return api.get(`/products/${id}`);
  },
  
  create: (productData: {
    name: string;
    description?: string;
    category: string;
    tags?: string[];
    serving_size: number;
    serving_unit: string;
    servings_per_container: number;
    is_public?: boolean;
    is_pinned?: boolean;
    status?: 'draft' | 'published';
  } | FormData) => {
    console.log('[PRODUCTS_API] Create product request initiated', { 
      name: productData instanceof FormData ? 'FormData' : productData.name 
    });
    return api.post('/products', productData);
  },
  
  update: (id: number | string, productData: Partial<{
    name: string;
    description?: string;
    category: string;
    tags?: string[];
    serving_size: number;
    serving_unit: string;
    servings_per_container: number;
    is_public?: boolean;
    is_pinned?: boolean;
    status?: 'draft' | 'published';
  }> | FormData) => {
    console.log('[PRODUCTS_API] Update product request initiated', { 
      id, 
      name: productData instanceof FormData ? 'FormData' : productData.name 
    });
    
    // Laravel doesn't support file uploads with PUT requests
    // Use POST with method spoofing for FormData (file uploads)
    if (productData instanceof FormData) {
      productData.append('_method', 'PUT');
      return api.post(`/products/${id}`, productData);
    }
    
    return api.put(`/products/${id}`, productData);
  },
  
  delete: (id: number | string) => {
    console.log('[PRODUCTS_API] Delete product request initiated', { id });
    return api.delete(`/products/${id}`);
  },
  
  // Additional product operations
  duplicate: (id: number | string) => {
    console.log('[PRODUCTS_API] Duplicate product request initiated', { id });
    return api.post(`/products/${id}/duplicate`);
  },
  
  togglePin: (id: number | string) => {
    console.log('[PRODUCTS_API] Toggle pin product request initiated', { id });
    return api.patch(`/products/${id}/toggle-pin`);
  },
  
  toggleFavorite: (id: number | string) => {
    console.log('[PRODUCTS_API] Toggle favorite product request initiated', { id });
    return api.patch(`/products/${id}/toggle-favorite`);
  },

  getFavorites: (params?: { search?: string; category?: string; sort_by?: string; sort_order?: string; page?: number; per_page?: number }) => {
    console.log('[PRODUCTS_API] Get favorites request initiated', params);
    return api.get('/products/favorites/list', { params });
  },
  
  // Categories and tags
  getCategories: () => {
    console.log('[PRODUCTS_API] Get categories request initiated');
    return api.get('/products/categories/list');
  },
  

  getProductTags: (id: number | string) => {
    console.log('[PRODUCTS_API] Get product tags request initiated', { id });
    return api.get(`/products/${id}/tags`);
  },
  
  // Trash management
  getTrashed: (params?: { search?: string; page?: number; per_page?: number }) => {
    console.log('[PRODUCTS_API] Get trashed products request initiated', params);
    return api.get('/products/trashed/list', { params });
  },
  
  restore: (id: number | string) => {
    console.log('[PRODUCTS_API] Restore product request initiated', { id });
    return api.patch(`/products/${id}/restore`);
  },
  
  forceDelete: (id: number | string) => {
    console.log('[PRODUCTS_API] Force delete product request initiated', { id });
    return api.delete(`/products/${id}/force-delete`);
  },
  
  bulkDelete: (ids: number[]) => {
    console.log('[PRODUCTS_API] Bulk delete products request initiated', { ids });
    return api.post('/products/bulk-delete', { ids });
  },
  
  // Public products
  getPublic: (params?: { search?: string; category?: string; page?: number; per_page?: number }) => {
    console.log('[PRODUCTS_API] Get public products request initiated', params);
    return api.get('/products/public', { params });
  },
  
  getPublicById: (id: number | string) => {
    console.log('[PRODUCTS_API] Get public product by ID request initiated', { id });
    return api.get(`/products/public/${id}`);
  },
  
  // Image URL extraction
  extractImageUrl: (url: string) => {
    console.log('[PRODUCTS_API] Extract image URL request initiated', { url });
    return api.post('/products/extract-image-url', { url });
  },
  
  // Product metrics
  getMetrics: (productIds: number[]) => {
    console.log('[PRODUCTS_API] Get product metrics request initiated', { productIds });
    return api.post('/products/metrics', { product_ids: productIds });
  },
};



// Membership Plans API
export const membershipAPI = {
  getPlans: () => api.get('/membership-plans'),
  
  getCurrentPlan: () => api.get('/user/membership-plan'),
  
  getRecommendations: () => api.get('/user/plan-recommendations'),
  
  upgradePlan: (planId: number) =>
    api.post('/user/upgrade-plan', { plan_id: planId }),
};

// Usage Tracking API
export const usageAPI = {
  getCurrentUsage: () => api.get('/user/usage'),
  
  checkPermission: (action: 'create_product' | 'create_label') =>
    api.post('/user/check-permission', { action }),
};

// User Settings API
export const settingsAPI = {
  get: () => api.get('/user/settings'),
  
  update: (settings: any) => api.put('/user/settings', settings),
};

// Billing API
export const billingAPI = {
  getBillingInformation: () => api.get('/billing/information'),
  
  saveBillingInformation: (billingData: {
    full_name: string;
    email: string;
    company_name?: string;
    tax_id?: string;
    street_address: string;
    city: string;
    state_province: string;
    postal_code: string;
    country: string;
    phone?: string;
  }) => api.post('/billing/information', billingData),
  
  getPaymentMethods: () => api.get('/billing/payment-methods'),
  
  addPaymentMethod: (paymentData: {
    type: 'card' | 'bank_account';
    provider: string;
    brand: string;
    last_four: string;
    expiry_month?: number;
    expiry_year?: number;
    cardholder_name?: string;
    is_default?: boolean;
  }) => api.post('/billing/payment-methods', paymentData),
  
  getBillingHistory: () => api.get('/billing/history'),
  
  downloadInvoice: (invoiceId: string) => {
    return api.get(`/billing/invoice/${invoiceId}/download`, {
      responseType: 'blob'
    });
  },
  
  exportBillingHistory: () => {
    return api.get('/billing/history/export', {
      responseType: 'blob'
    });
  },
  
  createTestData: () => api.post('/billing/test-data'),
};

// Payment API
export const paymentAPI = {
  createPaymentIntent: (data: any): Promise<any> => api.post('/payment/create-intent', data),
  
  getPaymentStatus: (): Promise<any> => api.get('/payment/status'),
  
  // Subscription Cancellation API (3-day waiting period system)
  requestCancellation: (data: { reason?: string }): Promise<any> => api.post('/payment/request-cancellation', data),
  
  confirmCancellation: (data: { password: string }): Promise<any> => api.post('/payment/confirm-cancellation', data),
  
  cancelCancellationRequest: (): Promise<any> => api.post('/payment/cancel-cancellation-request'),
  
  getCancellationStatus: (): Promise<any> => api.get('/payment/cancellation-status'),
  
  updateAutoRenew: (data: { auto_renew: boolean }): Promise<any> => api.post('/payment/auto-renew', data),
  
  updatePaymentMethod: (data: any): Promise<any> => api.post('/payment/update-method', data),
  
  getSubscriptionDetails: (): Promise<any> => api.get('/payment/subscription'),
};

// Edamam API
export const edamamAPI = {
  // Food Database API
  food: {

    
    search: (query: string, params?: {
      limit?: number;
      category?: string;
      nutrients?: string[];
      health?: string[];
    }) => {
      console.log('[EDAMAM_API] Food search request initiated', { query, params });
      return api.get('/edamam/food/search', { params: { query, ...params } });
    },
    
    getByUpc: (upc: string) => {
      console.log('[EDAMAM_API] Food UPC lookup request initiated', { upc });
      return api.get(`/edamam/food/upc/${upc}`);
    },
    
    getPopular: (limit: number = 20) => {
      console.log('[EDAMAM_API] Popular foods request initiated', { limit });
      return api.get('/edamam/food/popular', { params: { limit } });
    },
    
    getCategories: () => {
      console.log('[EDAMAM_API] Food categories request initiated');
      return api.get('/edamam/food/categories');
    },
    
    clearCache: () => {
      console.log('[EDAMAM_API] Clear food cache request initiated');
      return api.delete('/edamam/food/cache');
    }
  },
  
  // Nutrition Analysis API
  nutrition: {
    analyze: (ingredients: string[], productId?: string) => {
      console.log('[EDAMAM_API] Nutrition analysis request initiated', { ingredients, productId });
      const payload: any = { ingredients: ingredients };
      if (productId) {
        payload.product_id = productId;
      }
      return api.post('/edamam/nutrition/analyze', payload);
    },
    
    batchAnalyze: (ingredientSets: string[][]) => {
      console.log('[EDAMAM_API] Batch nutrition analysis request initiated', { count: ingredientSets.length });
      return api.post('/edamam/nutrition/batch-analyze', { ingredient_sets: ingredientSets });
    },
    
    getHistory: (params?: { page?: number; per_page?: number }) => {
      console.log('[EDAMAM_API] Nutrition analysis history request initiated', params);
      return api.get('/edamam/nutrition/history', { params });
    },
    
    clearCache: () => {
      console.log('[EDAMAM_API] Clear nutrition cache request initiated');
      return api.delete('/edamam/nutrition/cache');
    },
    
    saveAutoTags: (data: {
      product_id: string;
      auto_tags: string[];
      analysis_name?: string;
      notes?: string;
    }) => {
      console.log('[NUTRITION_API] Save auto tags request initiated', data);
      return api.post('/nutrition/auto-tags/save', data);
    },
    
    saveNutritionData: (data: {
      product_id: string;
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
      micronutrients: Record<string, any>;
      daily_values: Record<string, any>;
      health_labels: string[];
      diet_labels: string[];
      allergens: string[];
      warnings: Array<{
        type: string;
        message: string;
        severity: string;
      }>;
      high_nutrients: Array<any>;
      nutrition_summary: Record<string, any>;
      analysis_metadata: {
        analyzed_at: string;
        ingredient_query: string;
        product_name: string;
      };
    }) => {
      console.log('[NUTRITION_API] Save comprehensive nutrition data request initiated', data);
      return api.post('/nutrition/save-data', data);
    },

    checkNutritionData: (productId: string) => {
      console.log('[NUTRITION_API] Check nutrition data request initiated', { productId });
      return api.post('/nutrition/check-data', { product_id: productId });
    },

    loadNutritionData: (productId: string) => {
      console.log('[NUTRITION_API] Load nutrition data request initiated', { productId });
      return api.post('/nutrition/load-data', { product_id: productId });
    }
  },
  

  
  // Ingredients API
  ingredients: {
    generate: (productName: string, options?: {
      limit?: number;
      serving_size?: number;
    }) => {
      console.log('[INGREDIENTS_API] Generate ingredients request initiated', { productName, options });
      return api.post('/edamam/ingredients/generate', {
        product_name: productName,
        ...options
      });
    }
  }
};

// Collections API
export const collectionsAPI = {
  getAll: () => {
    console.log('[COLLECTIONS_API] Get all collections request initiated');
    return api.get('/collections');
  },
  
  create: (data: {
    name: string;
    description?: string;
    color?: string;
  }) => {
    console.log('[COLLECTIONS_API] Create collection request initiated', data);
    return api.post('/collections', data);
  },
  
  getById: (id: string) => {
    console.log('[COLLECTIONS_API] Get collection by ID request initiated', { id });
    return api.get(`/collections/${id}`);
  },
  
  update: (id: string, data: {
    name: string;
    description?: string;
    color?: string;
  }) => {
    console.log('[COLLECTIONS_API] Update collection request initiated', { id, data });
    return api.put(`/collections/${id}`, data);
  },
  
  delete: (id: string) => {
    console.log('[COLLECTIONS_API] Delete collection request initiated', { id });
    return api.delete(`/collections/${id}`);
  },
  
  addProduct: (collectionId: string, productId: string) => {
    console.log('[COLLECTIONS_API] Add product to collection request initiated', { collectionId, productId });
    return api.post(`/collections/${collectionId}/products`, { product_id: productId });
  },
  
  removeProduct: (collectionId: string, productId: string) => {
    console.log('[COLLECTIONS_API] Remove product from collection request initiated', { collectionId, productId });
    return api.delete(`/collections/${collectionId}/products/${productId}`);
  },
  
  getProducts: (collectionId: string, params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category_id?: string;
    sort_by?: string;
    sort_order?: string;
  }) => {
    console.log('[COLLECTIONS_API] Get collection products request initiated', { collectionId, params });
    return api.get(`/collections/${collectionId}/products`, { params });
  }
};

// Admin API
export const adminAPI = {
  // Dashboard metrics
  getDashboardMetrics: (params?: { month?: number; year?: number }) => {
    console.log('[ADMIN_API] Get dashboard metrics request initiated', params);
    return api.get('/admin/dashboard/metrics', { params });
  },
  
  getSystemHealth: () => {
    console.log('[ADMIN_API] Get system health request initiated');
    return api.get('/admin/dashboard/system-health');
  },
  
  // Profile management
  getProfile: () => {
    console.log('[ADMIN_API] Get admin profile request initiated');
    return api.get('/admin/profile');
  },
  
  updateProfile: (data: {
    name?: string;
    email?: string;
    avatar?: File;
  }) => {
    console.log('[ADMIN_API] Update admin profile request initiated');
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.email) formData.append('email', data.email);
    if (data.avatar) formData.append('avatar', data.avatar);
    return api.post('/admin/profile', formData);
  },
  
  // Security settings
  updateSecuritySettings: (data: {
    allowed_ips?: string[];
    login_notifications_enabled?: boolean;
    session_timeout?: number;
  }) => {
    console.log('[ADMIN_API] Update security settings request initiated');
    return api.put('/admin/profile/security', data);
  },

  deleteUser: (id: number) => {
    console.log('[ADMIN_API] Delete user request initiated', { id });
    return api.delete(`/admin/users/${id}`);
  },

  getUserStats: () => {
    console.log('[ADMIN_API] Get user stats request initiated');
    return api.get('/admin/users/stats');
  },

  suspendUser: (id: number) => {
    console.log('[ADMIN_API] Suspend user request initiated', { id });
    return api.patch(`/admin/users/${id}/suspend`);
  },

  getUserById: (id: string) => {
    console.log('[ADMIN_API] Get user by ID request initiated', { id });
    return api.get(`/admin/users/${id}`);
  },

  resetPassword: (id: number, data: { password; password_confirmation }) => {
    console.log('[ADMIN_API] Reset password request initiated', { id });
    return api.patch(`/admin/users/${id}/reset-password`, data);
  },

  getProducts: (params?: { search?: string; sort_by?: string; sort_order?: string; page?: number; per_page?: number }) => {
    console.log('[ADMIN_API] Get products request initiated', params);
    return api.get('/admin/products', { params });
  },
};

export default api;
