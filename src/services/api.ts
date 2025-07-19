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
    
    // Log API request
    console.log('[API] Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      data: config.data,
      params: config.params,
      hasToken: !!token
    });
    
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and logging
api.interceptors.response.use(
  (response) => {
    // Log successful API response
    console.log('[API] Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      data: response.data
    });
    
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
      console.warn('[API] Unauthorized access - redirecting to login');
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
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
};

// Products API
export const productsAPI = {
  getAll: (params?: { search?: string; category?: string; page?: number }) =>
    api.get('/products', { params }),
  
  getById: (id: number) => api.get(`/products/${id}`),
  
  create: (productData: any) => api.post('/products', productData),
  
  update: (id: number, productData: any) =>
    api.put(`/products/${id}`, productData),
  
  delete: (id: number) => api.delete(`/products/${id}`),
  
  getPublic: (params?: { search?: string; category?: string; page?: number }) =>
    api.get('/products/public', { params }),
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
  
  createTestData: () => api.post('/billing/test-data'),
};

export default api;