// src/routes/AdminRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { UserManagement } from './UserManagement';
import { ProductManagement } from './ProductManagement';
import { CustomerManagement } from './CustomerManagement';
import { LocationManagement } from './LocationManagement';
import { AuditTrail } from './AuditTrail';
import { SystemConfig } from './SystemConfig';
import { UserActivityDashboard } from './UserActivityDashboard';
import { UserStatsDashboard } from './UserStatsDashboard';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { JSX } from 'react';

// Only SUPER_ADMIN can access this route; WAREHOUSE_ADMIN is redirected to products
const SuperAdminOnly = ({ element }: { element: JSX.Element }) => {
    const { user } = useAuthStore();
    if (user?.role === UserRole.WAREHOUSE_ADMIN) {
        return <Navigate to="/admin/products" replace />;
    }
    return element;
};

export const AdminRoutes = () => {
    return (
        <Routes>
            <Route index element={<SuperAdminOnly element={<AdminDashboard />} />} />

            {/* User Management - Super Admin only */}
            <Route path="users" element={<SuperAdminOnly element={<UserManagement />} />} />
            <Route path="users/activity" element={<SuperAdminOnly element={<UserActivityDashboard />} />} />
            <Route path="users/statistics" element={<SuperAdminOnly element={<UserStatsDashboard />} />} />

            {/* Product Management - Warehouse Admin allowed */}
            <Route path="products" element={<ProductManagement />} />

            {/* Resource Management - Super Admin only */}
            <Route path="customers" element={<SuperAdminOnly element={<CustomerManagement />} />} />
            <Route path="locations" element={<SuperAdminOnly element={<LocationManagement />} />} />

            {/* System Management - Super Admin only */}
            <Route path="audit" element={<SuperAdminOnly element={<AuditTrail />} />} />
            <Route path="config" element={<SuperAdminOnly element={<SystemConfig />} />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
};