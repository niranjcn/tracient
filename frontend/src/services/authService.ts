import { post, get } from './api';
import { AuthResponse, LoginCredentials, RegisterData, OTPVerification } from '@/types';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/utils/constants';
import mockAuthService from './mockAuthService';

// Toggle this to switch between mock and real auth
const USE_MOCK_AUTH = false;

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (USE_MOCK_AUTH) {
      return mockAuthService.login(credentials);
    }
    
    const response = await post<AuthResponse>('/auth/login', credentials);
    if (response.token) {
      localStorage.setItem(TOKEN_KEY, response.token);
      if (response.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      }
    }
    return response;
  },

  // Register
  register: async (data: RegisterData): Promise<{ success: boolean; message: string; userID: string }> => {
    return post('/auth/register', data);
  },

  // Verify OTP
  verifyOTP: async (data: OTPVerification): Promise<AuthResponse> => {
    const response = await post<AuthResponse>('/auth/verify-otp', data);
    if (response.token) {
      localStorage.setItem(TOKEN_KEY, response.token);
    }
    return response;
  },

  // Logout
  logout: async (): Promise<void> => {
    if (USE_MOCK_AUTH) {
      return mockAuthService.logout();
    }
    
    try {
      await post('/auth/logout');
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  // Refresh token
  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const response = await post<AuthResponse>('/auth/refresh-token', { refreshToken });
    if (response.token) {
      localStorage.setItem(TOKEN_KEY, response.token);
    }
    return response;
  },

  // Get current user
  getCurrentUser: async () => {
    if (USE_MOCK_AUTH) {
      return mockAuthService.getCurrentUser();
    }
    return get('/auth/me');
  },

  // Check if authenticated
  isAuthenticated: (): boolean => {
    if (USE_MOCK_AUTH) {
      return mockAuthService.isAuthenticated();
    }
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Get stored token
  getToken: (): string | null => {
    if (USE_MOCK_AUTH) {
      return mockAuthService.getToken();
    }
    return localStorage.getItem(TOKEN_KEY);
  },

  // Send password reset email
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    return post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    return post('/auth/reset-password', { token, password });
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    return post('/auth/change-password', { currentPassword, newPassword });
  },

  // Resend OTP
  resendOTP: async (userID: string): Promise<{ success: boolean; message: string }> => {
    return post('/auth/resend-otp', { userID });
  },
};

export default authService;
