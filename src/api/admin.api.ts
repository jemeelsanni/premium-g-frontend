import apiClient from './client';
import { 
  User, 
  Customer,
  Product, 
  Location, 
  PaginatedResponse, 
  AuditLog,
  ApiResponse 
} from '../types';

// Define admin-specific types if needed
interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: string;
}

interface CreateProductData {
  productNo: string;
  name: string;
  description?: string;
  packsPerPallet: number;
  pricePerPack: number;
}

interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface CreateLocationData {
  name: string;
  address?: string;
  fuelAdjustment?: number;
  driverWagesPerTrip?: number;
}

interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}

interface ProductFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

interface CustomerFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

interface LocationFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

interface AuditFilters {
  userId?: string;
  entity?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const adminApi = {
  // User Management
  getUsers: async (filters?: UserFilters): Promise<PaginatedResponse<User>> => {
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

  createUser: async (userData: CreateUserData): Promise<ApiResponse<{ user: User }>> => {
    const { data } = await apiClient.post<ApiResponse<{ user: User }>>(
      '/admin/users',
      userData
    );
    return data;
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    const { data } = await apiClient.put<ApiResponse<{ user: User }>>(
      `/admin/users/${id}`,
      userData
    );
    return data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/admin/users/${id}`
    );
    return data;
  },

  // Product Management
  getProducts: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<Product>>(
      `/admin/products?${params.toString()}`
    );
    return data;
  },

  createProduct: async (productData: CreateProductData): Promise<ApiResponse<{ product: Product }>> => {
    const { data } = await apiClient.post<ApiResponse<{ product: Product }>>(
      '/admin/products',
      productData
    );
    return data;
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<ApiResponse<{ product: Product }>> => {
    const { data } = await apiClient.put<ApiResponse<{ product: Product }>>(
      `/admin/products/${id}`,
      productData
    );
    return data;
  },

  deleteProduct: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/admin/products/${id}`
    );
    return data;
  },

  // Customer Management
  getCustomers: async (filters?: CustomerFilters): Promise<PaginatedResponse<Customer>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<Customer>>(
      `/admin/customers?${params.toString()}`
    );
    return data;
  },

  createCustomer: async (customerData: CreateCustomerData): Promise<ApiResponse<{ customer: Customer }>> => {
    const { data } = await apiClient.post<ApiResponse<{ customer: Customer }>>(
      '/admin/customers',
      customerData
    );
    return data;
  },

  updateCustomer: async (id: string, customerData: Partial<Customer>): Promise<ApiResponse<{ customer: Customer }>> => {
    const { data } = await apiClient.put<ApiResponse<{ customer: Customer }>>(
      `/admin/customers/${id}`,
      customerData
    );
    return data;
  },

  deleteCustomer: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/admin/customers/${id}`
    );
    return data;
  },

  // Location Management
  getLocations: async (filters?: LocationFilters): Promise<PaginatedResponse<Location>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<Location>>(
      `/admin/locations?${params.toString()}`
    );
    return data;
  },

  createLocation: async (locationData: CreateLocationData): Promise<ApiResponse<{ location: Location }>> => {
    const { data } = await apiClient.post<ApiResponse<{ location: Location }>>(
      '/admin/locations',
      locationData
    );
    return data;
  },

  updateLocation: async (id: string, locationData: Partial<Location>): Promise<ApiResponse<{ location: Location }>> => {
    const { data } = await apiClient.put<ApiResponse<{ location: Location }>>(
      `/admin/locations/${id}`,
      locationData
    );
    return data;
  },

  deleteLocation: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/admin/locations/${id}`
    );
    return data;
  },

  // Audit Trail
  getAuditTrail: async (filters?: AuditFilters): Promise<PaginatedResponse<AuditLog>> => {
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
  getSystemConfig: async (): Promise<ApiResponse<Record<string, string>>> => {
    const { data } = await apiClient.get<ApiResponse<Record<string, string>>>('/admin/system-config');
    return data;
  },

  updateSystemConfig: async (key: string, value: string): Promise<ApiResponse<{ key: string; value: string }>> => {
    const { data } = await apiClient.put<ApiResponse<{ key: string; value: string }>>(
      `/admin/system-config/${key}`, 
      { value }
    );
    return data;
  },
};