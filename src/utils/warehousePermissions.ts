import { UserRole } from '../types';
import { useAuthStore } from '../store/authStore';

// Define warehouse features
export enum WarehouseFeature {
  RECORD_SALES = 'RECORD_SALES',
  EXPIRED_PRODUCTS = 'EXPIRED_PRODUCTS',
  RECENT_SALES = 'RECENT_SALES',
  DEBTORS = 'DEBTORS',
  OPENING_STOCK = 'OPENING_STOCK',
  DISCOUNT_REQUEST = 'DISCOUNT_REQUEST',
  LOW_STOCK = 'LOW_STOCK',
  CUSTOMER_DATABASE = 'CUSTOMER_DATABASE',
  // Features not allowed for warehouse admin and cashier
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
  CASH_FLOW = 'CASH_FLOW',
  EXPENSES = 'EXPENSES',
  PURCHASES = 'PURCHASES',
}

// Define which roles can access which features
const warehousePermissions: Record<WarehouseFeature, UserRole[]> = {
  // Allowed features for warehouse admin and cashier
  [WarehouseFeature.RECORD_SALES]: [
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_ADMIN,
    UserRole.WAREHOUSE_SALES_OFFICER,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.EXPIRED_PRODUCTS]: [
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_ADMIN,
    UserRole.WAREHOUSE_SALES_OFFICER,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.RECENT_SALES]: [
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_ADMIN,
    UserRole.WAREHOUSE_SALES_OFFICER,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.DEBTORS]: [
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_ADMIN,
    UserRole.WAREHOUSE_SALES_OFFICER,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.OPENING_STOCK]: [
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_ADMIN,
    UserRole.WAREHOUSE_SALES_OFFICER,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.DISCOUNT_REQUEST]: [
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_ADMIN,
    UserRole.WAREHOUSE_SALES_OFFICER,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.LOW_STOCK]: [
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_ADMIN,
    UserRole.WAREHOUSE_SALES_OFFICER,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.CUSTOMER_DATABASE]: [
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_ADMIN,
    UserRole.WAREHOUSE_SALES_OFFICER,
    UserRole.CASHIER,
  ],
  // Restricted features - only super admin and sales officer
  [WarehouseFeature.MANAGE_INVENTORY]: [
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_SALES_OFFICER,
  ],
  [WarehouseFeature.CASH_FLOW]: [
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_SALES_OFFICER,
  ],
  [WarehouseFeature.EXPENSES]: [
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_SALES_OFFICER,
  ],
  [WarehouseFeature.PURCHASES]: [
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_SALES_OFFICER,
  ],
};

// Check if user can access a specific warehouse feature
export const canAccessWarehouseFeature = (feature: WarehouseFeature): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;

  const allowedRoles = warehousePermissions[feature];
  return allowedRoles.includes(user.role);
};

// Check if user can edit in debtors (read-only for warehouse admin and cashier)
export const canEditDebtors = (): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;

  // Only super admin and warehouse sales officer can edit/clear debtors
  return [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_SALES_OFFICER].includes(user.role);
};

// Check if user has restricted warehouse access (warehouse admin or cashier)
export const hasRestrictedWarehouseAccess = (): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;

  return [UserRole.WAREHOUSE_ADMIN, UserRole.CASHIER].includes(user.role);
};

// Dashboard stats that should be visible
export enum DashboardStat {
  PACKS_SOLD = 'PACKS_SOLD',
  REVENUE = 'REVENUE',
  NET_PROFIT = 'NET_PROFIT',
  GROSS_MARGIN = 'GROSS_MARGIN',
  EXPENSES = 'EXPENSES',
  DEBT = 'DEBT',
  INVENTORY_ITEMS = 'INVENTORY_ITEMS',
  ACTIVE_CUSTOMERS = 'ACTIVE_CUSTOMERS',
}

// Define which stats are visible for restricted users
const restrictedDashboardStats: DashboardStat[] = [
  DashboardStat.PACKS_SOLD,
  DashboardStat.DEBT,
  DashboardStat.ACTIVE_CUSTOMERS,
  DashboardStat.INVENTORY_ITEMS,
];

// Check if a dashboard stat should be visible
export const canViewDashboardStat = (stat: DashboardStat): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;

  // Super admin and sales officer can see all stats
  if ([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_SALES_OFFICER].includes(user.role)) {
    return true;
  }

  // Warehouse admin and cashier can only see restricted stats
  if (hasRestrictedWarehouseAccess()) {
    return restrictedDashboardStats.includes(stat);
  }

  return false;
};
