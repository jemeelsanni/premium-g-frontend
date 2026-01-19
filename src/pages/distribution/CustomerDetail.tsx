/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/distribution/CustomerDetail.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Building,
    Mail,
    Phone,
    MapPin,
    Calendar,
    DollarSign,
    ShoppingBag,
    TrendingUp,
    Edit,
    Package,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Table } from '../../components/ui/Table';
import { formatDate } from '@/utils/dateUtils';

export const CustomerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'orders'>('overview');

    // Fetch customer details
    const { data: customerResponse, isLoading: isLoadingCustomer } = useQuery({
        queryKey: ['distribution-customer', id],
        queryFn: () => distributionService.getCustomer(id!),
        enabled: !!id,
    });

    // Fetch customer orders
    const { data: ordersResponse, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['distribution-customer-orders', id],
        queryFn: () => distributionService.getCustomerOrders(id!),
        enabled: !!id,
    });

    // Unwrap the response - API might return { data: customer } or just customer
    const customer = (customerResponse as any)?.data || customerResponse;
    const orders = (ordersResponse as any)?.data || ordersResponse;

    if (isLoadingCustomer) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Customer not found</p>
                <Button onClick={() => navigate('/distribution/customers')} className="mt-4">
                    Back to Customers
                </Button>
            </div>
        );
    }

    const customerBalance = (customer as any)?.customerBalance || 0;
    const isDebt = customerBalance > 0;
    const isCredit = customerBalance < 0;
    const hasBalance = Math.abs(customerBalance) > 0.01;

    // Customer type badge color
    const typeColorMap = {
        BUSINESS: 'bg-blue-100 text-blue-800',
        ENTERPRISE: 'bg-purple-100 text-purple-800',
        GOVERNMENT: 'bg-green-100 text-green-800',
    };

    // Order columns for table
    const orderColumns = [
        {
            key: 'orderNumber',
            title: 'Order #',
            render: (value: string) => (
                <span className="font-medium text-blue-600">{value}</span>
            )
        },
        {
            key: 'createdAt',
            title: 'Date',
            render: (value: string) => formatDate(value)
        },
        {
            key: 'totalPallets',
            title: 'Pallets',
            render: (value: number, record: any) => (
                <div className="text-sm">
                    <div className="font-medium">{value} pallets</div>
                    <div className="text-gray-500">{record.totalPacks} packs</div>
                </div>
            )
        },
        {
            key: 'finalAmount',
            title: 'Amount',
            render: (value: number) => (
                <span className="font-semibold">
                    ₦{value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            )
        },
        {
            key: 'paymentStatus',
            title: 'Payment',
            render: (value: string, record: any) => {
                const statusConfig = {
                    PENDING: { color: 'bg-gray-100 text-gray-800', icon: Clock },
                    PARTIAL: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
                    CONFIRMED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
                    OVERPAID: { color: 'bg-blue-100 text-blue-800', icon: TrendingUp }
                };
                const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.PENDING;
                const Icon = config.icon;

                return (
                    <div>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {value}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                            Paid: ₦{record.amountPaid?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        {record.balance > 0 && (
                            <div className="text-xs text-red-600">
                                Balance: ₦{record.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'status',
            title: 'Order Status',
            render: (value: string) => (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {value}
                </span>
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (record: any) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/distribution/orders/${record.id}`)}
                >
                    View Details
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/distribution/customers')}
                        className="flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                        <p className="text-sm text-gray-500">Customer Details</p>
                    </div>
                </div>
                <Button
                    onClick={() => navigate(`/distribution/customers`)}
                    className="flex items-center"
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Customer
                </Button>
            </div>

            {/* Customer Balance Alert */}
            {hasBalance && (
                <div className={`p-4 rounded-lg border-2 ${
                    isDebt ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                    <div className="flex items-center">
                        <div className={`flex-shrink-0 ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className={`text-lg font-semibold ${isDebt ? 'text-red-800' : 'text-green-800'}`}>
                                {isDebt ? 'Outstanding Balance' : 'Credit Balance'}
                            </h3>
                            <p className={`text-2xl font-bold ${isDebt ? 'text-red-900' : 'text-green-900'}`}>
                                ₦{Math.abs(customerBalance).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </p>
                            <p className={`text-sm ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                                {isDebt
                                    ? 'This customer owes your company money'
                                    : 'This customer has credit with your company'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ShoppingBag className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Orders
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {customer.totalOrders || 0}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <DollarSign className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Spent
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        ₦{(customer.totalSpent || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Avg Order Value
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        ₦{(customer.totalOrders || 0) > 0
                                            ? ((customer.totalSpent || 0) / (customer.totalOrders || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })
                                            : '0'}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`overflow-hidden shadow rounded-lg ${
                    isDebt ? 'bg-red-50' : isCredit ? 'bg-green-50' : 'bg-white'
                }`}>
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <DollarSign className={`h-8 w-8 ${
                                    isDebt ? 'text-red-600' : isCredit ? 'text-green-600' : 'text-gray-600'
                                }`} />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Balance
                                    </dt>
                                    <dd className={`text-2xl font-bold ${
                                        isDebt ? 'text-red-900' : isCredit ? 'text-green-900' : 'text-gray-900'
                                    }`}>
                                        ₦{Math.abs(customerBalance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </dd>
                                    <dd className={`text-xs ${
                                        isDebt ? 'text-red-600' : isCredit ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                        {isDebt ? 'Owes' : isCredit ? 'Credit' : 'Clear'}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white shadow rounded-lg">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`${
                                activeTab === 'overview'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`${
                                activeTab === 'orders'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <Package className="h-4 w-4 mr-2" />
                            Orders ({orders?.length || 0})
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Customer Information */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Customer Information
                                </h3>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="flex items-start">
                                        <Building className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Business Name</p>
                                            <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
                                        </div>
                                    </div>

                                    {customer.email && (
                                        <div className="flex items-start">
                                            <Mail className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Email</p>
                                                <p className="mt-1 text-sm text-gray-900">{customer.email}</p>
                                            </div>
                                        </div>
                                    )}

                                    {customer.phone && (
                                        <div className="flex items-start">
                                            <Phone className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Phone</p>
                                                <p className="mt-1 text-sm text-gray-900">{customer.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {customer.address && (
                                        <div className="flex items-start">
                                            <MapPin className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Address</p>
                                                <p className="mt-1 text-sm text-gray-900">{customer.address}</p>
                                            </div>
                                        </div>
                                    )}

                                    {customer.customerType && (
                                        <div className="flex items-start">
                                            <Building className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Customer Type</p>
                                                <p className="mt-1">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        typeColorMap[customer.customerType as keyof typeof typeColorMap] || 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {customer.customerType}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {customer.territory && (
                                        <div className="flex items-start">
                                            <MapPin className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Territory</p>
                                                <p className="mt-1 text-sm text-gray-900">{customer.territory}</p>
                                            </div>
                                        </div>
                                    )}

                                    {customer.lastOrderDate && (
                                        <div className="flex items-start">
                                            <Calendar className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Last Order Date</p>
                                                <p className="mt-1 text-sm text-gray-900">
                                                    {formatDate(customer.lastOrderDate)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start">
                                        <Calendar className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Customer Since</p>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {formatDate(customer.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div>
                            {isLoadingOrders ? (
                                <div className="flex justify-center py-8">
                                    <LoadingSpinner />
                                </div>
                            ) : orders && orders.length > 0 ? (
                                <Table
                                    data={orders}
                                    columns={orderColumns}
                                    loading={isLoadingOrders}
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        This customer hasn't placed any orders yet.
                                    </p>
                                    <div className="mt-6">
                                        <Button
                                            onClick={() => navigate('/distribution/orders/create')}
                                        >
                                            Create New Order
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
