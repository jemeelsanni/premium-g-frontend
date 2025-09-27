/* eslint-disable @typescript-eslint/no-explicit-any */
// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
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
  moduleAccess: string[];
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
  isActive: boolean;
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

// Audit Types (Updated to match actual API response)
export interface AuditLog {
  timestamp(timestamp: any): import("react").ReactNode;
  id: string;
  action: string;
  entity: string;
  createdAt: string;  // API uses createdAt, not timestamp
  user?: {            // API returns nested user object
    username: string;
  };
  // Optional fields that may be added later
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
  orderNo: string;
  customerId: string;
  customer?: DistributionCustomer;
  locationId: string;
  location?: Location;
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  orderItems: DistributionOrderItem[];
  remark?: string;
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

// Warehouse Module Types
export interface WarehouseCustomer extends Customer {
  customerType: 'INDIVIDUAL' | 'SMALL_RETAILER' | 'WALK_IN';
  discountEligible?: boolean;
  totalPurchases?: number;
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
  tripDate: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  amount: number;
  fuelCost?: number;
  driverWages?: number;
  otherExpenses?: number;
  createdAt: string;
  updatedAt: string;
}

// Expense Types
export interface Expense {
  id: string;
  module: 'DISTRIBUTION' | 'TRANSPORT' | 'WAREHOUSE';
  category: string;
  amount: number;
  description: string;
  expenseDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvalDate?: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  monthlyGrowth: number;
  recentActivity: any[];
}

// Error Types
export interface ApiError {
  error: string;
  message: string;
  field?: string;
  code?: string;
}

// Distribution Target Types
export interface DistributionTarget {
  id: string;
  year: number;
  month: number;
  totalPacksTarget: number;
  currentPacks: number;
  weeklyTargets: number[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPerformance {
  id: string;
  targetId: string;
  weekNumber: number; // 1-4 for weeks in month
  weekStartDate: string;
  weekEndDate: string;
  targetPacks: number;
  actualPacks: number;
  achievementPercentage: number;
  revenue: number;
  ordersCount: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}