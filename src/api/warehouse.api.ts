/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiResponse, PaginatedResponse } from '@/types';
import apiClient from './client';

export const warehouseApi = {
  // Dashboard & Analytics
  getDashboardStats: async () => {
    const { data } = await apiClient.get<ApiResponse<{
      dailySales: number;
      dailyRevenue: number;
      lowStockItems: number;
      totalCustomers: number;
      recentSales: any[];
      topProducts: any[];
      lowStockProducts: any[];
    }>>('/warehouse/dashboard/stats');
    return data;
  },

  // Inventory Management
  getInventory: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<any>>(
      `/warehouse/inventory?${params.toString()}`
    );
    return data;
  },

  updateInventory: async (id: string, inventoryData: {
    pallets?: number;
    packs?: number;
    units?: number;
    reorderLevel?: number;
  }) => {
    const { data } = await apiClient.put<ApiResponse<any>>(
      `/warehouse/inventory/${id}`,
      inventoryData
    );
    return data;
  },

  // Sales Management
  getSales: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<any>>(
      `/warehouse/sales?${params.toString()}`
    );
    return data;
  },

  createSale: async (saleData: {
    productId: string;
    quantity: number;
    unitType: 'PALLETS' | 'PACKS' | 'UNITS';
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CARD' | 'MOBILE_MONEY';
    customerName?: string;
    customerPhone?: string;
    discountPercentage?: number;
    discountReason?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<{
      sale: any;
      receipt: {
        receiptNumber: string;
        totalAmount: number;
        discountApplied: number;
      }
    }>>('/warehouse/sales', saleData);
    return data;
  },

  // Customer Management (Warehouse Customers - B2C)
  getCustomers: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<any>>(
      `/warehouse/customers?${params.toString()}`
    );
    return data;
  },

  createCustomer: async (customerData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    customerType: 'INDIVIDUAL' | 'SMALL_BUSINESS' | 'RETAILER';
  }) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      '/warehouse/customers',
      customerData
    );
    return data;
  },

  // Discount Management (Super Admin Approval Required)
  requestDiscount: async (discountData: {
    customerId?: string;
    productId: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    reason: string;
    minimumQuantity?: number;
    validUntil?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<{
      request: any;
      requiresApproval: boolean;
    }>>('/warehouse/discounts/request', discountData);
    return data;
  },

  getDiscountRequests: async () => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/warehouse/discounts/requests');
    return data;
  },

  reviewDiscountRequest: async (id: string, review: {
    action: 'APPROVE' | 'REJECT';
    notes?: string;
  }) => {
    const { data } = await apiClient.put<ApiResponse<any>>(
      `/warehouse/discounts/requests/${id}/review`,
      review
    );
    return data;
  },

  checkDiscountEligibility: async (customerId: string, productId: string, quantity: number) => {
    const { data } = await apiClient.post<ApiResponse<{
      eligible: boolean;
      discount?: {
        type: string;
        value: number;
        maxDiscount: number;
      }
    }>>('/warehouse/discounts/check', { customerId, productId, quantity });
    return data;
  },

  // Cash Flow Management
  getCashFlow: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const { data } = await apiClient.get<PaginatedResponse<any>>(
      `/warehouse/cash-flow?${params.toString()}`
    );
    return data;
  },

  recordCashFlow: async (transactionData: {
    transactionType: 'CASH_IN' | 'CASH_OUT' | 'SALE' | 'EXPENSE' | 'ADJUSTMENT';
    amount: number;
    paymentMethod: string;
    description?: string;
    referenceNumber?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<any>>(
      '/warehouse/cash-flow',
      transactionData
    );
    return data;
  }
};