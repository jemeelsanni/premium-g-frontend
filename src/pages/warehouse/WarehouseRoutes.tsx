import { Routes, Route, Navigate } from 'react-router-dom';
import { WarehouseDashboard } from './WarehouseDashboard';
import InventoryManagement from './inventory/InventoryManagement';
import InventoryProductPage from './inventory/InventoryProductPage';
import { SalesList } from './SalesList';
import { CreateSale } from './CreateSale';
import { SaleDetails } from './SaleDetails';
import { CustomersList } from './CustomersList';
import { DiscountRequests } from './DiscountRequests';
import { CashFlowList } from './CashFlowList';
import { ExpensesList } from './ExpensesList';
import { CustomerDetail } from './CustomerDetail';
import DebtorsDashboard from './DebtorsDashboard';
import DailyOpeningStock from './DailyOpeningStock';
import ManualDailyOpeningStock from './ManualDailyOpeningStock';
import ExpiringProducts from './ExpiringProducts';
import AuditLogs from './AuditLogs';
import { canAccessWarehouseFeature, WarehouseFeature } from '../../utils/warehousePermissions';
import { JSX } from 'react';

// Protected route wrapper component
const ProtectedWarehouseRoute = ({
    element,
    feature
}: {
    element: JSX.Element;
    feature: WarehouseFeature | WarehouseFeature[];
}) => {
    const hasAccess = (Array.isArray(feature) ? feature : [feature]).some(canAccessWarehouseFeature);

    if (!hasAccess) {
        return <Navigate to="/warehouse/dashboard" replace />;
    }

    return element;
};

export const WarehouseRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<WarehouseDashboard />} />

            {/* Inventory Management - products, stock and purchases */}
            <Route
                path="inventory"
                element={
                    <ProtectedWarehouseRoute
                        element={<InventoryManagement />}
                        feature={[WarehouseFeature.MANAGE_INVENTORY, WarehouseFeature.PURCHASES]}
                    />
                }
            />
            <Route
                path="inventory/:productId"
                element={
                    <ProtectedWarehouseRoute
                        element={<InventoryProductPage />}
                        feature={[WarehouseFeature.MANAGE_INVENTORY, WarehouseFeature.PURCHASES]}
                    />
                }
            />

            {/* Sales - Always accessible */}
            <Route
                path="sales"
                element={
                    <ProtectedWarehouseRoute
                        element={<SalesList />}
                        feature={WarehouseFeature.RECENT_SALES}
                    />
                }
            />
            <Route
                path="sales/create"
                element={
                    <ProtectedWarehouseRoute
                        element={<CreateSale />}
                        feature={WarehouseFeature.RECORD_SALES}
                    />
                }
            />
            <Route
                path="sales/:id"
                element={
                    <ProtectedWarehouseRoute
                        element={<SaleDetails />}
                        feature={WarehouseFeature.RECENT_SALES}
                    />
                }
            />

            {/* Customers - Always accessible */}
            <Route
                path="customers"
                element={
                    <ProtectedWarehouseRoute
                        element={<CustomersList />}
                        feature={WarehouseFeature.CUSTOMER_DATABASE}
                    />
                }
            />
            <Route
                path="customers/:id"
                element={
                    <ProtectedWarehouseRoute
                        element={<CustomerDetail />}
                        feature={WarehouseFeature.CUSTOMER_DATABASE}
                    />
                }
            />

            {/* Discounts - Always accessible */}
            <Route
                path="discounts"
                element={
                    <ProtectedWarehouseRoute
                        element={<DiscountRequests />}
                        feature={WarehouseFeature.DISCOUNT_REQUEST}
                    />
                }
            />

            {/* Cash Flow - Restricted */}
            <Route
                path="cash-flow"
                element={
                    <ProtectedWarehouseRoute
                        element={<CashFlowList />}
                        feature={WarehouseFeature.CASH_FLOW}
                    />
                }
            />

            {/* Expenses - Restricted */}
            <Route
                path="expenses"
                element={
                    <ProtectedWarehouseRoute
                        element={<ExpensesList />}
                        feature={WarehouseFeature.EXPENSES}
                    />
                }
            />

            {/* Debtors - Always accessible (read-only for restricted users) */}
            <Route
                path="debtors"
                element={
                    <ProtectedWarehouseRoute
                        element={<DebtorsDashboard />}
                        feature={WarehouseFeature.DEBTORS}
                    />
                }
            />

            {/* Purchases now live in Inventory Management */}
            <Route path="offload-purchases" element={<Navigate to="/warehouse/inventory" replace />} />

            {/* Daily Opening Stock - Always accessible */}
            <Route
                path="daily-opening-stock"
                element={
                    <ProtectedWarehouseRoute
                        element={<DailyOpeningStock />}
                        feature={WarehouseFeature.OPENING_STOCK}
                    />
                }
            />

            {/* Manual Daily Opening Stock - Sales reps submit, admin approves */}
            <Route
                path="manual-daily-stock"
                element={
                    <ProtectedWarehouseRoute
                        element={<ManualDailyOpeningStock />}
                        feature={WarehouseFeature.OPENING_STOCK}
                    />
                }
            />

            {/* Expiring Products - Always accessible */}
            <Route
                path="expiring-products"
                element={
                    <ProtectedWarehouseRoute
                        element={<ExpiringProducts />}
                        feature={WarehouseFeature.EXPIRED_PRODUCTS}
                    />
                }
            />

            {/* Audit Logs - Restricted (Admin only) */}
            <Route
                path="audit-logs"
                element={
                    <ProtectedWarehouseRoute
                        element={<AuditLogs />}
                        feature={WarehouseFeature.MANAGE_INVENTORY}
                    />
                }
            />

            <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
    );
};
