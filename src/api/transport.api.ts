import apiClient from './client';
import { 
  ApiResponse, 
  PaginatedResponse,
  TransportOrder,
  TransportAnalytics
} from '../types';

export interface CreateTransportOrderData {
  distributionOrderId?: string;
  orderNumber: string;
  invoiceNumber?: string;
  locationId: string;
  truckId?: string;
  totalOrderAmount: number;
  fuelRequired: number;
  fuelPricePerLiter: number;
  driverDetails?: string;
}

export interface UpdateTransportOrderData {
  deliveryStatus?: string;
  deliveryDate?: string;
  driverDetails?: string;
}

export interface UpdateTruckExpensesData {
  fuelRequired?: number;
  fuelPricePerLiter?: number;
  serviceChargeExpense?: number;
  driverWages?: number;
  truckExpenses?: number;
}

export interface TransportFilters {
  page?: number;
  limit?: number;
  deliveryStatus?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const transportApi = {
  getOrders: async (filters?: TransportFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<TransportOrder>>(
      `/transport/orders?${params.toString()}`
    );
    return data;
  },

  createOrder: async (orderData: CreateTransportOrderData) => {
    const { data } = await apiClient.post<ApiResponse<{ 
      order: TransportOrder;
      financialSummary: {
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

  getOrderById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<{ order: TransportOrder }>>(
      `/transport/orders/${id}`
    );
    return data;
  },

  updateOrder: async (id: string, updateData: UpdateTransportOrderData) => {
    const { data } = await apiClient.put<ApiResponse<{ order: TransportOrder }>>(
      `/transport/orders/${id}`,
      updateData
    );
    return data;
  },

  updateTruckExpenses: async (id: string, expensesData: UpdateTruckExpensesData) => {
    const { data } = await apiClient.put<ApiResponse<{ 
      order: TransportOrder;
      updatedCalculations: {
        totalExpenses: number;
        grossProfit: number;
        netProfit: number;
        profitMargin: number;
      }
    }>>(
      `/transport/orders/${id}/expenses`,
      expensesData
    );
    return data;
  },

  getAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const { data } = await apiClient.get<ApiResponse<TransportAnalytics>>(
      `/transport/analytics/summary?${params.toString()}`
    );
    return data;
  },

  getProfitAnalysis: async (startDate?: string, endDate?: string, locationId?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (locationId) params.append('locationId', locationId);
    
    const { data } = await apiClient.get(
      `/transport/analytics/profit-analysis?${params.toString()}`
    );
    return data;
  },
};