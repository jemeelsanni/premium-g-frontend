import apiClient from './client';
import { 
  ApiResponse, 
  PaginatedResponse,
  DistributionOrder,
  Product,
  Location
} from '../types';

interface CreateOrderData {
  locationId: string;
  items: Array<{
    productId: string;
    packs: number;
    unitPrice: number;
  }>;
  paymentMethod: string;
  transportCost?: number;
  deliveryDate?: string;
  notes?: string;
}

interface UpdateOrderData {
  status?: string;
  deliveryDate?: string;
  notes?: string;
}

interface PriceAdjustmentData {
  amount: number;
  reason: string;
  type: 'increase' | 'decrease';
}

interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const distributionApi = {
  // Orders
  getOrders: async (filters?: OrderFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<DistributionOrder>>(
      `/distribution/orders?${params.toString()}`
    );
    return data;
  },

  createOrder: async (orderData: CreateOrderData) => {
    const { data } = await apiClient.post<ApiResponse<{ order: DistributionOrder }>>(
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

  updateOrder: async (id: string, updateData: UpdateOrderData) => {
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

  // Price Adjustments
  createPriceAdjustment: async (orderId: string, adjustmentData: PriceAdjustmentData) => {
    const { data } = await apiClient.post(
      `/distribution/orders/${orderId}/price-adjustments`,
      adjustmentData
    );
    return data;
  },

  // Analytics
  getAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const { data } = await apiClient.get(
      `/distribution/analytics/summary?${params.toString()}`
    );
    return data;
  },

  // Products
  getProducts: async () => {
    const { data } = await apiClient.get<ApiResponse<{ products: Product[] }>>(
      '/distribution/products'
    );
    return data;
  },

  // Locations
  getLocations: async () => {
    const { data } = await apiClient.get<ApiResponse<{ locations: Location[] }>>(
      '/distribution/locations'
    );
    return data;
  },
};