import { UserRole } from '../types';
import { useAuthStore } from '../store/authStore';
import { usePermissionsStore } from '../store/permissionsStore';

// ─── Feature enum (kept for backward-compat with existing call sites) ─────────

export enum WarehouseFeature {
  RECORD_SALES      = 'RECORD_SALES',
  EXPIRED_PRODUCTS  = 'EXPIRED_PRODUCTS',
  RECENT_SALES      = 'RECENT_SALES',
  DEBTORS           = 'DEBTORS',
  OPENING_STOCK     = 'OPENING_STOCK',
  DISCOUNT_REQUEST  = 'DISCOUNT_REQUEST',
  LOW_STOCK         = 'LOW_STOCK',
  CUSTOMER_DATABASE = 'CUSTOMER_DATABASE',
  MANAGE_INVENTORY  = 'MANAGE_INVENTORY',
  CASH_FLOW         = 'CASH_FLOW',
  EXPENSES          = 'EXPENSES',
  PURCHASES         = 'PURCHASES',
  EDIT_SALES        = 'EDIT_SALES',
  DELETE_SALES      = 'DELETE_SALES',
  EDIT_PURCHASES    = 'EDIT_PURCHASES',
  DELETE_PURCHASES  = 'DELETE_PURCHASES',
}

// ─── Mapping: WarehouseFeature → feature key(s) in rolePermissions.json ───────
// If ANY of the listed keys is true for the user's role, the feature is granted.

const FEATURE_KEY_MAP: Record<WarehouseFeature, string[]> = {
  [WarehouseFeature.RECORD_SALES]:      ['record_sales'],
  [WarehouseFeature.EXPIRED_PRODUCTS]:  ['view_expiring'],
  [WarehouseFeature.RECENT_SALES]:      ['view_sales'],
  [WarehouseFeature.DEBTORS]:           ['view_debtors'],
  [WarehouseFeature.OPENING_STOCK]:     ['view_opening_stock', 'submit_opening_stock'],
  [WarehouseFeature.DISCOUNT_REQUEST]:  ['request_discount'],
  [WarehouseFeature.LOW_STOCK]:         ['view_low_stock'],
  [WarehouseFeature.CUSTOMER_DATABASE]: ['view_debtors', 'view_sales'],
  [WarehouseFeature.MANAGE_INVENTORY]:  ['manage_inventory'],
  [WarehouseFeature.CASH_FLOW]:         ['view_cashflow'],
  [WarehouseFeature.EXPENSES]:          ['view_expenses'],
  [WarehouseFeature.PURCHASES]:         ['record_purchases'],
  [WarehouseFeature.EDIT_SALES]:        ['edit_sales'],
  [WarehouseFeature.DELETE_SALES]:      ['delete_sales'],
  [WarehouseFeature.EDIT_PURCHASES]:    ['edit_purchases'],
  [WarehouseFeature.DELETE_PURCHASES]:  ['delete_purchases'],
};

// ─── Hardcoded fallback (used while permissions store is loading) ──────────────

const FALLBACK_PERMISSIONS: Record<WarehouseFeature, UserRole[]> = {
  [WarehouseFeature.RECORD_SALES]:      [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.CASHIER],
  [WarehouseFeature.EXPIRED_PRODUCTS]:  [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.ACCOUNTANT, UserRole.CASHIER],
  [WarehouseFeature.RECENT_SALES]:      [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.CASHIER],
  [WarehouseFeature.DEBTORS]:           [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.ACCOUNTANT, UserRole.CASHIER],
  [WarehouseFeature.OPENING_STOCK]:     [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.CASHIER],
  [WarehouseFeature.DISCOUNT_REQUEST]:  [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.CASHIER],
  [WarehouseFeature.LOW_STOCK]:         [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.ACCOUNTANT, UserRole.CASHIER],
  [WarehouseFeature.CUSTOMER_DATABASE]: [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.CASHIER],
  [WarehouseFeature.MANAGE_INVENTORY]:  [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.CASHIER],
  [WarehouseFeature.CASH_FLOW]:         [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.ACCOUNTANT, UserRole.CASHIER],
  [WarehouseFeature.EXPENSES]:          [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.ACCOUNTANT],
  [WarehouseFeature.PURCHASES]:         [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER],
  [WarehouseFeature.EDIT_SALES]:        [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER],
  [WarehouseFeature.DELETE_SALES]:      [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER],
  [WarehouseFeature.EDIT_PURCHASES]:    [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER],
  [WarehouseFeature.DELETE_PURCHASES]:  [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER],
};

// ─── Main check ───────────────────────────────────────────────────────────────

export const canAccessWarehouseFeature = (feature: WarehouseFeature): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;

  const { permissions } = usePermissionsStore.getState();

  if (permissions) {
    const keys = FEATURE_KEY_MAP[feature] ?? [];
    const warehousePerms = permissions[user.role]?.warehouse ?? {};
    return keys.some(k => warehousePerms[k] === true);
  }

  // Fallback while store is loading
  return FALLBACK_PERMISSIONS[feature]?.includes(user.role) ?? false;
};

// ─── Specific helpers ─────────────────────────────────────────────────────────

export const canEditDebtors = (): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;
  const { permissions } = usePermissionsStore.getState();
  if (permissions) return permissions[user.role]?.warehouse?.edit_debtors === true;
  return [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.CASHIER].includes(user.role);
};

export const canApproveManualStock = (): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;
  const { permissions } = usePermissionsStore.getState();
  if (permissions) return permissions[user.role]?.warehouse?.approve_opening_stock === true;
  return [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER].includes(user.role);
};

export const hasRestrictedWarehouseAccess = (): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;
  // Restricted = Cashier with no admin-level warehouse features
  const { permissions } = usePermissionsStore.getState();
  if (permissions) {
    const w = permissions[user.role]?.warehouse ?? {};
    return !w.approve_discount && !w.approve_expenses && !w.approve_opening_stock && !w.manage_inventory;
  }
  return user.role === UserRole.CASHIER;
};

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export enum DashboardStat {
  PACKS_SOLD       = 'PACKS_SOLD',
  REVENUE          = 'REVENUE',
  NET_PROFIT       = 'NET_PROFIT',
  GROSS_MARGIN     = 'GROSS_MARGIN',
  EXPENSES         = 'EXPENSES',
  DEBT             = 'DEBT',
  INVENTORY_ITEMS  = 'INVENTORY_ITEMS',
  ACTIVE_CUSTOMERS = 'ACTIVE_CUSTOMERS',
}

// Maps DashboardStat enum → rolePermissions.json key in the warehouse module
const STAT_PERMISSION_KEY: Record<DashboardStat, string> = {
  [DashboardStat.PACKS_SOLD]:       'stat_packs_sold',
  [DashboardStat.REVENUE]:          'stat_revenue',
  [DashboardStat.NET_PROFIT]:       'stat_net_profit',
  [DashboardStat.GROSS_MARGIN]:     'stat_gross_margin',
  [DashboardStat.EXPENSES]:         'stat_expenses',
  [DashboardStat.DEBT]:             'stat_debt',
  [DashboardStat.INVENTORY_ITEMS]:  'stat_inventory_items',
  [DashboardStat.ACTIVE_CUSTOMERS]: 'stat_active_customers',
};

// Fallback visibility when permissions store hasn't loaded yet
const RESTRICTED_STATS: DashboardStat[] = [
  DashboardStat.PACKS_SOLD,
  DashboardStat.DEBT,
  DashboardStat.ACTIVE_CUSTOMERS,
  DashboardStat.INVENTORY_ITEMS,
];

export const canViewDashboardStat = (stat: DashboardStat): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;

  const { permissions } = usePermissionsStore.getState();

  if (permissions) {
    const w = permissions[user.role]?.warehouse ?? {};
    const permKey = STAT_PERMISSION_KEY[stat];
    // If the explicit stat key is present in permissions, use it
    if (permKey in w) return w[permKey] === true;
    // Legacy fallback: full access if user has approve-level warehouse access
    const hasFullAccess = w.approve_expenses || w.approve_discount || w.view_cashflow;
    if (hasFullAccess) return true;
    return RESTRICTED_STATS.includes(stat);
  }

  // Fallback while permissions store is loading
  if ([UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER, UserRole.ACCOUNTANT].includes(user.role)) return true;
  if (hasRestrictedWarehouseAccess()) return RESTRICTED_STATS.includes(stat);
  return false;
};

// ─── Distribution dashboard stat helpers ─────────────────────────────────────

export enum DistributionStat {
  TOTAL_REVENUE    = 'stat_total_revenue',
  TOTAL_ORDERS     = 'stat_total_orders',
  TOTAL_PACKS      = 'stat_total_packs',
  ACTIVE_CUSTOMERS = 'stat_active_customers',
}

export const canViewDistributionStat = (stat: DistributionStat): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;

  const { permissions } = usePermissionsStore.getState();

  if (permissions) {
    const d = permissions[user.role]?.distribution ?? {};
    // Default to true if key not present (graceful for old permission configs)
    return d[stat] !== false;
  }

  // Fallback while loading — show all stats
  return true;
};

// ─── Transport dashboard stat helpers ────────────────────────────────────────

export enum TransportStat {
  ACTIVE_TRIPS   = 'stat_active_trips',
  TOTAL_REVENUE  = 'stat_total_revenue',
  FLEET_SIZE     = 'stat_fleet_size',
  PROFIT_MARGIN  = 'stat_profit_margin',
}

export const canViewTransportStat = (stat: TransportStat): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;

  const { permissions } = usePermissionsStore.getState();

  if (permissions) {
    const t = permissions[user.role]?.transport ?? {};
    return t[stat] !== false;
  }

  return true;
};
