import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { authService } from '@/services';
import { showToast } from '@/components/common';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  updateUser: (user: User) => void;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  aadhaarNumber?: string;
  organizationName?: string;
  organizationType?: string;
  department?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Optionally verify token with backend
          // const response = await authService.getCurrentUser();
          // setUser(response.data);
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ identifier: email, password });
      
      // Handle both mock auth format and real API format
      const accessToken = response.token || response.data?.accessToken;
      const refreshToken = response.refreshToken || response.data?.refreshToken;
      const userData = response.user || response.data?.user;
      
      if (!accessToken || !userData) {
        throw new Error('Invalid response format');
      }
      
      // Create full user object with defaults for missing fields
      const fullUser: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as UserRole,
        orgMSP: userData.orgMSP,
        idHash: userData.idHash || '',
        status: (userData.status as 'active' | 'suspended' | 'pending') || 'active',
        createdAt: userData.createdAt || new Date().toISOString(),
      };
      
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(fullUser));
      
      setUser(fullUser);
      showToast.success('Login successful!');
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Login failed. Please try again.';
      showToast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      // Convert to API RegisterData format
      const apiData = {
        role: data.role as 'worker' | 'employer' | 'government' | 'admin',
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        aadhaar: data.aadhaarNumber,
        businessName: data.organizationName,
        department: data.department,
      };
      await authService.register(apiData as any);
      showToast.success('Registration successful! Please verify your email.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      showToast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await authService.verifyOTP({ userID: email, otp });
      
      // Handle both mock auth format and real API format
      const accessToken = response.token || response.data?.accessToken;
      const refreshToken = response.refreshToken || response.data?.refreshToken;
      const userData = response.user || response.data?.user;
      
      if (!accessToken || !userData) {
        throw new Error('Invalid response format');
      }
      
      // Create full user object with defaults for missing fields
      const fullUser: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as UserRole,
        orgMSP: userData.orgMSP,
        idHash: userData.idHash || '',
        status: (userData.status as 'active' | 'suspended' | 'pending') || 'active',
        createdAt: userData.createdAt || new Date().toISOString(),
      };
      
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(fullUser));
      
      setUser(fullUser);
      showToast.success('Email verified successfully!');
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Verification failed. Please try again.';
      showToast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    showToast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    verifyOTP,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
