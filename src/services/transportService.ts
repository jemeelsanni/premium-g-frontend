/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiService } from './api';
import { TransportOrder, Truck } from '../types/transport';
import { PaginatedResponse } from '../types/common';

export interface CreateTransportOrderData {
  clientName: string;
  pickupLocation: string;
  deliveryLocation: string;
  totalOrderAmount: number;
  truckId?: string;
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

  // Trucks
  async getTrucks(): Promise<Truck[]> {
    return this.get<Truck[]>('/trucks');
  }

  async getTruck(id: string): Promise<Truck> {
    return this.get<Truck>(`/trucks/${id}`);
  }

  async createTruck(data: CreateTruckData): Promise<Truck> {
    return this.post<Truck>(data, '/trucks');
  }

  async updateTruck(id: string, data: Partial<CreateTruckData>): Promise<Truck> {
    return this.put<Truck>(data, `/trucks/${id}`);
  }

  async deleteTruck(id: string): Promise<void> {
    return this.delete(`/trucks/${id}`);
  }

  // Analytics
  async getDashboardStats(): Promise<any> {
    return this.get('/analytics/dashboard');
  }
}

export const transportService = new TransportService();
