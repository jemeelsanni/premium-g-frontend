/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiResponse, PaginatedResponse } from '@/types';
import apiClient from './client';

export interface CreateTransportOrderData {
  orderNumber: string;
  clientName: string;
  clientPhone?: string;
  pickupLocation: string;
  deliveryAddress: string;
  locationId: string;
  truckId?: string;
  totalOrderAmount: number;
  fuelRequired: number;
  fuelPricePerLiter: number;
  serviceChargePercentage?: number;
  driverDetails?: string;
}

export const transportApi = {
  // Dashboard & Analytics
  getDashboardStats: async () => {
    const { data } = await apiClient.get<ApiResponse<{
      activeTrips: number;
      totalRevenue: number;
      monthlyProfit: number;
      fleetUtilization: number;
      recentOrders: any[];
      topRoutes: any[];
    }>>('/transport/dashboard/stats');
    return data;
  },

  getAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const { data } = await apiClient.get<ApiResponse<{
      revenue: number;
      profit: number;
      trips: number;
      expenses: number;
      profitMargin: number;
      monthlyData: Array<{ month: string; revenue: number; profit: number }>;
    }>>(`/analytics/transport/summary?${params.toString()}`);
    return data;
  },

  // Standalone Transport Orders (No Distribution Dependencies)
  getOrders: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<any>>(
      `/transport/orders?${params.toString()}`
    );
    return data;
  },

  createOrder: async (orderData: CreateTransportOrderData) => {
    const { data } = await apiClient.post<ApiResponse<{ 
      order: any;
      profitCalculation: {
        revenue: number;
        totalExpenses: number;
        grossProfit: number;
        netProfit: number;
        profitMargin: number;
      }
    }>>(
      '/transport/orders',
      orderData
    );
    return data;
  },

  updateOrderExpenses: async (id: string, expensesData: any) => {
    const { data } = await apiClient.put<ApiResponse<{ 
      order: any;
      updatedProfits: {
        totalExpenses: number;
        netProfit: number;
        profitMargin: number;
      }
    }>>(
      `/transport/orders/${id}/expenses`,
      expensesData
    );
    return data;
  },

  // Fleet Management
  getTrucks: async () => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/trucks');
    return data;
  },

  createTruck: async (truckData: {
    truckId: string;
    registrationNumber?: string;
    maxPallets: number;
    make?: string;
    model?: string;
    year?: number;
  }) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/trucks', truckData);
    return data;
  },

  getTruckPerformance: async (truckId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const { data } = await apiClient.get<ApiResponse<{
      truck: any;
      performance: {
        totalTrips: number;
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        utilizationRate: number;
      }
    }>>(`/analytics/transport/trucks/${truckId}/performance?${params.toString()}`);
    return data;
  },

  // Expenses Management
  getExpenses: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<any>>(
      `/transport/expenses?${params.toString()}`
    );
    return data;
  },

  createExpense: async (expenseData: any) => {
    const { data } = await apiClient.post<ApiResponse<any>>('/transport/expenses', expenseData);
    return data;
  },

  approveExpenses: async (expenseIds: string[]) => {
    const { data } = await apiClient.post<ApiResponse<{
      approved: number;
      totalAmount: number;
    }>>('/transport/expenses/bulk-approve', { ids: expenseIds });
    return data;
  }
};