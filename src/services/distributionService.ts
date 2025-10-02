/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiService } from './api';
import { DistributionOrder, DistributionCustomer } from '../types/index';
import { PaginatedResponse, Product, Location } from '../types/common';

export interface CreateOrderData {
  customerId: string;
  locationId: string;
  orderItems: {
    productId: string;
    pallets: number;
    packs: number;
    amount: number;
  }[];
  remark?: string;
  initialPayment?: {
    amount: number;
    method: string;
    reference?: string;
  };
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customerType?: 'BUSINESS' | 'ENTERPRISE' | 'GOVERNMENT';
  territory?: string;
}

export interface DistributionFilters {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  search?: string; // ✅ NOW INCLUDED

  paymentStatus?: string;
  riteFoodsStatus?: string;
  deliveryStatus?: string;
}

// ✅ NEW: Payment History Interface
export interface PaymentHistory {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  paidBy: string;
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

// ✅ NEW: Weekly Performance Interface
export interface WeeklyPerformance {
  id: string;
  targetId: string;
  weekNumber: number;
  targetPacks: number;
  actualPacks: number;
  percentageAchieved: number;
  weekStartDate: string;
  weekEndDate: string;
}

// ✅ NEW: Target Interface
export interface DistributionTarget {
  id: string;
  year: number;
  month: number;
  totalPacksTarget: number;
  weeklyTargets: number[];
  weeklyPerformances?: WeeklyPerformance[];
  createdAt: string;
  updatedAt: string;
}

// ✅ NEW: Payment Recording Interface
export interface RecordPaymentData {
  orderId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  paidBy: string;
  notes?: string;
}

// ✅ NEW: Bulk Payment Confirmation Interface
export interface BulkPaymentConfirmData {
  orderIds: string[];
  notes?: string;
}

export class DistributionService extends BaseApiService {
  constructor() {
    super('/distribution');
  }

  // Analytics
  async getDashboardStats(): Promise<any> {
    return this.get('/analytics/summary');
  }

  // Orders with proper filtering (including search)
  async getOrders(filters?: DistributionFilters): Promise<PaginatedResponse<DistributionOrder>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<PaginatedResponse<DistributionOrder>>(`/orders?${params.toString()}`);
  }

  async getOrder(id: string): Promise<DistributionOrder> {
    return this.get<DistributionOrder>(`/orders/${id}`);
  }

  async createOrder(data: CreateOrderData): Promise<DistributionOrder> {
    return this.post<DistributionOrder>(data, '/orders');
  }

  async updateOrder(id: string, data: Partial<CreateOrderData>): Promise<DistributionOrder> {
    return this.put<DistributionOrder>(data, `/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string): Promise<DistributionOrder> {
    return this.put<DistributionOrder>({ status }, `/orders/${id}/status`);
  }

  // ✅ NEW: Payment History Methods
  async getPaymentHistory(orderId: string): Promise<PaymentHistory[]> {
    return this.get<PaymentHistory[]>(`/orders/${orderId}/payments`);
  }

  async recordPayment(data: RecordPaymentData): Promise<PaymentHistory> {
    return this.post<PaymentHistory>(data, '/payments');
  }

  async confirmPayment(orderId: string, notes?: string): Promise<DistributionOrder> {
    return this.put<DistributionOrder>({ notes }, `/orders/${orderId}/confirm-payment`);
  }

  // ✅ NEW: Bulk Payment Confirmation (Admin only)
  async bulkConfirmPayments(data: BulkPaymentConfirmData): Promise<any> {
    return this.post<any>(data, '/orders/bulk/confirm-payments');
  }

  // Customer Management
  async getCustomers(page = 1, limit = 10): Promise<PaginatedResponse<DistributionCustomer>> {
    return this.get<PaginatedResponse<DistributionCustomer>>(`/customers?page=${page}&limit=${limit}`);
  }

  async getCustomer(id: string): Promise<DistributionCustomer> {
    return this.get<DistributionCustomer>(`/customers/${id}`);
  }

  async createCustomer(data: CreateCustomerData): Promise<DistributionCustomer> {
    return this.post<DistributionCustomer>(data, '/customers');
  }

  async updateCustomer(id: string, data: Partial<CreateCustomerData>): Promise<DistributionCustomer> {
    return this.put<DistributionCustomer>(data, `/customers/${id}`);
  }

  async getCustomerOrders(customerId: string): Promise<DistributionOrder[]> {
    return this.get<DistributionOrder[]>(`/customers/${customerId}/orders`);
  }

  // ✅ NEW: Targets & Performance Methods
  async getTargets(page = 1, limit = 10): Promise<PaginatedResponse<DistributionTarget>> {
    return this.get<PaginatedResponse<DistributionTarget>>(`/targets?page=${page}&limit=${limit}`);
  }

  async getCurrentTarget(): Promise<{
    target: DistributionTarget;
    summary: {
      totalTarget: number;
      totalActual: number;
      percentageAchieved: number;
      remainingTarget: number;
    };
  }> {
    return this.get('/targets/current');
  }

  async createTarget(data: {
    year: number;
    month: number;
    totalPacksTarget: number;
    weeklyTargets: number[];
  }): Promise<DistributionTarget> {
    return this.post<DistributionTarget>(data, '/targets');
  }

  // ✅ NEW: Weekly Performance Tracking
  async getWeeklyPerformance(params?: {
    year?: number;
    month?: number;
    week?: number;
  }): Promise<WeeklyPerformance[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return this.get<WeeklyPerformance[]>(`/performance/weekly?${queryParams.toString()}`);
  }

  // Products & Locations
  async getProducts(): Promise<Product[]> {
    return this.get<Product[]>('/products');
  }

  async getLocations(): Promise<Location[]> {
    return this.get<Location[]>('/locations');
  }
}

export const distributionService = new DistributionService();