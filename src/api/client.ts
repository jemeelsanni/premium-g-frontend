// src/api/client.ts - Updated with correct port
import axios, { AxiosResponse, AxiosError } from 'axios';

// Create axios instance with correct backend port
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
  withCredentials: false, // Don't send cookies
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
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.status);
    }
    return response;
  },
  (error: AxiosError) => {
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }

    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - backend may be down');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network error - backend may be down or wrong port');
    } else if (error.response?.status === 401) {
      // Clear token and redirect to login only if we're not already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      // Forbidden - redirect to unauthorized page
      window.location.href = '/unauthorized';
    }

    return Promise.reject(error);
  }
);

// Export configured client
export default apiClient;