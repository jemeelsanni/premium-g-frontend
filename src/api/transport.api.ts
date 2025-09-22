import apiClient from './client';
import { 
  ApiResponse, 
  PaginatedResponse,
  TransportOrder
} from '../types';

interface CreateTransportOrderData {
  distributionOrderId?: string;
  driverId: string;
  vehicleNumber: string;
  origin: string;
  destination: string;
  cost: number;
  distance?: number;
  departureDate: string;
  notes?: string;
}

interface UpdateTransportOrderData {
  status?: string;
  arrivalDate?: string;
  notes?: string;
}

interface TransportFilters {
  page?: number;
  limit?: number;
  status?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const transportApi = {
  // Transport Orders
  getOrders: async (filters?: TransportFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<TransportOrder>>(
      `/transport/orders?${params.toString()}`
    );
    return data;
  },

  createOrder: async (orderData: CreateTransportOrderData) => {
    const { data } = await apiClient.post<ApiResponse<{ order: TransportOrder }>>(
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

  deleteOrder: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/transport/orders/${id}`
    );
    return data;
  },

  // Analytics
  getAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const { data } = await apiClient.get(
      `/transport/analytics/summary?${params.toString()}`
    );
    return data;
  },
};