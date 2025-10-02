/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiService } from './api';
// import { DistributionOrder, DistributionCustomer, Product, Location } from '../types';

export interface DistributionFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  riteFoodsStatus?: string;
  deliveryStatus?: string;
  customerId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CreateOrderData {
  customerId: string;
  locationId: string;
  orderItems: Array<{
    productId: string;
    pallets: number;
    packs: number;
  }>;
  territory?: string;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone: string;
  address: string;
  customerType: string;
  territory?: string;
  creditLimit?: number;
}

export interface RecordPaymentData {
  orderId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  paidBy?: string;
  receivedBy: string;
  notes?: string;
}

export interface ConfirmPaymentData {
  orderId: string;
  notes?: string;
}

export interface PayRiteFoodsData {
  orderId: string;
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'CHECK';
  reference: string;
  riteFoodsOrderNumber?: string;
  riteFoodsInvoiceNumber?: string;
}

export interface UpdateRiteFoodsStatusData {
  orderId: string;
  riteFoodsStatus: string;
  orderRaisedAt?: string;
  loadedDate?: string;
}

export interface AssignTransportData {
  orderId: string;
  transporterCompany: string;
  driverNumber: string;
  truckNumber?: string;
}

export interface RecordDeliveryData {
  orderId: string;
  deliveryStatus: 'FULLY_DELIVERED' | 'PARTIALLY_DELIVERED' | 'FAILED';
  deliveredPallets?: number;
  deliveredPacks?: number;
  deliveredBy: string;
  deliveryNotes?: string;
  nonDeliveryReason?: string;
  partialDeliveryReason?: string;
}

export class DistributionService extends BaseApiService {
  constructor() {
    super('/distribution');
  }

  // Dashboard & Analytics
  async getDashboardStats(): Promise<any> {
    return this.get('/analytics/summary');
  }

  async getWorkflowSummary(): Promise<any> {
    return this.get('/dashboard/workflow-summary');
  }

  async getReadyForTransport(): Promise<any> {
    return this.get('/dashboard/ready-for-transport');
  }

  // Orders
  async getOrders(filters?: DistributionFilters): Promise<any> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    return this.get(`/orders?${params.toString()}`);
  }

  async getOrder(id: string): Promise<any> {
    return this.get(`/orders/${id}`);
  }

  async createOrder(data: CreateOrderData): Promise<any> {
    return this.post(data, '/orders');
  }

  async updateOrder(id: string, data: Partial<CreateOrderData>): Promise<any> {
    return this.put(data, `/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string): Promise<any> {
    return this.put({ status }, `/orders/${id}/status`);
  }

  // Payment Operations
  async recordPayment(data: RecordPaymentData): Promise<any> {
    return this.post(data, '/payments/record');
  }

  async confirmPayment(data: ConfirmPaymentData): Promise<any> {
    return this.post(data, '/payments/confirm');
  }

  async payRiteFoods(data: PayRiteFoodsData): Promise<any> {
    return this.post(data, '/payments/rite-foods');
  }

  async updateRiteFoodsStatus(data: UpdateRiteFoodsStatusData): Promise<any> {
    return this.put(data, '/payments/rite-foods/status');
  }

  async bulkConfirmPayments(orderIds: string[], notes?: string): Promise<any> {
    return this.post({ orderIds, notes }, '/orders/bulk/confirm-payments');
  }

  // Delivery Operations
  async assignTransport(data: AssignTransportData): Promise<any> {
    return this.post(data, '/delivery/assign-transport');
  }

  async recordDelivery(data: RecordDeliveryData): Promise<any> {
    return this.post(data, '/delivery/record');
  }

  async getDeliverySummary(orderId: string): Promise<any> {
    return this.get(`/delivery/${orderId}/summary`);
  }

  async getInTransitOrders(): Promise<any> {
    return this.get('/delivery/in-transit');
  }

  // Customers
  async getCustomers(page = 1, limit = 10): Promise<any> {
    return this.get(`/customers?page=${page}&limit=${limit}`);
  }

  async getCustomer(id: string): Promise<any> {
    return this.get(`/customers/${id}`);
  }

  async createCustomer(data: CreateCustomerData): Promise<any> {
    return this.post(data, '/customers');
  }

  async updateCustomer(id: string, data: Partial<CreateCustomerData>): Promise<any> {
    return this.put(data, `/customers/${id}`);
  }

  async getCustomerOrders(customerId: string): Promise<any> {
    return this.get(`/customers/${customerId}/orders`);
  }

  // Products & Locations
  async getProducts(): Promise<any> {
    return this.get('/products');
  }

  async getLocations(): Promise<any> {
    return this.get('/locations');
  }

  // Targets & Performance
  async getTargets(): Promise<any> {
    return this.get('/targets');
  }

  async getCurrentTarget(): Promise<any> {
    return this.get('/targets/current');
  }

  async setTarget(data: any): Promise<any> {
    return this.post(data, '/targets');
  }

  async getWeeklyPerformance(): Promise<any> {
    return this.get('/performance/weekly');
  }
}

export const distributionService = new DistributionService();