/* eslint-disable @typescript-eslint/no-explicit-any */
import  { BaseApiService, apiClient } from './api';
import { DistributionOrder, DistributionCustomer } from '../types/index';
import { PaginatedResponse } from '../types/common';

export interface CreateOrderData {
  customerId: string;
  deliveryLocation: string;
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
  receivedBy: string;
  notes?: string;
}

export interface BulkPaymentConfirmData {
  orderIds: string[];
  notes?: string;
}

export interface PayRiteFoodsData {
  orderId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  riteFoodsOrderNumber?: string;
  riteFoodsInvoiceNumber?: string;
}

export interface PayRiteFoodsResponse {
  success: boolean;
  message: string;
  data: {
    order: DistributionOrder;
    payment: PaymentHistory;
    paymentReference: string;
    riteFoodsOrderNumber: string;
    riteFoodsInvoiceNumber: string;
  };
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

  async getOrder(id: string) {
    const response = await apiClient.get(`/distribution/orders/${id}`, {
      params: {
        include: 'priceAdjustments'
      }
    });
    return response.data;
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

  // Payment History Methods
  async getPaymentHistory(orderId: string): Promise<any> {
    const response = await this.get<any>(`/payments/${orderId}/summary`);
    return response;
  }

  async recordPayment(data: RecordPaymentData): Promise<PaymentHistory> {
    return this.post<PaymentHistory>(data, '/payments/record');
  }

  async confirmPayment(orderId: string, notes?: string): Promise<DistributionOrder> {
    return this.post<DistributionOrder>({ orderId, notes }, '/payments/confirm');
  }

  // ✅ Pay Rite Foods
  async payRiteFoods(data: PayRiteFoodsData): Promise<PayRiteFoodsResponse> {
    return this.post<PayRiteFoodsResponse>(data, '/payments/rite-foods');
  }

  async bulkConfirmPayments(data: BulkPaymentConfirmData): Promise<any> {
    return this.post<any>(data, '/orders/bulk/confirm-payments');
  }

  // Customer Management
  async getCustomers(page = 1, limit = 10): Promise<any> {
    const response = await this.get<any>(`/customers?page=${page}&limit=${limit}`);
    console.log('Raw customers response:', response);
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
    const response = await apiClient.get(`/targets?page=${page}&limit=${limit}`);
    return response.data;
  }

  async deleteTarget(targetId: string): Promise<void> {
    const response = await apiClient.delete(`/targets/${targetId}`);
    return response.data;
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
    const response = await apiClient.get('/targets/current');
    return response.data;
  }

  async createTarget(data: {
    year: number;
    month: number;
    totalPacksTarget: number;
    weeklyTargets: number[];
  }): Promise<DistributionTarget> {
    const response = await apiClient.post('/targets', data);
    return response.data;
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
    const response = await apiClient.get(`/targets/weekly?${queryParams.toString()}`);
    return response.data;
  }

  // Rite Foods Status & Delivery
  async updateRiteFoodsStatus(orderId: string, status: string): Promise<DistributionOrder> {
    return this.put<DistributionOrder>({ riteFoodsStatus: status }, `/orders/${orderId}/rite-foods-status`);
  }

  async assignTransport(orderId: string, data: {
    transporterCompany: string;
    driverNumber: string;
    truckNumber: string;
  }): Promise<DistributionOrder> {
    return this.post<DistributionOrder>(data, `/orders/${orderId}/assign-transport`);
  }

  async recordDelivery(orderId: string, data: {
    palletsDelivered: number;
    packsDelivered: number;
    deliveryNotes?: string;
  }): Promise<DistributionOrder> {
    return this.post<DistributionOrder>(data, `/orders/${orderId}/record-delivery`);
  }

  // Products & Locations
  async getProducts(): Promise<any> {
    const response = await this.get<any>('/products');
    console.log('Raw products response:', response);
    return response;
  }

  async getLocations(): Promise<any> {
    const response = await this.get<any>('/locations');
    console.log('Raw locations response:', response);
    return response;
  }

  // Export Methods
  async exportOrdersToCSV(filters?: DistributionFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/distribution/orders/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  async exportOrdersToPDF(filters?: DistributionFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/distribution/orders/export/pdf?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  // Workflow Summary
  async getWorkflowSummary(): Promise<any> {
    return this.get('/dashboard/workflow-summary');
  }
}

export const distributionService = new DistributionService();