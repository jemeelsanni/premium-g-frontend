import apiClient from './client';
import { 
  LoginRequest, 
  AuthResponse, 
  ApiResponse, 
  User,
  ChangePasswordRequest,
  Session
} from '../types';



export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  // Logout
  logout: async (): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return data;
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const { data } = await apiClient.get<ApiResponse<{ user: User }>>('/auth/profile');
    return data;
  },

  // Change password
  changePassword: async (passwords: ChangePasswordRequest): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/change-password', passwords);
    return data;
  },

  // Verify token
  verifyToken: async (): Promise<ApiResponse<{ valid: boolean }>> => {
    const { data } = await apiClient.post<ApiResponse<{ valid: boolean }>>('/auth/verify-token');
    return data;
  },

  // Get user sessions
  getSessions: async (): Promise<ApiResponse<{ sessions: Session[] }>> => {
    const { data } = await apiClient.get<ApiResponse<{ sessions: Session[] }>>('/auth/sessions');
    return data;
  },
};