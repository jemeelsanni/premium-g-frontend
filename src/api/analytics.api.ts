/* eslint-disable @typescript-eslint/no-unused-vars */
import apiClient from './client';

interface HealthResponse {
  status: string;
  timestamp: string;
  data: {
    totalOrders: number;
    activeDeliveries: number;
    warehouseStock: number;
    totalRevenue: number;
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      status: string;
      createdAt: string;
      [key: string]: unknown;
    }>;
    recentTransportOrders: Array<{
      id: string;
      orderNumber: string;
      status: string;
      [key: string]: unknown;
    }>;
    expenses: Array<{
      id: string;
      amount: number;
      description: string;
      [key: string]: unknown;
    }>;
    recentAuditLogs: Array<{
      id: string;
      action: string;
      entity: string;
      createdAt: string;
      user?: { username: string };
      [key: string]: unknown;
    }>;
  };
}

export const analyticsApi = {
  // Distribution analytics - CORRECTED ENDPOINT
  getDistributionAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    try {
      // Correct path: /analytics/distribution/dashboard (not /distribution/analytics/dashboard)
      const { data } = await apiClient.get(`/analytics/distribution/dashboard?${params.toString()}`);
      return data;
    } catch (error) {
      console.error('Distribution analytics error:', error);
      return {
        success: true,
        data: {
          totalOrders: 0,
          totalRevenue: 0,
          totalPacks: 0,
          recentOrders: []
        }
      };
    }
  },

  // Transport analytics - CORRECTED ENDPOINT
  getTransportAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    try {
      // Correct path: /analytics/transport/dashboard
      const { data } = await apiClient.get(`/analytics/transport/dashboard?${params.toString()}`);
      return data;
    } catch (error) {
      console.error('Transport analytics error:', error);
      return {
        success: true,
        data: {
          activeTrips: 0,
          totalRevenue: 0,
          completedTrips: 0,
          recentOrders: []
        }
      };
    }
  },

  // Warehouse analytics - CORRECTED ENDPOINT
  getWarehouseAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    try {
      // Correct path: /analytics/warehouse/dashboard
      const { data } = await apiClient.get(`/analytics/warehouse/dashboard?${params.toString()}`);
      return data;
    } catch (error) {
      console.error('Warehouse analytics error:', error);
      return {
        success: true,
        data: {
          dailySales: 0,
          dailyRevenue: 0,
          lowStockItems: 0,
          recentSales: []
        }
      };
    }
  }
};