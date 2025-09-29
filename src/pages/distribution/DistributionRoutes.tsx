import { Routes, Route, Navigate } from 'react-router-dom';
import { DistributionDashboard } from './DistributionDashboard';
import { OrdersList } from './OrdersList';
import { CreateOrder } from './CreateOrder';
import { OrderDetails } from './OrderDetails';
import { CustomersList } from './CustomersList'; // ✅ ADDED

export const DistributionRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DistributionDashboard />} />
            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="orders/:id/edit" element={<CreateOrder />} />
            <Route path="customers" element={<CustomersList />} /> {/* ✅ ADDED */}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
    );
};