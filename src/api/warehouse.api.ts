import apiClient from './client';
import { 
  ApiResponse, 
  PaginatedResponse,
  WarehouseInventory,
  WarehouseSale,
  CashFlow
} from '../types';

interface CreateSaleData {
  productId: string;
  quantity: number;
  unitPrice: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
}

interface CreateCashFlowData {
  type: 'INFLOW' | 'OUTFLOW';
  amount: number;
  description: string;
  category?: string;
}

interface UpdateInventoryData {
  quantity?: number;
  location?: string;
  minimumStock?: number;
  notes?: string;
}

export const warehouseApi = {
  // Inventory
  getInventory: async (filters?: { productId?: string; location?: string; lowStock?: boolean }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    const { data } = await apiClient.get<ApiResponse<{ inventory: WarehouseInventory[] }>>(
      `/warehouse/inventory?${params.toString()}`
    );
    return data;
  },

  updateInventory: async (id: string, updateData: Partial<UpdateInventoryData>) => {
    const { data } = await apiClient.put<ApiResponse<{ inventory: WarehouseInventory }>>(
      `/warehouse/inventory/${id}`,
      updateData
    );
    return data;
  },

  // Sales
  getSales: async (filters?: {
    page?: number;
    limit?: number;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<WarehouseSale>>(
      `/warehouse/sales?${params.toString()}`
    );
    return data;
  },

  createSale: async (saleData: CreateSaleData) => {
    const { data } = await apiClient.post<ApiResponse<{ sale: WarehouseSale }>>(
      '/warehouse/sales',
      saleData
    );
    return data;
  },

  getSaleById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<{ sale: WarehouseSale }>>(
      `/warehouse/sales/${id}`
    );
    return data;
  },

  // Cash Flow
  getCashFlow: async (filters?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<CashFlow>>(
      `/warehouse/cash-flow?${params.toString()}`
    );
    return data;
  },

  createCashFlow: async (cashFlowData: CreateCashFlowData) => {
    const { data } = await apiClient.post<ApiResponse<{ cashFlow: CashFlow }>>(
      '/warehouse/cash-flow',
      cashFlowData
    );
    return data;
  },

  // Analytics
  getAnalytics: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const { data } = await apiClient.get(
      `/warehouse/analytics/summary?${params.toString()}`
    );
    return data;
  },
};