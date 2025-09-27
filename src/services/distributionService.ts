/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiService } from './api';
import {DistributionOrder, DistributionCustomer} from '../types/distribution';
import {PaginatedResponse, Product, Location} from '../types/common';

export interface CreateOrderData {
  customerId: string;
  locationId: string;
  orderItems: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface CreateCustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  customerType: string;
  businessRegistration?: string;
  taxId?: string;
  creditLimit: number;
  paymentTerms: string;
  territory: string;
}

export class DistributionService extends BaseApiService {
  constructor() {
    super('/distribution');
  }

  // Orders
  async getOrders(page = 1, limit = 10): Promise<PaginatedResponse<DistributionOrder>> {
    return this.get<PaginatedResponse<DistributionOrder>>(`/orders?page=${page}&limit=${limit}`);
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

  // Customers
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

  // Products
  async getProducts(): Promise<Product[]> {
    return this.get<Product[]>('/products');
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return this.get<Location[]>('/locations');
  }

  // Analytics
  async getDashboardStats(): Promise<any> {
    return this.get('/analytics/dashboard');
  }
}

export const distributionService = new DistributionService();