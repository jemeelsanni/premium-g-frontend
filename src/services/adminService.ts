/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/adminService.ts
import { BaseApiService } from './api';
import { 
  User, 
  Customer,
  Product, 
  Location, 
  PaginatedResponse, 
  AuditLog,
  ApiResponse, 
  UserRole
} from '../types';

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole | string;
  isActive?: boolean;
  permissions?: Record<string, any>;
}

export interface CreateProductData {
  productNo: string;
  name: string;
  description?: string;
  packsPerPallet: number;
  pricePerPack: number;
  costPerPack?: number;
  module: 'DISTRIBUTION' | 'WAREHOUSE' | 'BOTH';
}

export interface UpdateProductData {
  productNo?: string;
  name?: string;
  description?: string;
  packsPerPallet?: number;
  pricePerPack?: number;
  costPerPack?: number;
  module?: 'DISTRIBUTION' | 'WAREHOUSE' | 'BOTH';
  isActive?: boolean;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customerType?: string;
  territory?: string;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  customerType?: string;
  territory?: string;
  isActive?: boolean;
}

export interface CreateLocationData {
  name: string;
  address?: string;
  fuelAdjustment?: number;
  driverWagesPerTrip?: number;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
  customerType?: string;
  territory?: string;
}

export interface LocationFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface AuditFilters {
  userId?: string;
  entity?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface UserActivity {
  totalActions: number;
  recentActions: any[];
  actionsByType: Record<string, number>;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Array<{ role: string; _count: { role: number } }>;
  recentLogins: Array<{
    id: string;
    username: string;
    role: string;
    lastLoginAt: string;
  }>;
}

export interface SystemConfig {
  key: string;
  value: string;
  description?: string;
}

export class AdminService extends BaseApiService {
  constructor() {
    super('/admin');
  }

  // ================================
  // USER MANAGEMENT
  // ================================

  async getUsers(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<PaginatedResponse<User>>(`/users?${params.toString()}`);
  }

  async createUser(userData: CreateUserData): Promise<ApiResponse<{ user: User }>> {
    return this.post<ApiResponse<{ user: User }>>(userData, '/users');
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return this.put<ApiResponse<{ user: User }>>(userData, `/users/${id}`);
  }

  async deleteUser(id: string): Promise<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`/users/${id}`);
  }

  // ✅ NEW: Get user activity
  async getUserActivity(id: string, days: number = 30): Promise<ApiResponse<{ activity: UserActivity }>> {
    return this.get<ApiResponse<{ activity: UserActivity }>>(`/users/${id}/activity?days=${days}`);
  }

  // ✅ NEW: Get user statistics
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return this.get<ApiResponse<UserStats>>('/users/stats/summary');
  }

  // ================================
  // PRODUCT MANAGEMENT
  // ================================

  async getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<PaginatedResponse<Product>>(`/products?${params.toString()}`);
  }

  async createProduct(productData: CreateProductData): Promise<ApiResponse<{ product: Product }>> {
    return this.post<ApiResponse<{ product: Product }>>(productData, '/products');
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<ApiResponse<{ product: Product }>> {
    return this.put<ApiResponse<{ product: Product }>>(productData, `/products/${id}`);
  }

  async deleteProduct(id: string): Promise<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`/products/${id}`);
  }

  // ================================
  // CUSTOMER MANAGEMENT
  // ================================

  async getCustomers(filters?: CustomerFilters): Promise<PaginatedResponse<Customer>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<PaginatedResponse<Customer>>(`/customers?${params.toString()}`);
  }

  async createCustomer(customerData: CreateCustomerData): Promise<ApiResponse<{ customer: Customer }>> {
    return this.post<ApiResponse<{ customer: Customer }>>(customerData, '/customers');
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<ApiResponse<{ customer: Customer }>> {
    return this.put<ApiResponse<{ customer: Customer }>>(customerData, `/customers/${id}`);
  }

  async deleteCustomer(id: string): Promise<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`/customers/${id}`);
  }

  // ================================
  // LOCATION MANAGEMENT
  // ================================

  async getLocations(filters?: LocationFilters): Promise<PaginatedResponse<Location>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<PaginatedResponse<Location>>(`/locations?${params.toString()}`);
  }

  async createLocation(locationData: CreateLocationData): Promise<ApiResponse<{ location: Location }>> {
    return this.post<ApiResponse<{ location: Location }>>(locationData, '/locations');
  }

  async updateLocation(id: string, locationData: Partial<Location>): Promise<ApiResponse<{ location: Location }>> {
    return this.put<ApiResponse<{ location: Location }>>(locationData, `/locations/${id}`);
  }

  async deleteLocation(id: string): Promise<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`/locations/${id}`);
  }

  // ================================
  // AUDIT TRAIL
  // ================================

  // ✅ NEW: Get audit trail
  async getAuditTrail(filters?: AuditFilters): Promise<PaginatedResponse<AuditLog>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<PaginatedResponse<AuditLog>>(`/audit-trail?${params.toString()}`);
  }

  // ================================
  // SYSTEM CONFIGURATION
  // ================================

  // ✅ NEW: Get system configuration
  async getSystemConfig(): Promise<ApiResponse<{ configs: SystemConfig[] }>> {
    return this.get<ApiResponse<{ configs: SystemConfig[] }>>('/system-config');
  }

  // ✅ NEW: Update system configuration
  async updateSystemConfig(key: string, value: string): Promise<ApiResponse<{ config: SystemConfig }>> {
    return this.put<ApiResponse<{ config: SystemConfig }>>({ value }, `/system-config/${key}`);
  }
}

export const adminService = new AdminService();