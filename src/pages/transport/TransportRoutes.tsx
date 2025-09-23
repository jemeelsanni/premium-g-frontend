import { Routes, Route } from 'react-router-dom';
import { TransportDashboard } from './TransportDashboard';
import { TransportOrdersList } from './TransportOrdersList';
import { CreateTransportOrder } from './CreateTransportOrder';
import { TransportOrderDetails } from './TransportOrderDetails';
import { TruckManagement } from './TruckManagement';

export const TransportRoutes = () => {
    return (
        <Routes>
            <Route index element={<TransportDashboard />} />
            <Route path="orders" element={<TransportOrdersList />} />
            <Route path="orders/create" element={<CreateTransportOrder />} />
            <Route path="orders/:id" element={<TransportOrderDetails />} />
            <Route path="trucks" element={<TruckManagement />} />
        </Routes>
    );
};