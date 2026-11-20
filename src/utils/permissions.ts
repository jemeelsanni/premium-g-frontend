import { UserRole } from '../types';
import { useAuthStore } from '../store/authStore';
import { usePermissionsStore, FeaturePermissions } from '../store/permissionsStore';

export type AppModule = 'dashboard' | 'distribution' | 'transport' | 'warehouse' | 'admin';

// Hardcoded defaults — only used until the role-permissions config has loaded
// (or if it failed to load).
const FALLBACK_MODULE_ROLES: Record<AppModule, UserRole[]> = {
  dashboard: [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER],
  distribution: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.DISTRIBUTORSHIP_SALES_REP,
  ],
  transport: [UserRole.MANAGING_DIRECTOR, UserRole.ACCOUNTANT],
  warehouse: [
    UserRole.MANAGING_DIRECTOR,
    UserRole.GENERAL_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.CASHIER,
  ],
  admin: [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER],
};

// Order used to pick a user's landing page.
const MODULE_HOME: { module: AppModule; path: string }[] = [
  { module: 'dashboard', path: '/dashboard' },
  { module: 'warehouse', path: '/warehouse' },
  { module: 'distribution', path: '/distribution' },
  { module: 'transport', path: '/transport' },
  { module: 'admin', path: '/admin' },
];

/**
 * A role can open a module when it has at least one feature enabled in that
 * module in the role-permissions config. The Managing Director always keeps
 * access so they can never lock themselves out of the permissions screen.
 * The top-level "dashboard" (company overview) has no section of its own in
 * the config, so it follows the admin dashboard toggle.
 */
export const roleHasModuleAccess = (
  role: UserRole | undefined,
  module: AppModule,
  permissions: FeaturePermissions | null,
): boolean => {
  if (!role) return false;
  if (role === UserRole.MANAGING_DIRECTOR) return true;

  if (!permissions) return FALLBACK_MODULE_ROLES[module].includes(role);

  const rolePerms = permissions[role] ?? {};
  if (module === 'dashboard') return rolePerms.admin?.view_dashboard === true;

  return Object.values(rolePerms[module] ?? {}).some(v => v === true);
};

export const getHomeRoute = (
  role: UserRole | undefined,
  permissions: FeaturePermissions | null,
): string => {
  const first = MODULE_HOME.find(m => roleHasModuleAccess(role, m.module, permissions));
  return first?.path ?? '/unauthorized';
};

/** Reactive hook — re-renders when the user or the permissions config changes. */
export const useModuleAccess = () => {
  const user = useAuthStore(s => s.user);
  const permissions = usePermissionsStore(s => s.permissions);
  const loaded = usePermissionsStore(s => s.loaded);

  return {
    loaded,
    canAccess: (module: AppModule) => roleHasModuleAccess(user?.role, module, permissions),
    homeRoute: getHomeRoute(user?.role, permissions),
  };
};

/**
 * Feature-level check for one module, e.g. hasFeatureAccess(role, 'admin', 'manage_users').
 * `fallbackRoles` is used until the permissions config has loaded.
 */
export const roleHasFeature = (
  role: UserRole | undefined,
  module: AppModule,
  feature: string,
  permissions: FeaturePermissions | null,
  fallbackRoles: UserRole[],
): boolean => {
  if (!role) return false;
  if (role === UserRole.MANAGING_DIRECTOR) return true;
  if (!permissions) return fallbackRoles.includes(role);
  return permissions[role]?.[module]?.[feature] === true;
};

export const useFeatureAccess = () => {
  const user = useAuthStore(s => s.user);
  const permissions = usePermissionsStore(s => s.permissions);
  return (module: AppModule, feature: string, fallbackRoles: UserRole[] = []) =>
    roleHasFeature(user?.role, module, feature, permissions, fallbackRoles);
};
