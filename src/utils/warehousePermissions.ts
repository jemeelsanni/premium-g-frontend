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

  // NEW: Edit permissions
  EDIT_SALES = 'EDIT_SALES',
  DELETE_SALES = 'DELETE_SALES',
  EDIT_PURCHASES = 'EDIT_PURCHASES',
  DELETE_PURCHASES = 'DELETE_PURCHASES',
}

// Define which roles can access which features
const warehousePermissions: Record<WarehouseFeature, UserRole[]> = {
  [WarehouseFeature.RECORD_SALES]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.EXPIRED_PRODUCTS]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.RECENT_SALES]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.DEBTORS]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.OPENING_STOCK]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.DISCOUNT_REQUEST]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.LOW_STOCK]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.CUSTOMER_DATABASE]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.CASHIER,
  ],
  // Restricted features
  [WarehouseFeature.MANAGE_INVENTORY]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.CASH_FLOW]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.CASHIER,
  ],
  [WarehouseFeature.EXPENSES]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.ACCOUNTANT,
  ],
  [WarehouseFeature.PURCHASES]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
  ],

  // Edit/Delete permissions
  [WarehouseFeature.EDIT_SALES]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
  ],
  [WarehouseFeature.DELETE_SALES]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
  ],
  [WarehouseFeature.EDIT_PURCHASES]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
  ],
  [WarehouseFeature.DELETE_PURCHASES]: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
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

  return [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.CASHIER].includes(user.role);
};

// Check if user can approve/reject manual daily opening stock entries
export const canApproveManualStock = (): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;

  return [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER].includes(user.role);
};

// Check if user has restricted warehouse access (warehouse admin or cashier)
export const hasRestrictedWarehouseAccess = (): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;

  return [UserRole.CASHIER].includes(user.role);
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

  if ([UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.ACCOUNTANT].includes(user.role)) {
    return true;
  }

  // Warehouse admin and cashier can only see restricted stats
  if (hasRestrictedWarehouseAccess()) {
    return restrictedDashboardStats.includes(stat);
  }

  return false;
};
