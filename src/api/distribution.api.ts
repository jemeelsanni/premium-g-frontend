// src/api/distribution.api.ts - Updated for your API client
import apiClient from './client';
import { 
  ApiResponse, 
  PaginatedResponse,
  DistributionOrder,
  Customer,
  DistributionTarget,
  WeeklyPerformance
} from '../types';

export interface CreateDistributionOrderData {
  customerId: string;
  locationId: string;
  orderItems: Array<{
    productId: string;
    pallets: number;
    packs: number;
    amount: number;
  }>;
  remark?: string;
}

export interface DistributionFilters {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
  territory?: string;
}

export const distributionApi = {
  // Dashboard & Analytics
  getDashboardStats: async () => {
    const { data } = await apiClient.get<ApiResponse<{
      totalOrders: number;
      totalRevenue: number;
      monthlyProgress: number;
      weeklyProgress: number;
      recentOrders: DistributionOrder[];
      topCustomers: Customer[];
    }>>('/distribution/dashboard/stats');
    return data;
  },

  getAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const { data } = await apiClient.get<ApiResponse<{
      revenue: number;
      orders: number;
      customers: number;
      growth: number;
      monthlyData: Array<{ month: string; revenue: number; orders: number }>;
    }>>(`/analytics/distribution/summary?${params.toString()}`);
    return data;
  },

  // Order Management
  getOrders: async (filters?: DistributionFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<DistributionOrder>>(
      `/distribution/orders?${params.toString()}`
    );
    return data;
  },

  createOrder: async (orderData: CreateDistributionOrderData) => {
    const { data } = await apiClient.post<ApiResponse<{ 
      order: DistributionOrder;
      summary: {
        totalPallets: number;
        totalPacks: number;
        totalAmount: number;
      }
    }>>(
      '/distribution/orders',
      orderData
    );
    return data;
  },

  getOrderById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<{ order: DistributionOrder }>>(
      `/distribution/orders/${id}`
    );
    return data;
  },

  updateOrder: async (id: string, updateData: Partial<DistributionOrder>) => {
    const { data } = await apiClient.put<ApiResponse<{ order: DistributionOrder }>>(
      `/distribution/orders/${id}`,
      updateData
    );
    return data;
  },

  deleteOrder: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/distribution/orders/${id}`
    );
    return data;
  },

  // Customer Management (Standalone B2B Customers)
  getCustomers: async (filters?: CustomerFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<Customer>>(
      `/distribution/customers?${params.toString()}`
    );
    return data;
  },

  createCustomer: async (customerData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    customerType: 'BUSINESS' | 'ENTERPRISE' | 'GOVERNMENT';
    creditLimit?: number;
    paymentTerms?: 'NET_15' | 'NET_30' | 'NET_60' | 'CASH';
    territory?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<{ customer: Customer }>>(
      '/distribution/customers',
      customerData
    );
    return data;
  },

  updateCustomer: async (id: string, customerData: Partial<Customer>) => {
    const { data } = await apiClient.put<ApiResponse<{ customer: Customer }>>(
      `/distribution/customers/${id}`,
      customerData
    );
    return data;
  },

  getCustomerById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<{ 
      customer: Customer;
      stats: {
        totalOrders: number;
        totalSpent: number;
        averageOrderValue: number;
        lastOrderDate: string;
      }
    }>>(`/distribution/customers/${id}`);
    return data;
  },

  getCustomerOrders: async (id: string, page = 1, limit = 10) => {
    const { data } = await apiClient.get<PaginatedResponse<DistributionOrder>>(
      `/distribution/customers/${id}/orders?page=${page}&limit=${limit}`
    );
    return data;
  },

  // Target Management
  getTargets: async () => {
    const { data } = await apiClient.get<ApiResponse<DistributionTarget[]>>('/targets');
    return data;
  },

  getCurrentTarget: async () => {
    const { data } = await apiClient.get<ApiResponse<{
      target: DistributionTarget;
      performance: WeeklyPerformance[];
      summary: {
        monthlyProgress: number;
        currentWeekProgress: number;
        remainingPacks: number;
      }
    }>>('/targets/current');
    return data;
  },

  setTarget: async (targetData: {
    year: number;
    month: number;
    totalPacksTarget: number;
    weeklyTargets: number[];
  }) => {
    const { data } = await apiClient.post<ApiResponse<{ 
      target: DistributionTarget;
      weeklyPerformances: WeeklyPerformance[];
    }>>('/targets', targetData);
    return data;
  },

  updateTarget: async (id: string, targetData: {
    totalPacksTarget?: number;
    weeklyTargets?: number[];
  }) => {
    const { data } = await apiClient.put<ApiResponse<{ target: DistributionTarget }>>(
      `/targets/${id}`,
      targetData
    );
    return data;
  },

  getWeeklyPerformance: async () => {
    const { data } = await apiClient.get<ApiResponse<{
      currentWeek: WeeklyPerformance;
      monthlyPerformances: WeeklyPerformance[];
      trends: {
        weeklyGrowth: number;
        monthlyGrowth: number;
      }
    }>>('/performance/weekly');
    return data;
  },

  // Export functionality
  exportOrders: async (filters?: DistributionFilters, format: 'csv' | 'excel' = 'csv') => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    params.append('format', format);
    
    const response = await apiClient.get(
      `/distribution/orders/export?${params.toString()}`,
      { responseType: 'blob' }
    );
    return response;
  },

  exportCustomers: async (filters?: CustomerFilters, format: 'csv' | 'excel' = 'csv') => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    params.append('format', format);
    
    const response = await apiClient.get(
      `/distribution/customers/export?${params.toString()}`,
      { responseType: 'blob' }
    );
    return response;
  }
};
