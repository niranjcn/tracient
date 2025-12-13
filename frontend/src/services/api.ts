import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '@/utils/constants';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      // Forbidden - redirect to unauthorized
      window.location.href = '/unauthorized';
    }

    // Extract error message
    const message = 
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(message));
  }
);

export default api;

// Helper functions for common HTTP methods
export const get = <T>(url: string, params?: object): Promise<T> => {
  return api.get(url, { params });
};

export const post = <T>(url: string, data?: unknown): Promise<T> => {
  return api.post(url, data);
};

export const put = <T>(url: string, data?: unknown): Promise<T> => {
  return api.put(url, data);
};

export const patch = <T>(url: string, data?: unknown): Promise<T> => {
  return api.patch(url, data);
};

export const del = <T>(url: string): Promise<T> => {
  return api.delete(url);
};

// Form data upload
export const uploadFile = <T>(url: string, formData: FormData): Promise<T> => {
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
