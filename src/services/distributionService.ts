/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiService } from './api';
import { DistributionOrder, DistributionCustomer } from '../types/index'; // ✅ FIXED IMPORT
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
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customerType?: 'BUSINESS' | 'ENTERPRISE' | 'GOVERNMENT';  // Add ? to make it optional
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
}

export class DistributionService extends BaseApiService {
  constructor() {
    super('/distribution');
  }

  // ✅ FIXED: Use the correct analytics endpoint
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

  async getProducts(): Promise<Product[]> {
    return this.get<Product[]>('/products');
  }

  async getLocations(): Promise<Location[]> {
    return this.get<Location[]>('/locations');
  }
}

export const distributionService = new DistributionService();