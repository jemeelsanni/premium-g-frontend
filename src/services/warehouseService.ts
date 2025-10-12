/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiService, apiClient } from './api';
import {
  WarehouseSale,
  WarehouseSaleRecord,
  WarehouseInventory,
  WarehouseCustomer,
  Product,
  WarehouseExpense
} from '../types/warehouse';
import { PaginatedResponse } from '../types/common';

export type WarehouseUnitType = 'PALLETS' | 'PACKS' | 'UNITS';
export type WarehousePaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CARD' | 'MOBILE_MONEY';

export interface CreateSaleData {
  productId: string;
  quantity: number;
  unitType: WarehouseUnitType;
  unitPrice: number;
  paymentMethod: WarehousePaymentMethod;
  customerName: string;
  customerPhone?: string;
  warehouseCustomerId?: string;
  applyDiscount?: boolean;
  requestDiscountApproval?: boolean;
  discountReason?: string;
  requestedDiscountPercent?: number;
  receiptNumber?: string;
}

export interface CreateSaleResponse {
  success: boolean;
  message: string;
  pendingApproval?: boolean;
  data: {
    sale: WarehouseSaleRecord;
  };
}

export interface WarehouseSalesResponse {
  success: boolean;
  data: {
    sales: WarehouseSale[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface WarehouseExpenseFilters {
  page?: number;
  limit?: number;
  status?: string;
  expenseType?: string;
  category?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isPaid?: boolean;
}

export interface CreateWarehouseExpenseData {
  expenseType: string;
  category: string;
  amount: number;
  description?: string;
  expenseDate?: string;
  productId?: string;
}

export interface CreateDiscountRequestData {
  warehouseCustomerId: string;
  productId: string;
  requestedDiscountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BULK_DISCOUNT';
  requestedDiscountValue: number;
  minimumQuantity?: number;
  maximumDiscountAmount?: number;
  validFrom: string;
  validUntil?: string;
  reason: string;
  businessJustification?: string;
  estimatedImpact?: number;
}

export interface CreateCustomerData {
  name: string;
  phone: string;
  address: string;
  customerType: string;
}

export interface CheckDiscountData {
  warehouseCustomerId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface RequestDiscountData {
  warehouseCustomerId: string;
  productId?: string;
  requestedDiscountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  requestedDiscountValue: number;
  reason: string;
  validFrom: string;
  validUntil?: string;
  minimumQuantity?: number;
  maximumDiscountAmount?: number;
  businessJustification?: string;
}




export interface UpdateInventoryData {
  currentStock?: number;
  minimumStock?: number;
  maximumStock?: number;
  pallets?: number;
  packs?: number;
  units?: number;
  reorderLevel?: number;
  maxStockLevel?: number;
}

export class WarehouseService extends BaseApiService {
  constructor() {
    super('/warehouse');
  }

  // Sales
  async getSales(page = 1, limit = 10): Promise<WarehouseSalesResponse> {
    try {
      return await this.get<WarehouseSalesResponse>(`/sales?page=${page}&limit=${limit}`);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return {
          success: true,
          data: {
            sales: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0
            }
          }
        };
      }
      throw error;
    }
  }

  async getSale(receiptNumber: string): Promise<WarehouseSale> {
    const response = await this.get<{ success: boolean; data: { sale: WarehouseSale } }>(`/sales/by-receipt/${receiptNumber}`);
    return response.data.sale;
  }

  async createSale(data: CreateSaleData): Promise<CreateSaleResponse> {
    return this.post<CreateSaleResponse>(data, '/sales');
  }

  async getProducts(): Promise<Product[]> {
  const response = await this.get<{ success: boolean; data: { products: Product[] } }>('/products');
  return response.data.products;
}

  // Inventory
  async getInventory(page = 1, limit = 10): Promise<PaginatedResponse<WarehouseInventory>> {
    return this.get<PaginatedResponse<WarehouseInventory>>(`/inventory?page=${page}&limit=${limit}`);
  }

  async getInventoryItem(id: string): Promise<WarehouseInventory> {
    return this.get<WarehouseInventory>(`/inventory/${id}`);
  }

  async updateInventory(id: string, data: UpdateInventoryData): Promise<WarehouseInventory> {
    const payload: Record<string, number> = {};

    if (typeof data.pallets === 'number') payload.pallets = data.pallets;
    if (typeof data.packs === 'number') payload.packs = data.packs;
    if (typeof data.units === 'number') payload.units = data.units;
    if (typeof data.reorderLevel === 'number') payload.reorderLevel = data.reorderLevel;
    if (typeof data.maxStockLevel === 'number') payload.maxStockLevel = data.maxStockLevel;

    if (typeof data.currentStock === 'number') payload.packs = data.currentStock;
    if (typeof data.minimumStock === 'number') payload.reorderLevel = data.minimumStock;
    if (typeof data.maximumStock === 'number') payload.maxStockLevel = data.maximumStock;

    return this.put<WarehouseInventory>(payload, `/inventory/${id}`);
  }

  async getExpenses(filters?: WarehouseExpenseFilters): Promise<{
    success: boolean;
    data: {
      expenses: WarehouseExpense[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const query = params.toString();
    const suffix = query.length > 0 ? `?${query}` : '';

    try {
      return await this.get(`/expenses${suffix}`);
    } catch (error: any) {
      console.error('Failed to fetch warehouse expenses', error);

      return {
        success: true,
        data: {
          expenses: [],
          pagination: {
            page: Number(filters?.page) || 1,
            limit: Number(filters?.limit) || 10,
            total: 0,
            totalPages: 1
          }
        }
      };
    }
  }

  async createExpense(data: CreateWarehouseExpenseData): Promise<WarehouseExpense> {
    const payload = {
      expenseType: data.expenseType,
      category: data.category,
      amount: data.amount,
      description: data.description,
      expenseDate: data.expenseDate || new Date().toISOString(),
      productId: data.productId || undefined
    };

    const response = await this.post<{ success: boolean; data: { expense: WarehouseExpense } }>(
      payload,
      '/expenses'
    );

    return response.data.expense;
  }

  async updateExpenseStatus(
    id: string,
    status: WarehouseExpense['status'],
    options?: { rejectionReason?: string }
  ): Promise<WarehouseExpense> {
    const payload: Record<string, unknown> = { status };

    if (status === 'REJECTED' && options?.rejectionReason) {
      payload.rejectionReason = options.rejectionReason;
    }

    const response = await this.put<{ success: boolean; data: { expense: WarehouseExpense } }>(
      payload,
      `/expenses/${id}`
    );

    return response.data.expense;
  }

  // Customers
  async getCustomers(page = 1, limit = 10, search?: string): Promise<PaginatedResponse<WarehouseCustomer>> {
    if (search && search.trim().length > 0) {
      const safeSearch = encodeURIComponent(search.trim());
      return this.get<PaginatedResponse<WarehouseCustomer>>(`/customers?search=${safeSearch}&page=${page}&limit=${limit}`);
    }
    return this.get<PaginatedResponse<WarehouseCustomer>>(`/customers?page=${page}&limit=${limit}`);
  }

  async getCustomer(id: string): Promise<WarehouseCustomer> {
    return this.get<WarehouseCustomer>(`/customers/${id}`);
  }

  async createCustomer(data: CreateCustomerData): Promise<WarehouseCustomer> {
    return this.post<WarehouseCustomer>(data, '/customers');
  }

  async updateCustomer(id: string, data: Partial<CreateCustomerData>): Promise<WarehouseCustomer> {
    return this.put<WarehouseCustomer>(data, `/customers/${id}`);
  }

  // Cash Flow
  async getCashFlow(page = 1, limit = 10): Promise<any> {
    return this.get(`/cash-flow?page=${page}&limit=${limit}`);
  }

    // Discount Requests

async checkDiscount(data: {
  warehouseCustomerId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}): Promise<any> {
  return this.post(data, '/discounts/check');
}

async requestDiscount(data: {
  warehouseCustomerId: string;
  productId?: string;
  requestedDiscountType: string;
  requestedDiscountValue: number;
  reason: string;
  validFrom: string;
  validUntil?: string;
  minimumQuantity?: number;
  maximumDiscountAmount?: number;
  businessJustification?: string;
}): Promise<any> {
  return this.post(data, '/discounts/request');
}

async getDiscountRequests(page = 1, limit = 20, status = 'PENDING'): Promise<any> {
  return this.get(`/discounts/requests?page=${page}&limit=${limit}&status=${status}`);
}

  async reviewDiscountRequest(id: string, action: 'approve' | 'reject', data: {
    adminNotes?: string;
    rejectionReason?: string;
  }): Promise<any> {
    return this.put({ action, ...data }, `/discounts/requests/${id}/review`);
  }

  async getCustomerDiscounts(customerId: string): Promise<any> {
    return this.get(`/customers/${customerId}/discounts`);
  }

  async approveDiscount(id: string, adminNotes?: string): Promise<any> {
    return this.put({ action: 'approve', adminNotes }, `/discounts/requests/${id}/review`);
  }

  async rejectDiscount(id: string, rejectionReason?: string, adminNotes?: string): Promise<any> {
    return this.put({ action: 'reject', rejectionReason, adminNotes }, `/discounts/requests/${id}/review`);
  }

  async createDiscountRequest(data: CreateDiscountRequestData): Promise<any> {
    return this.post(data, '/discounts/request');
  }

  // Analytics
  async getDashboardStats(): Promise<any> {
    try {
      const response = await apiClient.get('/warehouse/analytics/summary');
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 400 || error?.response?.status === 404) {
        return {
          success: true,
          data: {
            summary: {
              totalRevenue: 0,
              totalCOGS: 0,
              grossProfit: 0,
              profitMargin: 0,
              totalSales: 0,
              totalQuantitySold: 0,
              averageSaleValue: 0
            },
            cashFlow: {
              totalCashIn: 0,
              totalCashOut: 0,
              netCashFlow: 0
            },
            inventory: {
              totalStockValue: 0,
              totalItems: 0,
              lowStockItems: 0,
              outOfStockItems: 0,
              stockHealthPercentage: 0
            },
            topProducts: [],
            dailyPerformance: [],
            period: {}
          }
        };
      }
      throw error;
    }
  }





}

export const warehouseService = new WarehouseService();
