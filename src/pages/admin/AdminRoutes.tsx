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

export const AdminRoutes = () => {
    return (
        <Routes>
            <Route index element={<AdminDashboard />} />

            {/* User Management */}
            <Route path="users" element={<UserManagement />} />
            <Route path="users/activity" element={<UserActivityDashboard />} />
            <Route path="users/statistics" element={<UserStatsDashboard />} />

            {/* Resource Management */}
            <Route path="products" element={<ProductManagement />} />
            <Route path="customers" element={<CustomerManagement />} />
            <Route path="locations" element={<LocationManagement />} />

            {/* System Management */}
            <Route path="audit" element={<AuditTrail />} />
            <Route path="config" element={<SystemConfig />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
};