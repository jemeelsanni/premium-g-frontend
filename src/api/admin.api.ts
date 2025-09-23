import apiClient from './client';
import { 
  ApiResponse, 
  PaginatedResponse,
  User,
  Product,
  Location,
  AuditLog
} from '../types';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const adminApi = {
  // User Management
  getUsers: async (filters?: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<User>>(
      `/admin/users?${params.toString()}`
    );
    return data;
  },

  createUser: async (userData: {
    username: string;
    email: string;
    password: string;
    role: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<{ user: User }>>(
      '/admin/users',
      userData
    );
    return data;
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    const { data } = await apiClient.put<ApiResponse<{ user: User }>>(
      `/admin/users/${id}`,
      userData
    );
    return data;
  },

  deleteUser: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/admin/users/${id}`
    );
    return data;
  },

  // Product Management
  getProducts: async (filters?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get(
      `/admin/products?${params.toString()}`
    );
    return data;
  },

  createProduct: async (productData: {
    productNo: string;
    name: string;
    description?: string;
    packsPerPallet: number;
    pricePerPack: number;
  }) => {
    const { data } = await apiClient.post<ApiResponse<{ product: Product }>>(
      '/admin/products',
      productData
    );
    return data;
  },

  updateProduct: async (id: string, productData: Partial<Product>) => {
    const { data } = await apiClient.put<ApiResponse<{ product: Product }>>(
      `/admin/products/${id}`,
      productData
    );
    return data;
  },

  deleteProduct: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/admin/products/${id}`
    );
    return data;
  },

  // Customer Management
  getCustomers: async (filters?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get(
      `/admin/customers?${params.toString()}`
    );
    return data;
  },

  createCustomer: async (customerData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<{ customer: Customer }>>(
      '/admin/customers',
      customerData
    );
    return data;
  },

  updateCustomer: async (id: string, customerData: Partial<Customer>) => {
    const { data } = await apiClient.put<ApiResponse<{ customer: Customer }>>(
      `/admin/customers/${id}`,
      customerData
    );
    return data;
  },

  deleteCustomer: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/admin/customers/${id}`
    );
    return data;
  },

  // Location Management
  getLocations: async (filters?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get(
      `/admin/locations?${params.toString()}`
    );
    return data;
  },

  createLocation: async (locationData: {
    name: string;
    address?: string;
    fuelAdjustment?: number;
    driverWagesPerTrip?: number;
  }) => {
    const { data } = await apiClient.post<ApiResponse<{ location: Location }>>(
      '/admin/locations',
      locationData
    );
    return data;
  },

  updateLocation: async (id: string, locationData: Partial<Location>) => {
    const { data } = await apiClient.put<ApiResponse<{ location: Location }>>(
      `/admin/locations/${id}`,
      locationData
    );
    return data;
  },

  deleteLocation: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/admin/locations/${id}`
    );
    return data;
  },

  // Audit Trail
  getAuditTrail: async (filters?: {
    userId?: string;
    entity?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<AuditLog>>(
      `/admin/audit-trail?${params.toString()}`
    );
    return data;
  },

  // System Config
  getSystemConfig: async () => {
    const { data } = await apiClient.get('/admin/system-config');
    return data;
  },

  updateSystemConfig: async (key: string, value: string) => {
    const { data } = await apiClient.put(`/admin/system-config/${key}`, { value });
    return data;
  },
};