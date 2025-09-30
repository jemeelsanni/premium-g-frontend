/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiService, apiClient } from './api';
import { TransportOrder, Truck } from '../types/transport';
import { PaginatedResponse } from '../types/common';

export interface CreateTransportOrderData {
  orderNumber: string;
  clientName: string;
  clientPhone?: string;
  pickupLocation: string;
  deliveryAddress: string;  // ✅ Changed from deliveryLocation
  locationId: string;  // ✅ Added
  totalOrderAmount: number;
  fuelRequired: number;  // ✅ Added
  fuelPricePerLiter: number;  // ✅ Added
  truckId?: string;
  driverDetails?: string;
  invoiceNumber?: string;
}
export interface CreateTruckData {
  plateNumber: string;
  capacity: number;
}

export class TransportService extends BaseApiService {
  constructor() {
    super('/transport');
  }

  // Transport Orders
  async getOrders(page = 1, limit = 10): Promise<PaginatedResponse<TransportOrder>> {
    return this.get<PaginatedResponse<TransportOrder>>(`/orders?page=${page}&limit=${limit}`);
  }

  async getOrder(id: string): Promise<TransportOrder> {
    return this.get<TransportOrder>(`/orders/${id}`);
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

  // Trucks - FIXED
  async getTrucks(): Promise<Truck[]> {
    const response = await this.get<{ success: boolean; data: { trucks: Truck[] } }>('/trucks');
    return response.data.trucks; // ✅ Extract the trucks array
  }

  async getTruck(id: string): Promise<Truck> {
    const response = await this.get<{ success: boolean; data: { truck: Truck } }>(`/trucks/${id}`);
    return response.data.truck;
  }

  async createTruck(data: CreateTruckData): Promise<Truck> {
    // Map plateNumber to registrationNumber and capacity to maxPallets
    const payload = {
        truckId: `TRK-${Date.now()}`,  // Generate a unique truckId
        registrationNumber: data.plateNumber,
        maxPallets: data.capacity,
    };
    const response = await this.post<{ success: boolean; data: { truck: Truck } }>(payload, '/trucks');
    return response.data.truck;
}

  async updateTruck(id: string, data: Partial<CreateTruckData>): Promise<Truck> {
    // Map field names for update
    const payload: any = {};
    if (data.plateNumber) payload.registrationNumber = data.plateNumber;
    if (data.capacity) payload.maxPallets = data.capacity;
    
    const response = await this.put<{ success: boolean; data: { truck: Truck } }>(payload, `/trucks/${id}`);
    return response.data.truck;
}

  async deleteTruck(id: string): Promise<void> {
    return this.delete(`/trucks/${id}`);
  }

  // Analytics - FIXED
  async getDashboardStats(): Promise<any> {
    const response = await apiClient.get('/analytics/transport/dashboard');
    return response.data;
  }
}

export const transportService = new TransportService();