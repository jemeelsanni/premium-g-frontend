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
    const response = await this.post<AuthResponse>(credentials, '/login');
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response;
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
    return this.get<User>('/me');
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