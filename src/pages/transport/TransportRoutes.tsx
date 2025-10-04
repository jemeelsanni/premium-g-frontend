// src/pages/transport/TransportRoutes.tsx - COMPLETE VERSION

import { Routes, Route, Navigate } from 'react-router-dom';
import { TransportDashboard } from './TransportDashboard';
import { TransportOrdersList } from './TransportOrdersList';
import { CreateTransportOrder } from './CreateTransportOrder';
import { TransportOrderDetails } from './TransportOrderDetails';
import { TruckManagement } from './TruckManagement';
import { ExpensesList } from './ExpensesList';
import { CreateExpense } from './CreateExpense';
import { ExpenseApprovals } from './ExpenseApprovals';
import { TransportAnalytics } from './TransportAnalytics';

export const TransportRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TransportDashboard />} />

            {/* Orders */}
            <Route path="orders" element={<TransportOrdersList />} />
            <Route path="orders/create" element={<CreateTransportOrder />} />
            <Route path="orders/:id" element={<TransportOrderDetails />} />
            <Route path="orders/:id/edit" element={<CreateTransportOrder />} />

            {/* Trucks */}
            <Route path="trucks" element={<TruckManagement />} />

            {/* Expenses */}
            <Route path="expenses" element={<ExpensesList />} />
            <Route path="expenses/create" element={<CreateExpense />} />
            <Route path="expenses/approvals" element={<ExpenseApprovals />} />

            {/* Analytics */}
            <Route path="analytics" element={<TransportAnalytics />} />

            <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
    );
};