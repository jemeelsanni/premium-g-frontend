// src/store/permissionsStore.ts
import { create } from 'zustand';
import { adminService } from '../services/adminService';

export type FeaturePermissions = Record<string, Record<string, Record<string, boolean>>>;

interface PermissionsState {
  permissions: FeaturePermissions | null;
  loaded: boolean;
}

interface PermissionsActions {
  loadPermissions: () => Promise<void>;
  hasFeature: (role: string, module: string, feature: string) => boolean;
  reset: () => void;
}

export const usePermissionsStore = create<PermissionsState & PermissionsActions>((set, get) => ({
  permissions: null,
  loaded: false,

  loadPermissions: async () => {
    try {
      const res = await adminService.getRolePermissions();
      set({ permissions: res.data?.permissions ?? null, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  hasFeature: (role, module, feature) => {
    const { permissions } = get();
    return permissions?.[role]?.[module]?.[feature] === true;
  },

  reset: () => set({ permissions: null, loaded: false }),
}));

// Standalone helper — call anywhere without hook syntax
export const hasFeature = (role: string, module: string, feature: string): boolean => {
  return usePermissionsStore.getState().hasFeature(role, module, feature);
};
