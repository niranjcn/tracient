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
    
    const response: any = await post<AuthResponse>('/auth/login', credentials);
    console.log('🔍 Login response received:', response);
    
    // Backend returns { success, message, data: { user, accessToken, refreshToken } }
    const data = response.data || response;
    console.log('🔍 Extracted data:', data);
    
    const token = data.accessToken || data.token;
    if (token) {
      console.log('✅ Token found, saving to localStorage');
      localStorage.setItem(TOKEN_KEY, token);
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      }
    } else {
      console.error('❌ No token in response!', { hasData: !!response.data, hasAccessToken: !!data.accessToken, hasToken: !!data.token });
    }
    // Return in expected format with both token and accessToken for compatibility
    return { ...data, token: token || data.token, accessToken: data.accessToken || token };
  },

  // Register
  register: async (data: RegisterData): Promise<{ success: boolean; message: string; userID: string }> => {
    return post('/auth/register', data);
  },

  // Verify OTP
  verifyOTP: async (data: OTPVerification): Promise<AuthResponse> => {
    const response: any = await post<AuthResponse>('/auth/verify-otp', data);
    // Backend returns { success, message, data: { user, accessToken, refreshToken } }
    const authData = response.data || response;
    const token = authData.accessToken || authData.token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    return { ...authData, token: token || authData.token, accessToken: authData.accessToken || token };
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
