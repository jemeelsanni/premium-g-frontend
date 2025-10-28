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

export interface CustomerFilters {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'recent' | 'topSpender' | 'topPurchases' | 'creditScore';
  customerType?: 'INDIVIDUAL' | 'BUSINESS' | 'RETAILER';
  hasOutstandingDebt?: boolean;
  search?: string;
  startDate?: string;  // ✅ NEW
  endDate?: string;    // ✅ NEW
  filterMonth?: number;  // ✅ NEW: 1-12
  filterYear?: number;   // ✅ NEW: e.g., 2024, 2025
}

export interface CustomerPurchaseFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface CustomerPurchaseHistory {
  id: string;
  receiptNumber: string;
  productId: string;
  quantity: number;
  unitType: string;
  unitPrice: number;
  totalAmount: number;
  totalDiscountAmount: number | null;
  discountApplied: boolean;
  discountPercentage: number | null;
  paymentMethod: string;
  createdAt: string;
  product: {
    name: string;
    productNo: string;
  };
}

export interface CustomerInsights {
  topProducts: Array<{
    name: string;
    productNo: string;
    purchase_count: number;
    totalQuantity: number;
    totalSpent: number;
    avg_price: number;
  }>;
  spendingTrend: Array<{
    month: string;
    purchaseCount: number;
    totalSpent: number;
  }>;
  debtSummary: {
    activeDebts: number;
    totalOutstanding: number;
  };
}

export interface CustomerDetailResponse {
  success: boolean;
  data: {
    customer: WarehouseCustomer;
    insights: CustomerInsights;
  };
}

export interface CustomerPurchaseHistoryResponse {
  success: boolean;
  data: {
    purchases: CustomerPurchaseHistory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    summary: {
      totalPurchases: number;
      totalSpent: number;
      averageOrderValue: number;
    };
    customer: {
      id: string;
      name: string;
      phone: string | null;
      customerType: string;
    };
  };
}

export interface CreateCashFlowData {
  transactionType: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'POS' | 'CHECK' | 'MOBILE_MONEY';
  description?: string;
  referenceNumber?: string;
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

// ===== NEW INTERFACES ADDED FROM SECOND VERSION =====
export interface DebtorAnalytics {
  [key: string]: {
    count: number;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
  };
}

export interface Debtor {
  id: string;
  warehouseCustomerId: string;
  saleId: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  dueDate: string | null;
  status: 'OUTSTANDING' | 'PARTIAL' | 'OVERDUE' | 'PAID';
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  sale: {
    receiptNumber: string;
    createdAt: string;
    productId: string;
    quantity: number;
    unitType: string;
  };
  payments?: Array<{
        id: string;
        amount: number;
        paymentMethod: string;
        paymentDate: string;
    }>;
}

export interface DebtorPayment {
  id: string;
  debtorId: string;
  amount: number;
  paymentMethod: WarehousePaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  receivedBy: string;
}

export interface DebtorFilters {
  page?: number;
  limit?: number;
  status?: 'OUTSTANDING' | 'PARTIAL' | 'OVERDUE' | 'PAID' | 'all';
}

export interface WarehousePurchase {
  id: string;
  productId: string;
  vendorName: string;
  vendorPhone?: string;
  vendorEmail?: string;
  orderNumber?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  unitType: WarehouseUnitType;
  costPerUnit: number;
  totalCost: number;
  paymentMethod: WarehousePaymentMethod;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  amountPaid: number;
  amountDue: number;
  purchaseDate: string;
  invoiceNumber?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    name: string;
    productNo: string;
  };
  createdByUser: {
    username: string;
    role?: string;
  };
}

export interface CreatePurchaseData {
  productId: string;
  vendorName: string;
  vendorPhone?: string;
  vendorEmail?: string;
  orderNumber?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  unitType: WarehouseUnitType;
  costPerUnit: number;
  paymentMethod: WarehousePaymentMethod;
  paymentStatus?: 'PAID' | 'PARTIAL' | 'PENDING';
  amountPaid?: number;
  purchaseDate: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface PurchaseFilters {
  page?: number;
  limit?: number;
  productId?: string;
  vendorName?: string;
  paymentStatus?: 'PAID' | 'PARTIAL' | 'PENDING';
  startDate?: string;
  endDate?: string;
}

export interface ExpiringPurchase extends WarehousePurchase {
  daysUntilExpiry: number;
  urgency: 'critical' | 'high' | 'medium';
}

export interface RecordPaymentData {
  amount: number;
  paymentMethod: WarehousePaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}
// =====================================================

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

  async createSale(data: CreateSaleData): Promise<CreateSaleResponse> {
    return this.post<CreateSaleResponse>(data, '/sales');
  }

  async getProducts(): Promise<Product[]> {
    const response = await this.get<{ success: boolean; data: { products: Product[] } }>('/products');
    return response.data.products;
  }

  async getSaleByReceipt(receiptNumber: string): Promise<{
    success: boolean;
    data: WarehouseSale;
  }> {
    return this.get(`/sales/receipt/${receiptNumber}`);
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

  // Expenses
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
 async getCustomers(filters: CustomerFilters | number, limit?: number, search?: string): Promise<PaginatedResponse<WarehouseCustomer>> {
    if (typeof filters === 'number') {
      // Handle legacy calls with separate parameters
      const page = filters;
      let url = `/customers?page=${page}&limit=${limit || 10}`;
      if (search?.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      return this.get<PaginatedResponse<WarehouseCustomer>>(url);
    }

    // Handle new calls with filters object
    const params = new URLSearchParams();
    params.append('page', (filters.page || 1).toString());
    params.append('limit', (filters.limit || 10).toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.customerType) params.append('customerType', filters.customerType);
    if (filters.hasOutstandingDebt !== undefined) params.append('hasOutstandingDebt', filters.hasOutstandingDebt.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    return this.get<PaginatedResponse<WarehouseCustomer>>(`/customers?${params.toString()}`);
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

  async getCustomerById(id: string): Promise<CustomerDetailResponse> {
  return this.get<CustomerDetailResponse>(`/customers/${id}`);
}

async getCustomerPurchaseHistory(
  id: string,
  filters?: CustomerPurchaseFilters
): Promise<CustomerPurchaseHistoryResponse> {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  
  const queryString = params.toString();
  const url = `/customers/${id}/purchases${queryString ? `?${queryString}` : ''}`;
  
  return this.get<CustomerPurchaseHistoryResponse>(url);
}

  // Cash Flow
  async getCashFlow(
    page = 1, 
    limit = 20,
    transactionType?: string,
    paymentMethod?: string,
    startDate?: string,
    endDate?: string,
    isReconciled?: boolean
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (transactionType) params.append('transactionType', transactionType);
    if (paymentMethod) params.append('paymentMethod', paymentMethod);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (isReconciled !== undefined) params.append('isReconciled', isReconciled.toString());
    
    return this.get(`/cash-flow?${params.toString()}`);
  }

  async createCashFlow(data: CreateCashFlowData): Promise<any> {
    const response = await this.post<{ 
      success: boolean; 
      message: string;
      data: { cashFlow: any } 
    }>(data, '/cash-flow');
    return response;
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

  // ===== ADDED METHODS FROM SECOND VERSION =====
  async getCustomerDetails(customerId: string): Promise<any> {
    return this.get(`/customers/${customerId}`);
  }

  async getCustomerPurchases(customerId: string, filters?: { page?: number; limit?: number; startDate?: string; endDate?: string }): Promise<any> {
    const params = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => v && params.append(k, String(v)));
    const query = params.toString();
    return this.get(query ? `/customers/${customerId}/purchases?${query}` : `/customers/${customerId}/purchases`);
  }

  async getDebtors(filters?: DebtorFilters): Promise<any> {
    const params = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => v && params.append(k, String(v)));
    const query = params.toString();
    return this.get(query ? `/debtors?${query}` : '/debtors');
  }

  async recordDebtorPayment(debtorId: string, data: RecordPaymentData): Promise<any> {
    return this.post(data, `/debtors/${debtorId}/payments`);
  }

  // Get customer debt summary
async getCustomerDebtSummary(customerId: string): Promise<any> {
  return this.get(`/debtors/customer/${customerId}/summary`);
}
  // ============================================

  // Export Methods
  async exportSalesToCSV(filters?: {
    period?: 'day' | 'week' | 'month' | 'year' | 'custom';
    startDate?: string;
    endDate?: string;
    customerId?: string;
    productId?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const response = await apiClient.get(`/warehouse/sales/export/csv?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportSalesToPDF(filters?: {
    period?: 'day' | 'week' | 'month' | 'year' | 'custom';
    startDate?: string;
    endDate?: string;
    customerId?: string;
    productId?: string;
    limit?: number;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get(`/warehouse/sales/export/pdf?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportSaleToPDF(saleId: string): Promise<Blob> {
    const response = await apiClient.get(`/warehouse/sales/${saleId}/export/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportCashFlowToCSV(filters?: {
    startDate?: string;
    endDate?: string;
    transactionType?: string;
    paymentMethod?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const response = await apiClient.get(`/warehouse/cash-flow/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportCashFlowToPDF(filters?: {
    startDate?: string;
    endDate?: string;
    transactionType?: string;
    paymentMethod?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const response = await apiClient.get(`/warehouse/cash-flow/export/pdf?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Warehouse Purchases
  async getPurchases(filters?: PurchaseFilters): Promise<PaginatedResponse<WarehousePurchase>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return this.get<PaginatedResponse<WarehousePurchase>>(
      query ? `/purchases?${query}` : '/purchases'
    );
  }

  async createPurchase(data: CreatePurchaseData): Promise<{
    success: boolean;
    message: string;
    warning?: {
      message: string;
      daysRemaining: number;
      expiryDate: string;
    };
    data: WarehousePurchase;
  }> {
    return this.post<any>(data, '/purchases');
  }

  async getPurchaseById(id: string): Promise<{ success: boolean; data: { purchase: WarehousePurchase } }> {
    return this.get(`/purchases/${id}`);
  }

  async getExpiringPurchases(): Promise<{
    success: boolean;
    data: {
      expiringPurchases: ExpiringPurchase[];
      count: number;
    };
  }> {
    return this.get('/purchases/expiring');
  }

  async getPurchaseAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    data: {
      summary: {
        totalPurchases: number;
        totalCost: number;
        totalPaid: number;
        totalDue: number;
      };
      topProducts: Array<{
        product: {
          id: string;
          name: string;
          productNo: string;
        };
        totalQuantity: number;
        totalCost: number;
        purchaseCount: number;
      }>;
      topVendors: Array<{
        vendorName: string;
        totalSpent: number;
        purchaseCount: number;
      }>;
      paymentBreakdown: any[];
    };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const query = params.toString();
    return this.get(query ? `/purchases/analytics?${query}` : '/purchases/analytics');
  }

}

export const warehouseService = new WarehouseService();
