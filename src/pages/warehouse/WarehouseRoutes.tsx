import { Routes, Route, Navigate } from 'react-router-dom';
import { WarehouseDashboard } from './WarehouseDashboard';
import { InventoryList } from './InventoryList';
import { SalesList } from './SalesList';
import { CreateSale } from './CreateSale';
import { SaleDetails } from './SaleDetails';
import { CustomersList } from './CustomersList';
import { DiscountRequests } from './DiscountRequests';
import { CashFlowList } from './CashFlowList';
import { ExpensesList } from './ExpensesList';
import { CustomerDetail } from './CustomerDetail'; // NEW IMPORT
import DebtorsDashboard from './DebtorsDashboard';
import OffloadPurchase from './OffloadPurchase';
import DailyOpeningStock from './Dailyopeningstock';

export const WarehouseRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<WarehouseDashboard />} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="sales" element={<SalesList />} />
            <Route path="sales/create" element={<CreateSale />} />
            <Route path="sales/:id" element={<SaleDetails />} />
            <Route path="customers" element={<CustomersList />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="discounts" element={<DiscountRequests />} />
            <Route path="cash-flow" element={<CashFlowList />} />
            <Route path="expenses" element={<ExpensesList />} />
            <Route path="debtors" element={<DebtorsDashboard />} />
            <Route path="offload-purchases" element={<OffloadPurchase />} />
            <Route path="daily-opening-stock" element={<DailyOpeningStock />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
    );
};
