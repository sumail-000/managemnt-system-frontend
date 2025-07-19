import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

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

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  company?: string;
  contact_number?: string;
  tax_id?: string;
  membershipPlan?: {
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

interface AuthContextType {
  user: User | null;
  token: string | null;
  usage: Usage | null;
  usagePercentages: UsagePercentages | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
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
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [usage, setUsage] = useState<Usage | null>(null);
  const [usagePercentages, setUsagePercentages] = useState<UsagePercentages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Refresh usage data
  const refreshUsage = async () => {
    if (!user) return;
    
    try {
      console.log('[AUTH] Refreshing usage data', { userId: user.id });
      const response = (await authAPI.getUser() as any) as { user: User; usage: Usage; usage_percentages: UsagePercentages };
      const { user: userData, usage: usageData, usage_percentages } = response;
      
      setUser(userData);
      setUsage(usageData);
      setUsagePercentages(usage_percentages);
      
      console.log('[AUTH] Usage data refreshed', { 
        userId: userData.id,
        productsUsed: usageData?.products?.current_month,
        labelsUsed: usageData?.labels?.current_month
      });
    } catch (error: any) {
      console.error('[AUTH] Failed to refresh usage data', { 
        userId: user.id,
        error: error.response?.data?.message || error.message 
      });
    }
  };

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        console.log('[AUTH] Checking saved token validity');
        try {
          const response = (await authAPI.getUser() as any) as { user: User; usage: Usage; usage_percentages: UsagePercentages };
          const { user: userData, usage: usageData, usage_percentages } = response;
          
          console.log('[AUTH] Token validation successful', {
            userId: userData.id,
            email: userData.email,
            role: userData.role,
            membershipPlan: userData.membershipPlan?.name,
            productsUsed: usageData?.products?.current_month,
            labelsUsed: usageData?.labels?.current_month
          });
          
          setUser(userData);
          setUsage(usageData);
          setUsagePercentages(usage_percentages);
          setToken(savedToken);
        } catch (error) {
          console.warn('[AUTH] Token validation failed, removing invalid token', error);
          // Token is invalid, remove it
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      } else {
        console.log('[AUTH] No saved token found');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('[AUTH] Login attempt started', { email });
    try {
      setIsLoading(true);
      const loginData = (await authAPI.login({ email, password }) as any) as { access_token: string; user: User; usage: Usage; usage_percentages: UsagePercentages };
      
      const { access_token, user: userData, usage: usageData, usage_percentages } = loginData;
      
      console.log('[AUTH] Login successful', {
        userId: userData.id,
        email: userData.email,
        role: userData.role,
        membershipPlan: userData.membershipPlan?.name,
        productsUsed: usageData?.products?.current_month,
        labelsUsed: usageData?.labels?.current_month
      });
      
      localStorage.setItem('auth_token', access_token);
      setToken(access_token);
      setUser(userData);
      setUsage(usageData);
      setUsagePercentages(usage_percentages);
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('[AUTH] Login failed', {
        email,
        error: error.response?.data?.message || error.message
      });
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
      const registerData = (await authAPI.register(userData) as any) as { access_token: string; user: User };
      
      const { access_token, user: newUser } = registerData;
      
      console.log('[AUTH] Registration successful', {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        membershipPlan: newUser.membershipPlan?.name
      });
      
      localStorage.setItem('auth_token', access_token);
      setToken(access_token);
      setUser(newUser);
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('[AUTH] Registration failed', {
        email: userData.email,
        error: error.response?.data?.message || error.message,
        validationErrors: error.response?.data?.errors
      });
      throw new Error(error.response?.data?.message || 'Registration failed');
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
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      setUsage(null);
      setUsagePercentages(null);
      navigate('/login');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const value = {
    user,
    token,
    usage,
    usagePercentages,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUsage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};