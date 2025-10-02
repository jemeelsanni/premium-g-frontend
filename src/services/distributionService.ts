/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiService } from './api';
import { DistributionOrder, DistributionCustomer } from '../types/index';
import { PaginatedResponse } from '../types/common';

export interface CreateOrderData {
  customerId: string;
  deliveryLocation: string;  // ✅ Changed from locationId to deliveryLocation (text input)
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
  search?: string;
  paymentStatus?: string;
  riteFoodsStatus?: string;
  deliveryStatus?: string;
}

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

export interface RecordPaymentData {
  orderId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  paidBy: string;
  notes?: string;
}

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

  // Orders with proper filtering
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

  // ✅ FIXED: Payment History Methods - Match Backend Routes
  async getPaymentHistory(orderId: string): Promise<PaymentHistory[]> {
    // Backend route: GET /api/v1/distribution/payments/:orderId/summary
    const response = await this.get<any>(`/payments/${orderId}/summary`);
    // Extract payment history from summary response
    return response.customerPayments || [];
  }

  async recordPayment(data: RecordPaymentData): Promise<PaymentHistory> {
    // ✅ Backend route: POST /api/v1/distribution/payments/record
    return this.post<PaymentHistory>(data, '/payments/record');
  }

  async confirmPayment(orderId: string, notes?: string): Promise<DistributionOrder> {
    // ✅ Backend route: POST /api/v1/distribution/payments/confirm
    return this.post<DistributionOrder>({ orderId, notes }, '/payments/confirm');
  }

  async bulkConfirmPayments(data: BulkPaymentConfirmData): Promise<any> {
    return this.post<any>(data, '/orders/bulk/confirm-payments');
  }

  // ✅ FIXED: Customer Management with proper response handling
  async getCustomers(page = 1, limit = 10): Promise<any> {
    const response = await this.get<any>(`/customers?page=${page}&limit=${limit}`);
    console.log('Raw customers response:', response);
    
    // Backend returns: { success: true, data: { customers: [...], pagination: {...} } }
    // But BaseApiService already extracts response.data, so we get: { customers: [...], pagination: {...} }
    return response;
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

  // Targets & Performance Methods
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

  // ✅ FIXED: Products & Locations with proper response handling
  async getProducts(): Promise<any> {
    const response = await this.get<any>('/products');
    console.log('Raw products response:', response);
    
    // Backend returns: { success: true, data: { products: [...] } }
    // But BaseApiService already extracts response.data, so we get: { products: [...] }
    return response;
  }

  async getLocations(): Promise<any> {
    const response = await this.get<any>('/locations');
    console.log('Raw locations response:', response);
    
    // Backend returns: { success: true, data: { locations: [...] } }
    // But BaseApiService already extracts response.data, so we get: { locations: [...] }
    return response;
  }
}

export const distributionService = new DistributionService();