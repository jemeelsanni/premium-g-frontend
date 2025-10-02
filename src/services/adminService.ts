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
  ApiResponse 
} from '../types';

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface CreateProductData {
  productNo: string;
  name: string;
  description?: string;
  packsPerPallet: number;
  pricePerPack: number;
  costPerPack?: number;  // ✅ Added
  module: 'DISTRIBUTION' | 'WAREHOUSE' | 'BOTH';  // ✅ Added
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customerType?: string;  // ✅ Added
  territory?: string;  // ✅ Added
}

export interface CreateLocationData {
  name: string;
  address?: string;
  fuelAdjustment?: number;
  driverWagesPerTrip?: number;
  deliveryNotes?: string;  // ✅ Added
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

export interface AuditFilters {
  userId?: string;
  entity?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
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

  async getCustomers(filters?: any): Promise<PaginatedResponse<Customer>> {
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

  async getLocations(filters?: any): Promise<PaginatedResponse<Location>> {
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

  async getSystemConfig(): Promise<ApiResponse<Record<string, string>>> {
    return this.get<ApiResponse<Record<string, string>>>('/system-config');
  }

  async updateSystemConfig(key: string, value: string): Promise<ApiResponse<{ key: string; value: string }>> {
    return this.put<ApiResponse<{ key: string; value: string }>>({ value }, `/system-config/${key}`);
  }

  // ================================
  // SYSTEM STATS (✅ ADDED)
  // ================================

  async getSystemStats(): Promise<ApiResponse<{
    systemStats: {
      totalUsers: number;
      totalDistributionOrders: number;
      totalTransportOrders: number;
      totalWarehouseSales: number;
      recentAuditLogs: number;
    };
    userStats: Array<{ role: string; _count: { role: number } }>;
    businessStats: {
      distributionRevenue: number;
      transportRevenue: number;
      warehouseRevenue: number;
      totalRevenue: number;
    };
    recentActivity: AuditLog[];
  }>> {
    return this.get<ApiResponse<any>>('/stats');
  }
}

export const adminService = new AdminService();