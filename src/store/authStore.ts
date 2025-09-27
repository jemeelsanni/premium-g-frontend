/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login({ username, password });
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || 'Login failed',
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authService.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      initializeAuth: async () => {
        const token = authService.getStoredToken();
        
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          // Token is invalid, clear it
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper functions
export const hasRole = (requiredRoles: UserRole[]): boolean => {
  const { user } = useAuthStore.getState();
  return user ? requiredRoles.includes(user.role) : false;
};

export const canAccessModule = (module: 'distribution' | 'transport' | 'warehouse'): boolean => {
  const { user } = useAuthStore.getState();
  if (!user) return false;

  const modulePermissions = {
    distribution: [
      UserRole.SUPER_ADMIN,
      UserRole.DISTRIBUTION_ADMIN,
      UserRole.DISTRIBUTION_SALES_REP,
    ],
    transport: [
      UserRole.SUPER_ADMIN,
      UserRole.TRANSPORT_ADMIN,
      UserRole.TRANSPORT_STAFF,
    ],
    warehouse: [
      UserRole.SUPER_ADMIN,
      UserRole.WAREHOUSE_ADMIN,
      UserRole.WAREHOUSE_SALES_OFFICER,
      UserRole.CASHIER,
    ],
  };

  return modulePermissions[module].includes(user.role);
};