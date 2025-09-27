import { Product } from "./common";

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum CustomerType {
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
  GOVERNMENT = 'GOVERNMENT'
}

export enum PaymentTerms {
  CASH = 'CASH',
  NET_15 = 'NET_15',
  NET_30 = 'NET_30',
  NET_60 = 'NET_60'
}

export interface DistributionCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customerType: CustomerType;
  businessRegistration?: string;
  taxId?: string;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  territory: string;
  salesRepId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: DistributionCustomer;
  locationId: string;
  location?: Location;
  totalPallets: number;
  totalPacks: number;
  originalAmount: number;
  finalAmount: number;
  status: OrderStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: DistributionOrderItem[];
}

export interface DistributionOrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
