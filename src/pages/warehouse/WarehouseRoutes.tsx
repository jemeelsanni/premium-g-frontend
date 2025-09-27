import { Routes, Route, Navigate } from 'react-router-dom';
import { WarehouseDashboard } from './WarehouseDashboard';
import { InventoryList } from './InventoryList';
import { SalesList } from './SalesList';
import { CreateSale } from './CreateSale';
import { CustomersList } from './CustomersList';
import { DiscountRequests } from './DiscountRequests';
import { CashFlowList } from './CashFlowList';

export const WarehouseRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<WarehouseDashboard />} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="sales" element={<SalesList />} />
            <Route path="sales/create" element={<CreateSale />} />
            <Route path="customers" element={<CustomersList />} />
            <Route path="discounts" element={<DiscountRequests />} />
            <Route path="cash-flow" element={<CashFlowList />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
    );
};


