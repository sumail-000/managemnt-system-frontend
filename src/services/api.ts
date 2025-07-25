import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token and logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
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
    
    // Check for token refresh headers
    const newToken = response.headers['x-new-token'];
    const tokenRefreshed = response.headers['x-token-refreshed'];
    
    if (newToken && tokenRefreshed === 'true') {
      console.log('[API] Token refreshed automatically, updating localStorage');
      localStorage.setItem('auth_token', newToken);
      
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
    // Log API error
    console.error('[API] Response error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
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
        localStorage.removeItem('auth_token');
        
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
    return api.post('/auth/change-password', data);
  },
  
  deleteAccount: (password: string) => {
    console.log('[AUTH_API] Delete account request initiated');
    return api.delete('/auth/delete-account', { data: { password } });
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
  
  // Categories and tags
  getCategories: () => {
    console.log('[PRODUCTS_API] Get categories request initiated');
    return api.get('/products/categories/list');
  },
  
  getTags: () => {
    console.log('[PRODUCTS_API] Get tags request initiated');
    return api.get('/products/tags/list');
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
  
  // Public products
  getPublic: (params?: { search?: string; category?: string; page?: number; per_page?: number }) => {
    console.log('[PRODUCTS_API] Get public products request initiated', params);
    return api.get('/products/public', { params });
  },
  
  getPublicById: (id: number | string) => {
    console.log('[PRODUCTS_API] Get public product by ID request initiated', { id });
    return api.get(`/products/public/${id}`);
  },
};

// Ingredients API
export const ingredientsAPI = {
  getAll: (params?: { search?: string; page?: number }) =>
    api.get('/ingredients', { params }),
  
  getById: (id: number) => api.get(`/ingredients/${id}`),
  
  create: (ingredientData: any) => api.post('/ingredients', ingredientData),
  
  update: (id: number, ingredientData: any) =>
    api.put(`/ingredients/${id}`, ingredientData),
  
  delete: (id: number) => api.delete(`/ingredients/${id}`),
  
  search: (query: string) =>
    api.get('/ingredients/search', { params: { q: query } }),
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
    autocomplete: (query: string, limit: number = 10) => {
      console.log('[EDAMAM_API] Food autocomplete request initiated', { query, limit });
      return api.get('/edamam/food/autocomplete', { params: { q: query, limit } });
    },
    
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
    analyze: (ingredients: string[]) => {
      console.log('[EDAMAM_API] Nutrition analysis request initiated', { ingredients });
      return api.post('/edamam/nutrition/analyze', { ingredients });
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
    }
  },
  
  // Recipe Search API
  recipe: {
    search: (query: string, params?: {
      limit?: number;
      diet?: string[];
      health?: string[];
      cuisineType?: string[];
      mealType?: string[];
      dishType?: string[];
      calories?: string;
      time?: string;
      excluded?: string[];
    }) => {
      console.log('[EDAMAM_API] Recipe search request initiated', { query, params });
      return api.get('/edamam/recipe/search', { params: { query, ...params } });
    },
    
    getById: (id: string) => {
      console.log('[EDAMAM_API] Recipe details request initiated', { id });
      return api.get('/edamam/recipe/show', { params: { id } });
    },
    
    getRandom: (count: number = 10, params?: {
      diet?: string[];
      health?: string[];
      cuisineType?: string[];
      mealType?: string[];
      dishType?: string[];
    }) => {
      console.log('[EDAMAM_API] Random recipes request initiated', { count, params });
      return api.get('/edamam/recipe/random', { params: { count, ...params } });
    },
    
    getSuggestions: (ingredients: string[], limit: number = 10) => {
      console.log('[EDAMAM_API] Recipe suggestions request initiated', { ingredients, limit });
      return api.get('/edamam/recipe/suggest', { params: { ingredients: ingredients.join(','), limit } });
    },
    
    getFilters: () => {
      console.log('[EDAMAM_API] Recipe filters request initiated');
      return api.get('/edamam/recipe/filters');
    },
    
    clearCache: () => {
      console.log('[EDAMAM_API] Clear recipe cache request initiated');
      return api.delete('/edamam/recipe/cache');
    },
    
    generateIngredients: (productName: string, options?: {
      limit?: number;
      serving_size?: number;
    }) => {
      console.log('[EDAMAM_API] Generate ingredients request initiated', { productName, options });
      return api.post('/edamam/recipes/generate-ingredients', {
        product_name: productName,
        ...options
      });
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

export default api;