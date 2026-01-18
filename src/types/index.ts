// src/types/index.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from 'react';

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}



export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    users?: T[];      // For user endpoints
    products?: T[];   // For product endpoints
    customers?: T[];  // For customer endpoints
    locations?: T[];  // For location endpoints
    logs?: T[];       // For audit logs
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Auth-related request types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface Session {
  id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastAccessedAt: string;
  isActive: boolean;
}

// User Role Enum
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DISTRIBUTION_ADMIN = 'DISTRIBUTION_ADMIN',
  DISTRIBUTION_SALES_REP = 'DISTRIBUTION_SALES_REP',
  TRANSPORT_ADMIN = 'TRANSPORT_ADMIN',
  TRANSPORT_STAFF = 'TRANSPORT_STAFF',
  WAREHOUSE_ADMIN = 'WAREHOUSE_ADMIN',
  WAREHOUSE_SALES_OFFICER = 'WAREHOUSE_SALES_OFFICER',
  CASHIER = 'CASHIER'
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  permissions?: Record<string, any>;  // ✅ Added: JSON permissions field
  lastLoginAt?: string;  // ✅ Added: Track last login timestamp
  moduleAccess?: string[];
  createdAt: string;
  updatedAt: string;
}

// Product Types
export interface Product {
  id: string;
  productNo: string;
  name: string;
  description?: string;
  packsPerPallet: number;
  pricePerPack: number;
  costPerPack?: number;      // Backend: Decimal (auto-converted to/from number in JSON)
  minSellingPrice?: number | null;  // Price range enforcement
  maxSellingPrice?: number | null;  // Price range enforcement
  module?: 'DISTRIBUTION' | 'WAREHOUSE' | 'BOTH';
  isActive: boolean;
  currentStock?: number;     // For warehouse inventory
  createdAt: string;
  updatedAt: string;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customerType?: string;  // e.g., 'BUSINESS', 'ENTERPRISE', 'GOVERNMENT', 'INDIVIDUAL', 'RETAIL'
  territory?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


// Location Types
export interface Location {
  id: string;
  name: string;
  address?: string;
  fuelAdjustment?: number;
  driverWagesPerTrip?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Audit Types
export interface AuditLog {
  timestamp(timestamp: any): ReactNode;
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  user?: {
    username: string;
  };
  userId?: string;
  userEmail?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

// Distribution Module Types
export interface DistributionCustomer extends Customer {
  customerType: 'BUSINESS' | 'ENTERPRISE' | 'GOVERNMENT';
  businessRegistration?: string;
  taxId?: string;
  creditLimit?: number;
  paymentTerms?: string;
  territory?: string;
  salesRepId?: string;
  totalOrders?: number;
  totalSpent?: number;
  averageOrderValue?: number;
  lastOrderDate?: string;
}

export interface DistributionOrder {
  id: string;
  orderNo?: string;
  orderNumber?: string;
  customerId: string;
  customer?: DistributionCustomer;
  locationId: string;
  location?: Location;
  deliveryLocation?: string;
  totalPallets: number;
  totalPacks: number;
  originalAmount: number;
  finalAmount: number;
  balance: number;
  amountPaid: number;
  
  // Payment fields
  paymentStatus: 'PENDING' | 'PARTIAL' | 'CONFIRMED';
  paymentMethod?: string;
  paymentReference?: string;
  paymentConfirmedBy?: string;
  paymentConfirmedAt?: string;
  paymentNotes?: string;
  
  // Rite Foods fields
  paidToRiteFoods: boolean;
  amountPaidToRiteFoods?: number;
  paymentDateToRiteFoods?: string;
  riteFoodsOrderNumber?: string;
  riteFoodsInvoiceNumber?: string;
  riteFoodsStatus: 'NOT_SENT' | 'PAYMENT_SENT' | 'ORDER_RAISED' | 'PROCESSING' | 'LOADED' | 'DISPATCHED';
  orderRaisedByRFL?: boolean;
  orderRaisedAt?: string;
  riteFoodsLoadedDate?: string;
  
  // Transport fields
  transporterCompany?: string;
  driverNumber?: string;
  truckNumber?: string;
  
  // Delivery fields
  deliveryStatus: 'PENDING' | 'IN_TRANSIT' | 'FULLY_DELIVERED' | 'PARTIALLY_DELIVERED' | 'FAILED';
  deliveredPallets?: number;
  deliveredPacks?: number;
  deliveredAt?: string;
  deliveredBy?: string;
  deliveryNotes?: string;
  nonDeliveryReason?: string;
  partialDeliveryReason?: string;
  deliveryReviewedBy?: string;
  deliveryReviewedAt?: string;
  
  // Order status
  status:
    | 'PENDING'
    | 'PAYMENT_CONFIRMED'
    | 'SENT_TO_SUPPLIER'
    | 'PROCESSING_BY_SUPPLIER'
    | 'LOADED'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'PARTIALLY_DELIVERED'
    | 'CANCELLED';
  
  orderItems?: DistributionOrderItem[];
  remark?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionOrderItem {
  id: string;
  productId: string;
  product?: Product;
  pallets: number;
  packs: number;
  amount: number;
}

export interface PaymentHistory {
  id: string;
  orderId: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  reference?: string;
  paidBy?: string;
  receivedBy?: string;
  confirmedBy?: string;
  notes?: string;
  createdAt: string;
}

// Warehouse Module Types
export interface WarehouseCustomer extends Customer {
  customerType: string;
  businessName?: string;
  preferredPaymentMethod?: string;
  discountEligible?: boolean;
  totalPurchases?: number;
  totalSpent?: number;
  averageOrderValue?: number;
  lastPurchaseDate?: string;
}

export interface WarehouseInventory {
  id: string;
  productId: string;
  product?: Product;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  lastRestockDate?: string;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseSale {
  id: string;
  saleNo: string;
  customerId?: string;
  customer?: WarehouseCustomer;
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'POS';
  saleItems: WarehouseSaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseSaleItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Transport Module Types
export interface Truck {
  id: string;
  plateNumber: string;
  capacity: number;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransportClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contractType: 'ONE_TIME' | 'RECURRING' | 'ANNUAL';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  tripNo: string;
  clientId: string;
  client?: TransportClient;
  truckId: string;
  truck?: Truck;
  origin: string;
  destination: string;
  distance: number;
  fuelCost: number;
  driverWages: number;
  tripExpenses: number;
  totalRevenue: number;
  netProfit: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

// Expense Types
export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeCustomers: number;
  pendingOrders: number;
}
