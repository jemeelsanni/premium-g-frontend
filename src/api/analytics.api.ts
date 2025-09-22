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
  // Get dashboard statistics - Try system status first, fallback to basic health
  getDashboardStats: async (): Promise<HealthResponse> => {
    try {
      // Correct endpoint path - no /v1 prefix
      const { data } = await apiClient.get<HealthResponse>('/system/status');
      return data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Fallback: return empty stats structure if not authorized
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        data: {
          totalOrders: 0,
          activeDeliveries: 0,
          warehouseStock: 0,
          totalRevenue: 0,
          recentOrders: [],
          recentTransportOrders: [],
          expenses: [],
          recentAuditLogs: []
        }
      };
    }
  },

  // Distribution analytics
  getDistributionAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const { data } = await apiClient.get(`/distribution/analytics/summary?${params.toString()}`);
    return data;
  },

  // Transport analytics
  getTransportAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const { data } = await apiClient.get(`/transport/analytics/summary?${params.toString()}`);
    return data;
  },

  // Warehouse analytics
  getWarehouseAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const { data } = await apiClient.get(`/warehouse/analytics/summary?${params.toString()}`);
    return data;
  },

  // Profit analysis
  getProfitAnalysis: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const { data } = await apiClient.get(`/analytics/profit/summary?${params.toString()}`);
    return data;
  },
};