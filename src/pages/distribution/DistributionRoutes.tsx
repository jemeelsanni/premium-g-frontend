import { Routes, Route, Navigate } from 'react-router-dom';
import { DistributionDashboard } from './DistributionDashboard';
import { OrdersList } from './OrdersList';
import { CreateOrder } from './CreateOrder';
import { OrderDetails } from './OrderDetails';
import { CustomersList } from './CustomersList';
import { CustomerDetail } from './CustomerDetail';
import { TargetsPage } from './TargetsPage';
import SupplierCompanies from './SupplierCompanies';
import SupplierProducts from './SupplierProducts';

export const DistributionRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DistributionDashboard />} />
            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="orders/:id/edit" element={<CreateOrder />} />
            <Route path="customers" element={<CustomersList />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="targets" element={<TargetsPage />} />
            <Route path="suppliers" element={<SupplierCompanies />} />
            <Route path="supplier-products" element={<SupplierProducts />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
    );
};