// User and Authentication Types
// export type UserRole =
//   | "SUPER_ADMIN"
//   | "DISTRIBUTION_ADMIN"
//   | "TRANSPORT_ADMIN"
//   | "WAREHOUSE_ADMIN"
//   | "DISTRIBUTION_SALES_REP"
//   | "WAREHOUSE_SALES_OFFICER"
//   | "CASHIER"
//   | "TRANSPORT_STAFF";

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

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Session {
  id: string;
  deviceInfo: string;
  lastActive: Date;
  createdAt: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: User;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items?: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } & Record<string, unknown>;
}

// Distribution Types
export type OrderStatus = "PENDING" | "PROCESSING" | "DELIVERED" | "CANCELLED";

export type PaymentMethod = "CASH" | "TRANSFER" | "POS" | "CHEQUE";

export interface Product {
  id: string;
  productNo: string;
  name: string;
  description?: string;
  category?: string;
  unitPrice: number;
  unitsPerPack: number;
  isActive: boolean;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  isActive: boolean;
}

export interface DistributionOrder {
  id: string;
  orderNumber: string;
  locationId: string;
  location?: Location;
  salesRepId: string;
  salesRep?: User;
  status: OrderStatus;
  totalPacks: number;
  totalAmount: number;
  transportCost?: number;
  paymentMethod: PaymentMethod;
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionOrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  packs: number;
  unitPrice: number;
  totalPrice: number;
}

// Warehouse Types
export interface WarehouseInventory {
  id: string;
  productId: string;
  product?: Product;
  packs: number;
  units: number;
  location: string;
  reorderLevel: number;
  lastUpdated: string;
}

export interface WarehouseSale {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  receiptNumber: string;
  salesOfficer: string;
  salesOfficerUser?: User;
  createdAt: string;
}

export interface CashFlow {
  id: string;
  type: "INFLOW" | "OUTFLOW";
  amount: number;
  description: string;
  category?: string;
  cashierId: string;
  cashier?: User;
  createdAt: string;
}

// Transport Types
export type TransportStatus = "SCHEDULED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export interface TransportOrder {
  id: string;
  orderNumber: string;
  distributionOrderId?: string;
  distributionOrder?: DistributionOrder;
  driverId: string;
  driver?: User;
  vehicleNumber: string;
  origin: string;
  destination: string;
  status: TransportStatus;
  cost: number;
  distance?: number;
  departureDate: string;
  arrivalDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Target & Performance Types
export interface DistributionTarget {
  id: string;
  year: number;
  month: number;
  totalPacksTarget: number;
  weeklyTargets: number[];
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPerformance {
  id: string;
  targetId: string;
  weekNumber: number;
  targetPacks: number;
  actualPacks: number;
  percentageAchieved: number;
  weekStartDate: string;
  weekEndDate: string;
}

// Expense Types
export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  module: "DISTRIBUTION" | "TRANSPORT" | "WAREHOUSE";
  status: ExpenseStatus;
  requestedBy: string;
  requestedByUser?: User;
  approvedBy?: string;
  approvedByUser?: User;
  approvalDate?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface AnalyticsSummary {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  profitMargin: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface ModuleStats {
  module: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

// Audit Trail Types
export interface AuditLog {
  id: string;
  userId?: string;
  user?: User;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}