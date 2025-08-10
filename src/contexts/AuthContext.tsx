import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { TokenManager } from '../utils/tokenManager';

interface Usage {
  products: {
    current_month: number;
    total: number;
    limit: number;
    unlimited: boolean;
  };
  labels: {
    current_month: number;
    total: number;
    limit: number;
    unlimited: boolean;
  };
  qr_codes?: {
    current_month: number;
    total: number;
    limit: number;
    unlimited: boolean;
  };
  trial_days_remaining?: number;
  period: {
    start: string;
    end: string;
  };
}

interface UsagePercentages {
  products: number;
  labels: number;
}

interface SubscriptionInfo {
  status: string;
  type: string;
  plan_name?: string;
  remaining_days?: number;
  next_renewal_date?: string;
  is_active: boolean;
}

interface TrialInfo {
  is_trial: boolean;
  trial_ends_at: string;
  remaining_days: number;
}

interface SubscriptionDetails {
  subscription_started_at: string;
  subscription_ends_at: string;
  remaining_days: number;
  next_renewal_date: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  auto_renew: boolean;
}

interface BillingInformation {
  id: number;
  user_id: number;
  full_name?: string;
  email?: string;
  company_name?: string;
  street_address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  tax_id?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentMethod {
  id: number;
  user_id: number;
  stripe_payment_method_id?: string;
  type: string;
  provider?: string;
  last_four: string;
  brand: string;
  expiry_month: number;
  expiry_year: number;
  cardholder_name?: string;
  is_default: boolean;
  is_active: boolean;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

interface BillingHistory {
  id: number;
  user_id: number;
  membership_plan_id: number;
  payment_method_id?: number;
  invoice_number: string;
  transaction_id?: string;
  type: string;
  amount: string;
  currency: string;
  billing_date: string;
  due_date?: string;
  paid_at?: string;
  status: string;
  stripe_invoice_id?: string;
  stripe_payment_intent_id?: string;
  description?: string;
  metadata?: any;
  invoice_url?: string;
  created_at: string;
  updated_at: string;
  membership_plan?: {
    id: number;
    name: string;
    price: string;
    stripe_price_id: string;
    description: string;
    features: string[];
    product_limit: number;
    label_limit: number;
  };
  payment_method?: PaymentMethod;
}

interface User {
  id: number;
  name: string;
  email: string;
  company?: string;
  contact_number?: string;
  tax_id?: string;
  payment_status?: string;
  avatar?: string;
  membership_plan?: {
    id: number;
    name: string;
    price: number;
    description: string;
    features: string[];
    product_limit: number;
    label_limit: number;
  };
  settings?: {
    theme: string;
    language: string;
    timezone: string;
    email_notifications: boolean;
    push_notifications: boolean;
  };
}

interface Admin {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  is_active: boolean;
  last_login_at?: string;
  last_login_ip?: string;
  notes?: string;
  created_by?: number;
}

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  userType: 'user' | 'admin' | null;
  token: string | null;
  tokenExpiresAt: string | null;
  usage: Usage | null;
  usagePercentages: UsagePercentages | null;
  subscriptionInfo: SubscriptionInfo | null;
  trialInfo: TrialInfo | null;
  subscriptionDetails: SubscriptionDetails | null;
  billingInformation: BillingInformation | null;
  paymentMethods: PaymentMethod[] | null;
  billingHistory: BillingHistory[] | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  logoutFromAllDevices: () => Promise<void>;
  changePassword: (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  updateUser: (userData: FormData | Partial<User>) => Promise<any>;
  refreshUsage: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  company?: string;
  contact_number?: string;
  tax_id?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [userType, setUserType] = useState<'user' | 'admin' | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [usagePercentages, setUsagePercentages] = useState<UsagePercentages | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [billingInformation, setBillingInformation] = useState<BillingInformation | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[] | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isRefreshingRef = useRef(false);

  // Refresh usage data
  const refreshUsage = async () => {
    if (!user) return;
    
    // Prevent multiple simultaneous refresh calls
    if (isRefreshingRef.current) {
      console.log('[AUTH] Usage refresh already in progress, skipping duplicate call');
      return;
    }
    
    try {
      isRefreshingRef.current = true;
      console.log('[AUTH] Refreshing usage data', { userId: user.id });
      const response = (await authAPI.getUser() as any) as { 
        user: User; 
        usage: Usage; 
        usage_percentages: UsagePercentages;
        subscription_info: SubscriptionInfo;
        trial_info?: TrialInfo;
        subscription_details?: SubscriptionDetails;
        billing_information?: BillingInformation;
        payment_methods?: PaymentMethod[];
        billing_history?: BillingHistory[];
      };
      const { 
        user: userData, 
        usage: usageData, 
        usage_percentages,
        subscription_info,
        trial_info,
        subscription_details,
        billing_information,
        payment_methods,
        billing_history
      } = response;
      
      setUser(userData);
      setUsage(usageData);
      setUsagePercentages(usage_percentages);
      setSubscriptionInfo(subscription_info);
      setTrialInfo(trial_info || null);
      setSubscriptionDetails(subscription_details || null);
      setBillingInformation(billing_information || null);
      setPaymentMethods(payment_methods || null);
      setBillingHistory(billing_history || null);
      
      console.log('[AUTH] Usage data refreshed', { 
        userId: userData.id,
        productsUsed: usageData?.products?.current_month,
        labelsUsed: usageData?.labels?.current_month,
        subscriptionStatus: subscription_info?.status,
        remainingDays: trial_info?.remaining_days || subscription_details?.remaining_days
      });
    } catch (error: any) {
      console.error('[AUTH] Failed to refresh usage data', { 
        userId: user.id,
        error: error.response?.data?.message || error.message 
      });
    } finally {
      isRefreshingRef.current = false;
    }
  };

  // Listen for token refresh events
  useEffect(() => {
    const handleTokenRefresh = (event: CustomEvent) => {
      const { newToken } = event.detail;
      console.log('[AUTH] Token refreshed, updating context');
      setToken(newToken);
    };

    window.addEventListener('tokenRefreshed', handleTokenRefresh as EventListener);
    
    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefresh as EventListener);
    };
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    let isMounted = true; // Flag to prevent duplicate calls in StrictMode
    
    const checkAuth = async () => {
      if (!isMounted) return; // Prevent execution if component unmounted or duplicate call
      
      // Get session info for debugging
      const sessionInfo = TokenManager.getSessionInfo();
      console.log('[AUTH] Current session info:', sessionInfo);
      
      // Determine which token to use based on current path
      const isAdminPath = TokenManager.isAdminContext();
      const { token: savedToken, expiresAt: savedTokenExpiry } = TokenManager.getToken(isAdminPath);
      
      if (savedToken) {
        // Check if token is expired
        if (TokenManager.isTokenExpired(savedTokenExpiry)) {
          console.log('[AUTH] Saved token is expired, removing');
          TokenManager.clearToken(isAdminPath);
          if (isMounted) {
            setToken(null);
            setTokenExpiresAt(null);
            setIsLoading(false);
          }
          return;
        }
        
        console.log('[AUTH] Checking saved token validity');
        try {
          const response = (await authAPI.getUser() as any) as {
            user?: User;
            admin?: Admin;
            user_type?: 'user' | 'admin';
            usage?: Usage;
            usage_percentages?: UsagePercentages;
            subscription_info?: SubscriptionInfo;
            trial_info?: TrialInfo;
            subscription_details?: SubscriptionDetails;
            billing_information?: BillingInformation;
            payment_methods?: PaymentMethod[];
            billing_history?: BillingHistory[];
          };
          
          if (!isMounted) return; // Check again after async operation
          
          const { 
            user: userData, 
            usage: usageData, 
            usage_percentages,
            subscription_info,
            trial_info,
            subscription_details,
            billing_information,
            payment_methods,
            billing_history
          } = response;
          
          console.log('[AUTH] Token validation successful', {
            userId: userData?.id,
            email: userData?.email,
            userType: response.user_type,
            membershipPlan: userData?.membership_plan?.name,
            productsUsed: usageData?.products?.current_month,
            labelsUsed: usageData?.labels?.current_month,
            subscriptionStatus: subscription_info?.status,
            remainingDays: trial_info?.remaining_days || subscription_details?.remaining_days
          });
          
          console.log('[AUTH] Raw API response from /user endpoint:', response);
          console.log('[AUTH] Subscription details received:', subscription_details);
          console.log('[AUTH] Trial info received:', trial_info);
          
          setUser(userData);
          setUsage(usageData);
          setUsagePercentages(usage_percentages);
          setSubscriptionInfo(subscription_info);
          setTrialInfo(trial_info || null);
          setSubscriptionDetails(subscription_details || null);
          setBillingInformation(billing_information || null);
          setPaymentMethods(payment_methods || null);
          setBillingHistory(billing_history || null);
          setToken(savedToken);
          setTokenExpiresAt(savedTokenExpiry);
          
          // Check if this is an admin response
          if (response.user_type === 'admin' || response.admin) {
            setAdmin(response.admin!);
            setUserType('admin');
            setUser(null);
            
            if (window.location.pathname === '/login') {
              console.log('[AUTH] Admin user detected on login page, redirecting to admin panel');
              navigate('/admin-panel');
            }
          } else {
            setUser(userData!);
            setUserType('user');
            setAdmin(null);
          }
        } catch (error) {
          if (!isMounted) return;
          
          console.warn('[AUTH] Token validation failed, removing invalid token', error);
          // Token is invalid, remove it
          TokenManager.clearToken(isAdminPath);
          setToken(null);
          setTokenExpiresAt(null);
          
          // If user was on payment page, redirect to login with payment redirect
          if (window.location.pathname === '/payment') {
            console.log('[AUTH] Redirecting to login from payment page due to invalid token');
            navigate('/login?redirect=payment&sessionExpired=true');
          }
        }
      } else {
        console.log('[AUTH] No saved token found');
        
        // If user is on payment page without a token, redirect to login
        if (window.location.pathname === '/payment') {
          console.log('[AUTH] Redirecting to login from payment page - no token found');
          navigate('/login?redirect=payment');
        }
      }
      
      if (isMounted) {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('[AUTH] Login attempt started', { email });
    try {
      setIsLoading(true);
      const loginData = (await authAPI.login({ email, password }) as any) as {
        access_token: string;
        expires_at?: string;
        expires_in?: number;
        user_type: 'user' | 'admin';
        user?: User;
        admin?: Admin;
        usage?: Usage;
        usage_percentages?: UsagePercentages;
        subscription_info?: SubscriptionInfo;
        trial_info?: TrialInfo;
        subscription_details?: SubscriptionDetails;
        billing_information?: BillingInformation;
        payment_methods?: PaymentMethod[];
        billing_history?: BillingHistory[];
        requires_payment?: boolean;
        payment_status?: string;
        redirect_to?: string;
      };
      
      console.log('[AUTH] Raw login response:', loginData);
      
      const {
        access_token,
        expires_at,
        expires_in,
        user_type,
        user: userData,
        admin: adminData,
        usage: usageData,
        usage_percentages,
        subscription_info,
        trial_info,
        subscription_details,
        billing_information,
        payment_methods,
        billing_history,
        requires_payment,
        payment_status,
        redirect_to
      } = loginData;
      
      console.log('[AUTH] Login successful', {
        userType: user_type,
        userId: userData?.id || adminData?.id,
        email: userData?.email || adminData?.email,
        role: adminData?.role,
        membershipPlan: userData?.membership_plan?.name,
        productsUsed: usageData?.products?.current_month,
        labelsUsed: usageData?.labels?.current_month,
        requires_payment,
        payment_status
      });
      
      // Store tokens separately for admin and user using TokenManager
      const isAdmin = user_type === 'admin';
      TokenManager.setToken(access_token, expires_at, isAdmin);
      
      // Clear the other token type to prevent conflicts
      TokenManager.clearToken(!isAdmin);
      
      if (expires_at) {
        setTokenExpiresAt(expires_at);
      }
      setToken(access_token);
      setUserType(user_type);
      
      if (user_type === 'admin') {
        setAdmin(adminData!);
        setUser(null);
        // Clear user-specific data for admin
        setUsage(null);
        setUsagePercentages(null);
        setSubscriptionInfo(null);
        setTrialInfo(null);
        setSubscriptionDetails(null);
        setBillingInformation(null);
        setPaymentMethods(null);
        setBillingHistory(null);
      } else {
        setUser(userData!);
        setAdmin(null);
        setUsage(usageData || null);
        setUsagePercentages(usage_percentages || null);
        setSubscriptionInfo(subscription_info || null);
        setTrialInfo(trial_info || null);
        setSubscriptionDetails(subscription_details || null);
        setBillingInformation(billing_information || null);
        setPaymentMethods(payment_methods || null);
        setBillingHistory(billing_history || null);
      }
      
      // Check if there's a specific redirect parameter (e.g., from session expiration)
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect');
      
      // Handle redirection based on user type
      if (user_type === 'admin') {
        if (redirect_to || redirectTo === 'admin-panel') {
          console.log('[AUTH] Admin user detected, redirecting to admin panel');
          navigate('/admin-panel');
        } else {
          console.log('[AUTH] Admin user detected, redirecting to admin panel');
          navigate('/admin-panel');
        }
      } else {
        // Regular user logic
        if (redirectTo === 'admin-panel') {
          console.log('[AUTH] Non-admin user trying to access admin panel, redirecting to dashboard');
          navigate('/dashboard');
        } else if (redirectTo === 'payment') {
          console.log('[AUTH] Redirecting back to payment page as requested');
          navigate('/payment');
        } else if (requires_payment) {
          console.log('[AUTH] Payment required, redirecting to payment page');
          navigate('/payment');
        } else {
          console.log('[AUTH] No payment required, redirecting to dashboard');
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('[AUTH] Login failed', {
        email,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.error_code
      });
      
      // Handle IP restriction violation during login
      if (error.response?.data?.error_code === 'IP_RESTRICTION_VIOLATION') {
        console.warn('[AUTH] IP restriction violation during admin login');
        // Redirect to IP restriction error page
        window.location.href = '/admin/ip-restricted';
        return;
      }
      
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    console.log('[AUTH] Registration attempt started', {
      email: userData.email,
      name: userData.name,
      company: userData.company
    });
    try {
      setIsLoading(true);
      const registerData = (await authAPI.register(userData) as any) as { 
        access_token: string; 
        expires_at?: string;
        expires_in?: number;
        user: User; 
        requires_payment?: boolean;
        payment_status?: string;
      };
      
      // Debug: Log the full response to see what we're actually receiving
      console.log('[AUTH] Full registration response:', registerData);
      
      const { access_token, expires_at, expires_in, user: newUser, requires_payment, payment_status } = registerData;
      
      console.log('[AUTH] Registration successful', {
        userId: newUser.id,
        email: newUser.email,
        membershipPlan: newUser.membership_plan?.name,
        requires_payment,
        payment_status,
        fullResponse: registerData
      });
      
      // Don't store token after registration - force user to login for better security
      console.log('[AUTH] Registration successful, redirecting to login page');
      
      // Navigate to login with success parameter
      navigate('/login?registration=success');
    } catch (error: any) {
      console.error('[AUTH] Registration failed', {
        email: userData.email,
        error: error.response?.data?.message || error.message,
        validationErrors: error.response?.data?.errors,
        fullResponse: error.response?.data
      });
      
      // Create a more detailed error object that includes validation errors
      // Preserve the original error structure to avoid losing validation details
      const errorObj = new Error(error.response?.data?.message || 'Registration failed');
      (errorObj as any).response = error.response;
      
      // Ensure validation errors are properly passed through
      if (error.response?.data?.errors) {
        console.log('[AUTH] Validation errors detected, preserving structure:', error.response.data.errors);
      }
      
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('[AUTH] Logout initiated', {
      userId: user?.id,
      email: user?.email
    });
    try {
      if (token) {
        await authAPI.logout();
        console.log('[AUTH] Server logout successful');
      }
    } catch (error) {
      console.error('[AUTH] Server logout error:', error);
    } finally {
      console.log('[AUTH] Local logout completed');
      // Clear all tokens to ensure clean logout
      TokenManager.clearAllTokens();
      setToken(null);
      setTokenExpiresAt(null);
      setUser(null);
      setAdmin(null);
      setUserType(null);
      setUsage(null);
      setUsagePercentages(null);
      setSubscriptionInfo(null);
      setTrialInfo(null);
      setSubscriptionDetails(null);
      setBillingInformation(null);
      setPaymentMethods(null);
      setBillingHistory(null);
      navigate('/login');
    }
  };

  const logoutFromAllDevices = async () => {
    console.log('[AUTH] Logout from all devices initiated', {
      userId: user?.id,
      email: user?.email
    });
    try {
      if (token) {
        await authAPI.logoutFromAllDevices();
        console.log('[AUTH] Server logout from all devices successful');
      }
    } catch (error) {
      console.error('[AUTH] Server logout from all devices error:', error);
      throw new Error('Failed to logout from all devices');
    } finally {
      console.log('[AUTH] Local logout completed after logout from all devices');
      // Clear all tokens to ensure clean logout
      TokenManager.clearAllTokens();
      setToken(null);
      setTokenExpiresAt(null);
      setUser(null);
      setAdmin(null);
      setUserType(null);
      setUsage(null);
      setUsagePercentages(null);
      setSubscriptionInfo(null);
      setTrialInfo(null);
      setSubscriptionDetails(null);
      setBillingInformation(null);
      setPaymentMethods(null);
      setBillingHistory(null);
      navigate('/login');
    }
  };

  const changePassword = async (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }) => {
    console.log('[AUTH] Change password initiated', {
      userId: user?.id,
      email: user?.email
    });
    try {
      await authAPI.changePassword(data);
      console.log('[AUTH] Password change successful');
    } catch (error: any) {
      console.error('[AUTH] Password change failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const deleteAccount = async (password: string) => {
    console.log('[AUTH] Account deletion initiated', {
      userId: user?.id,
      email: user?.email
    });
    try {
      await authAPI.deleteAccount(password);
      console.log('[AUTH] Account deletion successful');
    } catch (error: any) {
      console.error('[AUTH] Account deletion failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      console.log('[AUTH] Local logout completed after account deletion');
      // Clear all tokens to ensure clean logout
      TokenManager.clearAllTokens();
      setToken(null);
      setTokenExpiresAt(null);
      setUser(null);
      setAdmin(null);
      setUserType(null);
      setUsage(null);
      setUsagePercentages(null);
      setSubscriptionInfo(null);
      setTrialInfo(null);
      setSubscriptionDetails(null);
      setBillingInformation(null);
      setPaymentMethods(null);
      setBillingHistory(null);
      navigate('/login');
    }
  };

  const updateUser = async (userData: FormData | Partial<User>) => {
    console.log('[AUTH] Profile update initiated', {
      userId: user?.id,
      email: user?.email
    });
    try {
      const response = (await authAPI.updateProfile(userData) as any) as {
        message: string;
        user: User;
      };
      
      console.log('[AUTH] Profile update successful', {
        userId: response.user.id,
        email: response.user.email
      });
      
      setUser(response.user);
      return response;
    } catch (error: any) {
      console.error('[AUTH] Profile update failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const value = {
     user,
     admin,
     userType,
     token,
     tokenExpiresAt,
     usage,
     usagePercentages,
     subscriptionInfo,
     trialInfo,
     subscriptionDetails,
     billingInformation,
     paymentMethods,
     billingHistory,
     isLoading,
     login,
     register,
     logout,
     logoutFromAllDevices,
     changePassword,
     deleteAccount,
     refreshUsage,
     updateUser,
   };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};