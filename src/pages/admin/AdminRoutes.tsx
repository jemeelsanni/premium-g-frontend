// src/routes/AdminRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { UserManagement } from './UserManagement';
import { CustomerManagement } from './CustomerManagement';
import { LocationManagement } from './LocationManagement';
import { AuditTrail } from './AuditTrail';
import { UserActivityDashboard } from './UserActivityDashboard';
import { UserStatsDashboard } from './UserStatsDashboard';
import { RolePermissions } from './RolePermissions';
import { useFeatureAccess } from '../../utils/permissions';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { JSX } from 'react';

const ADMIN_FALLBACK = [UserRole.MANAGING_DIRECTOR, UserRole.GENERAL_MANAGER];

const ADMIN_PAGES = [
    { feature: 'view_dashboard', path: '/admin' },
    { feature: 'manage_users', path: '/admin/users' },
    { feature: 'manage_customers', path: '/admin/customers' },
    { feature: 'manage_locations', path: '/admin/locations' },
    { feature: 'view_audit', path: '/admin/audit' },
    { feature: 'manage_products', path: '/warehouse/inventory' },
];

// Each admin page is gated by its own feature toggle in Role Permissions.
const AdminFeatureRoute = ({ element, feature }: { element: JSX.Element; feature: string }) => {
    const hasFeature = useFeatureAccess();
    if (!hasFeature('admin', feature, ADMIN_FALLBACK)) {
        // Go to the first admin page they *can* open (avoids "/" -> "/admin" loops).
        const fallback = ADMIN_PAGES.find(p => p.feature !== feature && hasFeature('admin', p.feature, ADMIN_FALLBACK));
        return <Navigate to={fallback?.path ?? '/unauthorized'} replace />;
    }
    return element;
};

// Only the Managing Director can edit role permissions, so hide the page from everyone else.
const ManagingDirectorOnly = ({ element }: { element: JSX.Element }) => {
    const role = useAuthStore((s) => s.user?.role);
    if (role !== UserRole.MANAGING_DIRECTOR) return <Navigate to="/admin" replace />;
    return element;
};

export const AdminRoutes = () => {
    return (
        <Routes>
            <Route index element={<AdminFeatureRoute feature="view_dashboard" element={<AdminDashboard />} />} />

            {/* User Management - Super Admin only */}
            <Route path="users" element={<AdminFeatureRoute feature="manage_users" element={<UserManagement />} />} />
            <Route path="users/activity" element={<AdminFeatureRoute feature="manage_users" element={<UserActivityDashboard />} />} />
            <Route path="users/statistics" element={<AdminFeatureRoute feature="manage_users" element={<UserStatsDashboard />} />} />

            {/* Warehouse products are managed in Warehouse > Inventory Management */}
            <Route path="products" element={<Navigate to="/warehouse/inventory" replace />} />

            {/* Resource Management - Super Admin only */}
            <Route path="customers" element={<AdminFeatureRoute feature="manage_customers" element={<CustomerManagement />} />} />
            <Route path="locations" element={<AdminFeatureRoute feature="manage_locations" element={<LocationManagement />} />} />

            {/* System Management - Super Admin only */}
            <Route path="audit" element={<AdminFeatureRoute feature="view_audit" element={<AuditTrail />} />} />
            {/* System Config is hidden for now — /admin/config falls through to /admin */}
            <Route path="role-permissions" element={<ManagingDirectorOnly element={<RolePermissions />} />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
};