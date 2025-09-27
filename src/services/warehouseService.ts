/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiService } from './api';
import { 
  WarehouseSale, 
  WarehouseInventory, 
  WarehouseCustomer 
} from '../types/warehouse';
import { PaginatedResponse } from '../types/common';

export interface CreateSaleData {
  productId: string;
  quantity: number;
  unitPrice: number;
  customerName: string;
}

export interface CreateCustomerData {
  name: string;
  phone: string;
  address: string;
  customerType: string;
}

export interface UpdateInventoryData {
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
}

export class WarehouseService extends BaseApiService {
  constructor() {
    super('/warehouse');
  }

  // Sales
  async getSales(page = 1, limit = 10): Promise<PaginatedResponse<WarehouseSale>> {
    return this.get<PaginatedResponse<WarehouseSale>>(`/sales?page=${page}&limit=${limit}`);
  }

  async getSale(id: string): Promise<WarehouseSale> {
    return this.get<WarehouseSale>(`/sales/${id}`);
  }

  async createSale(data: CreateSaleData): Promise<WarehouseSale> {
    return this.post<WarehouseSale>(data, '/sales');
  }

  // Inventory
  async getInventory(page = 1, limit = 10): Promise<PaginatedResponse<WarehouseInventory>> {
    return this.get<PaginatedResponse<WarehouseInventory>>(`/inventory?page=${page}&limit=${limit}`);
  }

  async getInventoryItem(id: string): Promise<WarehouseInventory> {
    return this.get<WarehouseInventory>(`/inventory/${id}`);
  }

  async updateInventory(id: string, data: UpdateInventoryData): Promise<WarehouseInventory> {
    return this.put<WarehouseInventory>(data, `/inventory/${id}`);
  }

  // Customers
  async getCustomers(page = 1, limit = 10): Promise<PaginatedResponse<WarehouseCustomer>> {
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
  async getDiscountRequests(page = 1, limit = 10): Promise<any> {
    return this.get(`/discounts?page=${page}&limit=${limit}`);
  }

  async approveDiscount(id: string): Promise<any> {
    return this.put({}, `/discounts/${id}/approve`);
  }

  async rejectDiscount(id: string): Promise<any> {
    return this.put({}, `/discounts/${id}/reject`);
  }

  // Analytics
  async getDashboardStats(): Promise<any> {
    return this.get('/analytics/dashboard');
  }
}

export const warehouseService = new WarehouseService();