/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse, AxiosError } from 'axios';

// Create axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  field?: string;
}

// Base API service class
export class BaseApiService {
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async get<T>(path = ''): Promise<T> {
    const response = await apiClient.get(`${this.endpoint}${path}`);
    return response.data;
  }

  async post<T>(data: any, path = ''): Promise<T> {
    const response = await apiClient.post(`${this.endpoint}${path}`, data);
    return response.data;
  }

  async put<T>(data: any, path = ''): Promise<T> {
    const response = await apiClient.put(`${this.endpoint}${path}`, data);
    return response.data;
  }

  async delete<T>(path = ''): Promise<T> {
    const response = await apiClient.delete(`${this.endpoint}${path}`);
    return response.data;
  }
}

export default apiClient;