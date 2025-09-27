// src/services/authService.ts - Fixed Version
import { BaseApiService } from './api';
import { AuthResponse, User } from '../types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export class AuthService extends BaseApiService {
  constructor() {
    super('/auth');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.post<{
      success: boolean;
      data: {
        accessToken: string;
        user: User;
      };
    }>(credentials, '/login');
    
    // Store token in localStorage
    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
    }
    
    return {
      token: response.data.accessToken,
      user: response.data.user
    };
  }

  async logout(): Promise<void> {
    try {
      await this.post({}, '/logout');
    } finally {
      // Always clear local storage, even if API call fails
      localStorage.removeItem('token');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.get<{
      success: boolean;
      data: User;
    }>('/me');
    
    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.post<AuthResponse>({}, '/refresh');
  }

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }
}

export const authService = new AuthService();