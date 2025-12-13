import { get, post, put, del } from './api';
import { User, PaginatedResponse } from '@/types';

export interface UserQueryParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}

export const userService = {
  // Get all users (admin only)
  getUsers: async (params?: UserQueryParams): Promise<PaginatedResponse<User>> => {
    return get('/admin/users', params);
  },

  // Get user by ID
  getUser: async (userID: string): Promise<User> => {
    return get(`/admin/users/${userID}`);
  },

  // Create new user (admin only)
  createUser: async (data: Partial<User> & { password: string }): Promise<{ success: boolean; userID: string; enrollmentSecret?: string }> => {
    return post('/admin/users/create', data);
  },

  // Update user
  updateUser: async (userID: string, data: Partial<User>): Promise<{ success: boolean; user: User }> => {
    return put(`/admin/users/${userID}`, data);
  },

  // Update user status
  updateUserStatus: async (userID: string, status: 'active' | 'suspended'): Promise<{ success: boolean }> => {
    return put(`/admin/users/${userID}/status`, { status });
  },

  // Delete user
  deleteUser: async (userID: string): Promise<{ success: boolean }> => {
    return del(`/admin/users/${userID}`);
  },

  // Reset user password
  resetUserPassword: async (userID: string): Promise<{ success: boolean; temporaryPassword: string }> => {
    return post(`/admin/users/${userID}/reset-password`);
  },

  // Get user login history
  getUserLoginHistory: async (userID: string, limit?: number): Promise<Array<{ timestamp: string; ip: string; device: string; status: string }>> => {
    return get(`/admin/users/${userID}/login-history`, { limit });
  },

  // Update own profile
  updateProfile: async (data: Partial<User>): Promise<{ success: boolean; user: User }> => {
    return put('/user/profile', data);
  },

  // Get own profile
  getProfile: async (): Promise<User> => {
    return get('/user/profile');
  },

  // Upload profile image
  uploadProfileImage: async (file: File): Promise<{ success: boolean; imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    return post('/user/profile/image', formData);
  },

  // Get user activity
  getUserActivity: async (userID: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<{ action: string; timestamp: string; details: string }>> => {
    return get(`/admin/users/${userID}/activity`, params);
  },

  // Bulk user operations
  bulkUpdateStatus: async (userIDs: string[], status: 'active' | 'suspended'): Promise<{ success: number; failed: number }> => {
    return post('/admin/users/bulk-status', { userIDs, status });
  },
};

export default userService;
