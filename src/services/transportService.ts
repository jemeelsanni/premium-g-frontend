/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/transportService.ts - FIXED VERSION

import { BaseApiService, apiClient } from './api';
import { 
  TransportOrder, 
  Truck, 
  TransportExpense,
  TransportAnalytics,
  TruckPerformance,
  ClientStats,
  ProfitAnalysis,
  ExpenseSummary
} from '../types/transport';
import { PaginatedResponse, Location } from '../types/common';

export interface CreateTransportOrderData {
  orderNumber: string;
  clientName: string;
  clientPhone?: string;
  pickupLocation: string;
  deliveryAddress: string;
  locationId: string;
  totalOrderAmount: number;
  fuelRequired: number;
  fuelPricePerLiter: number;
  driverWages: number;      // ✅ ADD THIS
  tripAllowance: number;    // ✅ ADD THIS
  motorBoyWages: number;    // ✅ ADD THIS
  truckId?: string;
  driverDetails?: string;
  invoiceNumber?: string;
}

export interface CreateTruckData {
  plateNumber: string;
  capacity: number;
  make?: string;
  model?: string;
  year?: number;
  notes?: string;
}

export interface CreateExpenseData {
  truckId?: string;
  locationId?: string;
  expenseType: 'TRIP' | 'NON_TRIP';
  category: string;
  amount: number;
  description: string;
  expenseDate: string;
}

export interface TransportFilters {
  page?: number;
  limit?: number;
  status?: string;
  clientName?: string;
  locationId?: string;
  truckId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  status?: string;
  expenseType?: string;
  category?: string;
  truckId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DateFilters {
  startDate?: string;
  endDate?: string;
}

export class TransportService extends BaseApiService {
  constructor() {
    super('/transport');
  }

  // ================================
  // TRANSPORT ORDERS
  // ================================

  async getOrders(filters?: TransportFilters): Promise<PaginatedResponse<TransportOrder>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<PaginatedResponse<TransportOrder>>(`/orders?${params.toString()}`);
  }

  async getOrder(id: string): Promise<TransportOrder> {
    const response = await this.get<{ success: boolean; data: { order: TransportOrder } }>(`/orders/${id}`);
    return response.data.order;
  }

  async createOrder(data: CreateTransportOrderData): Promise<TransportOrder> {
    return this.post<TransportOrder>(data, '/orders');
  }

  async updateOrder(id: string, data: Partial<CreateTransportOrderData>): Promise<TransportOrder> {
    return this.put<TransportOrder>(data, `/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string): Promise<TransportOrder> {
    return this.put<TransportOrder>({ deliveryStatus: status }, `/orders/${id}/status`);
  }

  // ================================
  // TRUCKS
  // ================================

  async getTrucks(): Promise<Truck[]> {
    const response = await this.get<{ success: boolean; data: { trucks: Truck[] } }>('/trucks');
    return response.data.trucks;
  }

  async getTruck(id: string): Promise<Truck> {
    const response = await this.get<{ success: boolean; data: { truck: Truck } }>(`/trucks/${id}`);
    return response.data.truck;
  }

  async createTruck(data: CreateTruckData): Promise<Truck> {
    const payload = {
      truckId: `TRK-${Date.now()}`,
      registrationNumber: data.plateNumber,
      maxPallets: data.capacity,
      make: data.make,
      model: data.model,
      year: data.year,
      notes: data.notes
    };
    const response = await this.post<{ success: boolean; data: { truck: Truck } }>(payload, '/trucks');
    return response.data.truck;
  }

  async updateTruck(id: string, data: Partial<CreateTruckData>): Promise<Truck> {
    const payload: any = {};
    if (data.plateNumber) payload.registrationNumber = data.plateNumber;
    if (data.capacity) payload.maxPallets = data.capacity;
    if (data.make) payload.make = data.make;
    if (data.model) payload.model = data.model;
    if (data.year) payload.year = data.year;
    if (data.notes) payload.notes = data.notes;
    
    const response = await this.put<{ success: boolean; data: { truck: Truck } }>(payload, `/trucks/${id}`);
    return response.data.truck;
  }

  async deleteTruck(id: string): Promise<void> {
    return this.delete(`/trucks/${id}`);
  }

  // ================================
  // LOCATIONS
  // ================================

  async getLocations(): Promise<Location[]> {
    const response = await this.get<{ success: boolean; data: { locations: Location[] } }>('/locations');
    return response.data.locations;
  }

  // ================================
  // EXPENSES
  // ================================

  async getExpenses(filters?: ExpenseFilters): Promise<PaginatedResponse<TransportExpense>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return this.get<PaginatedResponse<TransportExpense>>(`/expenses?${params.toString()}`);
  }

  async getExpense(id: string): Promise<TransportExpense> {
    const response = await this.get<{ success: boolean; data: { expense: TransportExpense } }>(`/expenses/${id}`);
    return response.data.expense;
  }

  async createExpense(data: CreateExpenseData): Promise<TransportExpense> {
    return this.post<TransportExpense>(data, '/expenses');
  }

  async updateExpense(id: string, data: Partial<CreateExpenseData>): Promise<TransportExpense> {
    return this.put<TransportExpense>(data, `/expenses/${id}`);
  }

  async approveExpense(id: string, notes?: string): Promise<TransportExpense> {
    return this.put<TransportExpense>({ notes }, `/expenses/${id}/approve`);
  }

  async rejectExpense(id: string, reason: string): Promise<TransportExpense> {
    return this.put<TransportExpense>({ reason }, `/expenses/${id}/reject`);
  }

  async bulkApproveExpenses(data: { expenseIds: string[]; notes?: string }): Promise<void> {
    return this.post<void>(data, '/expenses/bulk-approve');
  }

  // ================================
  // ANALYTICS - Use apiClient directly for separate analytics routes
  // ================================

  async getDashboardStats(): Promise<any> {
    // ✅ Analytics are on separate routes: /api/v1/analytics/transport/*
    const response = await apiClient.get('/analytics/transport/dashboard');
    return response.data;
  }

  async getAnalyticsSummary(filters?: DateFilters): Promise<TransportAnalytics> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await apiClient.get(`/analytics/transport/summary?${params.toString()}`);
    return response.data;
  }

  async getProfitAnalysis(filters?: DateFilters & { locationId?: string }): Promise<ProfitAnalysis> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await apiClient.get(`/analytics/transport/profit-analysis?${params.toString()}`);
    return response.data;
  }

  async getTruckPerformance(truckId: string, filters?: DateFilters): Promise<TruckPerformance> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await apiClient.get(`/analytics/transport/trucks/${truckId}/performance?${params.toString()}`);
    return response.data;
  }

  async getClientStats(filters?: DateFilters & { limit?: number }): Promise<ClientStats[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    const response = await apiClient.get(`/analytics/transport/clients?${params.toString()}`);
    return response.data;
  }

  async getExpenseSummary(filters?: DateFilters): Promise<ExpenseSummary> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await apiClient.get(`/analytics/transport/expenses/summary?${params.toString()}`);
    return response.data;
  }

  // ================================
  // LOCATION RATES
  // ================================

  async getLocationRates(locationId: string): Promise<any> {
    const response = await this.get<{ success: boolean; data: any }>(`/locations/${locationId}/rates`);
    return response.data;
  }

  // ================================
  // EXPORT FUNCTIONS
  // ================================

  async exportOrdersToCSV(filters?: TransportFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/transport/orders/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  async exportExpensesToCSV(filters?: ExpenseFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/transport/expenses/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }
}

export const transportService = new TransportService();