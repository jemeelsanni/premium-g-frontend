// src/routes/AdminRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { UserManagement } from './UserManagement';
import { ProductManagement } from './ProductManagement';
import { LocationManagement } from './LocationManagement';
import { AuditTrail } from './AuditTrail';
import { SystemConfig } from './SystemConfig';

export const AdminRoutes = () => {
    return (
        <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="locations" element={<LocationManagement />} />
            <Route path="audit" element={<AuditTrail />} />
            <Route path="config" element={<SystemConfig />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    );
};