import apiClient from './client';

interface OrderItem {
  productId: string;
  pallets: number;
  packs: number;
}

interface CreateOrderData {
  customerId: string;
  locationId: string;
  orderItems: OrderItem[];
  remark?: string;
}

interface UpdateOrderData {
  status?: string;
  transporterCompany?: string;
  driverNumber?: string;
  remark?: string;
}

interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
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
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get(
      `/distribution/orders?${params.toString()}`
    );
    return data;
  },

  createOrder: async (orderData: CreateOrderData) => {
    const { data } = await apiClient.post(
      '/distribution/orders',
      orderData
    );
    return data;
  },

  getOrderById: async (id: string) => {
    const { data } = await apiClient.get(
      `/distribution/orders/${id}`
    );
    return data;
  },

  updateOrder: async (id: string, updateData: UpdateOrderData) => {
    const { data } = await apiClient.put(
      `/distribution/orders/${id}`,
      updateData
    );
    return data;
  },

  deleteOrder: async (id: string) => {
    const { data } = await apiClient.delete(
      `/distribution/orders/${id}`
    );
    return data;
  },

  // Products - Get distribution-specific products
  getProducts: async () => {
  const { data } = await apiClient.get('/distribution/products');
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
};