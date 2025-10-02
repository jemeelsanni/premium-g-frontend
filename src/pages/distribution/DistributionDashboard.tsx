/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/distribution/WorkflowDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Package, DollarSign, FileText, Truck, CheckCircle,
    Clock, AlertTriangle, TrendingUp, Activity
} from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';

export const WorkflowDashboard: React.FC = () => {
    const navigate = useNavigate();

    const { data: workflowData, isLoading } = useQuery({
        queryKey: ['distribution-workflow-summary'],
        queryFn: async () => {
            const response = await fetch('/api/v1/distribution/dashboard/workflow-summary', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch workflow summary');
            return response.json();
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const { data: readyForTransportData } = useQuery({
        queryKey: ['ready-for-transport'],
        queryFn: async () => {
            const response = await fetch('/api/v1/distribution/dashboard/ready-for-transport', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch ready orders');
            return response.json();
        },
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const stages = workflowData?.data?.workflowStages || {};
    const readyOrders = readyForTransportData?.data?.orders || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-3xl font-bold text-gray-900">Distribution Workflow</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Monitor orders through each stage of the distribution process
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Button onClick={() => navigate('/distribution/orders')}>
                        View All Orders
                    </Button>
                </div>
            </div>

            {/* Workflow Stages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <StageCard
                    title="Pending Payment"
                    count={stages.stage1_pendingPayment || 0}
                    icon={<Clock className="h-8 w-8" />}
                    color="orange"
                    description="Awaiting customer payment"
                    onClick={() => navigate('/distribution/orders?paymentStatus=PENDING,PARTIAL')}
                />

                <StageCard
                    title="Payment Confirmed"
                    count={stages.stage2_paymentConfirmed || 0}
                    icon={<DollarSign className="h-8 w-8" />}
                    color="blue"
                    description="Ready for Rite Foods payment"
                    onClick={() => navigate('/distribution/orders?paymentStatus=CONFIRMED')}
                />

                <StageCard
                    title="At Rite Foods"
                    count={stages.stage3_sentToRiteFoods || 0}
                    icon={<FileText className="h-8 w-8" />}
                    color="purple"
                    description="Processing at supplier"
                    onClick={() => navigate('/distribution/orders?riteFoodsStatus=PAYMENT_SENT,ORDER_RAISED,PROCESSING,LOADED')}
                />

                <StageCard
                    title="In Transit"
                    count={stages.stage4_inTransit || 0}
                    icon={<Truck className="h-8 w-8" />}
                    color="indigo"
                    description="En route to customer"
                    onClick={() => navigate('/distribution/orders?deliveryStatus=IN_TRANSIT')}
                    pulse={stages.stage4_inTransit > 0}
                />

                <StageCard
                    title="Delivered"
                    count={stages.stage5_delivered || 0}
                    icon={<CheckCircle className="h-8 w-8" />}
                    color="green"
                    description="Successfully completed"
                    onClick={() => navigate('/distribution/orders?deliveryStatus=FULLY_DELIVERED')}
                />
            </div>

            {/* Issues Alert */}
            {stages.issues > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-red-800">
                                Delivery Issues Detected
                            </h3>
                            <p className="text-sm text-red-700 mt-1">
                                {stages.issues} order(s) with partial or failed deliveries require attention
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/distribution/orders?deliveryStatus=PARTIALLY_DELIVERED,FAILED')}
                            className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                            Review Issues
                        </Button>
                    </div>
                </div>
            )}

            {/* Ready for Transport Alert */}
            {readyOrders.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className="bg-blue-500 rounded-full p-2 mr-3">
                                <Truck className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Ready for Transport Assignment
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {readyOrders.length} order(s) loaded at Rite Foods and awaiting transport
                                </p>
                            </div>
                        </div>
                        <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                            ACTION REQUIRED
                        </span>
                    </div>

                    <div className="space-y-3">
                        {readyOrders.slice(0, 3).map((order: any) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/distribution/orders/${order.id}`)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <Package className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-gray-900">{order.customer}</p>
                                            <p className="text-sm text-gray-500">{order.location}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right mr-4">
                                    <p className="text-sm font-medium text-gray-900">
                                        {order.totalPallets} pallets, {order.totalPacks} packs
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Loaded {order.daysWaiting} days ago
                                    </p>
                                </div>
                                <Button size="sm">
                                    Assign Transport
                                </Button>
                            </div>
                        ))}

                        {readyOrders.length > 3 && (
                            <button
                                onClick={() => navigate('/distribution/orders?riteFoodsStatus=LOADED')}
                                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
                            >
                                View all {readyOrders.length} orders →
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <Activity className="h-5 w-5 text-gray-400 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/distribution/orders')}>
                        View All
                    </Button>
                </div>

                {workflowData?.data?.recentOrders && workflowData.data.recentOrders.length > 0 ? (
                    <div className="space-y-3">
                        {workflowData.data.recentOrders.map((order: any) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                onClick={() => navigate(`/distribution/orders/${order.id}`)}
                            >
                                <div className="flex items-center space-x-3">
                                    <Package className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="font-medium text-gray-900">{order.customer?.name}</p>
                                        <p className="text-sm text-gray-500">{order.location?.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <StatusBadge status={order.status} />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(order.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Average Processing Time"
                    value="3.2 days"
                    change="-12%"
                    trend="down"
                    icon={<Clock className="h-6 w-6" />}
                />
                <MetricCard
                    title="On-Time Delivery Rate"
                    value="94.5%"
                    change="+5%"
                    trend="up"
                    icon={<TrendingUp className="h-6 w-6" />}
                />
                <MetricCard
                    title="Active Orders"
                    value={Object.values(stages).reduce((a: number, b: number) => a + b, 0) - (stages.stage5_delivered || 0)}
                    icon={<Activity className="h-6 w-6" />}
                />
            </div>
        </div>
    );
};

// Helper Components
interface StageCardProps {
    title: string;
    count: number;
    icon: React.ReactNode;
    color: 'orange' | 'blue' | 'purple' | 'indigo' | 'green';
    description: string;
    onClick: () => void;
    pulse?: boolean;
}

const StageCard: React.FC<StageCardProps> = ({
    title,
    count,
    icon,
    color,
    description,
    onClick,
    pulse,
}) => {
    const colorClasses = {
        orange: 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100',
        blue: 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100',
        purple: 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100',
        indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100',
        green: 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100',
    };

    return (
        <div
            onClick={onClick}
            className={`${colorClasses[color]} border-2 rounded-lg p-6 cursor-pointer transition-all transform hover:scale-105 hover:shadow-lg ${pulse ? 'animate-pulse' : ''
                }`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="opacity-80">{icon}</div>
                <span className="text-3xl font-bold">{count}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-xs opacity-75">{description}</p>
        </div>
    );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusConfig = {
        PENDING: { label: 'Pending', class: 'bg-gray-100 text-gray-800' },
        PAYMENT_CONFIRMED: { label: 'Payment Confirmed', class: 'bg-blue-100 text-blue-800' },
        SENT_TO_RITE_FOODS: { label: 'At Rite Foods', class: 'bg-purple-100 text-purple-800' },
        PROCESSING_BY_RFL: { label: 'Processing', class: 'bg-purple-100 text-purple-800' },
        LOADED: { label: 'Loaded', class: 'bg-indigo-100 text-indigo-800' },
        IN_TRANSIT: { label: 'In Transit', class: 'bg-indigo-100 text-indigo-800' },
        DELIVERED: { label: 'Delivered', class: 'bg-green-100 text-green-800' },
        PARTIALLY_DELIVERED: { label: 'Partial', class: 'bg-yellow-100 text-yellow-800' },
        CANCELLED: { label: 'Cancelled', class: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.class}`}>
            {config.label}
        </span>
    );
};

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down';
    icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, trend, icon }) => (
    <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
            <div className="text-gray-400">{icon}</div>
            {change && (
                <span className={`text-xs font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {change}
                </span>
            )}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
    </div>
);