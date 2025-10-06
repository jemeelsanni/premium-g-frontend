/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Package,
    ShoppingCart,
    Users,
    DollarSign,
    Plus,
    ArrowRight,
    AlertCircle,
    AlertTriangle,
    Receipt,
    Percent
} from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { WarehouseInventory, WarehouseExpense } from '../../types/warehouse';

export const WarehouseDashboard: React.FC = () => {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['warehouse-dashboard'],
        queryFn: () => warehouseService.getDashboardStats(),
    });

    const { data: recentSales } = useQuery({
        queryKey: ['warehouse-sales', 1, 5],
        queryFn: () => warehouseService.getSales(1, 5),
        select: (data) => ({
            data: {
                sales: data?.data?.sales || []
            }
        })
    });

    const { data: lowStockItems } = useQuery({
        queryKey: ['warehouse-inventory-low-stock'],
        queryFn: () => warehouseService.getInventory(1, 10),
    });

    const { data: customersList } = useQuery({
        queryKey: ['warehouse-customers-count'],
        queryFn: () => warehouseService.getCustomers(1, 1000),
        select: (response) => {
            const customers = response?.data?.customers || [];
            const pagination = response?.data?.pagination;
            return {
                customers,
                total: pagination?.total ?? customers.length,
                active: customers.filter((customer) => customer.isActive ?? true).length
            };
        }
    });

    const { data: expensesData, isLoading: expensesLoading } = useQuery({
        queryKey: ['warehouse-expenses-dashboard', 1, 5],
        queryFn: () => warehouseService.getExpenses({ page: 1, limit: 5 }),
    });

    const parseNumber = (value: unknown, fallback = 0) => {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : fallback;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">Failed to load dashboard data</p>
                </div>
            </div>
        );
    }

    const summary = (stats?.data?.summary ?? stats?.summary ?? {}) as Record<string, unknown>;
    const inventorySummary = (stats?.data?.inventory ?? stats?.inventory ?? {}) as Record<string, unknown>;
    const customerSummary = (stats?.data?.customerSummary ?? stats?.customerSummary ?? {}) as Record<string, unknown>;

    const safeSummaryNumber = (key: string, fallback = 0) => parseNumber(summary[key], fallback);

    const lowStockRaw = lowStockItems?.data;
    const fallbackInventoryCount = Array.isArray(lowStockRaw)
        ? lowStockRaw.length
        : Array.isArray((lowStockRaw as any)?.inventory)
            ? (lowStockRaw as any).inventory.length
            : 0;

    const totalInventoryItems = parseNumber(
        (inventorySummary as { totalItems?: unknown })?.totalItems,
        fallbackInventoryCount
    );

    const activeCustomerCount = parseNumber(
        (customerSummary as { activeCustomers?: unknown })?.activeCustomers
            ?? (summary as { activeCustomers?: unknown })?.activeCustomers,
        customersList?.active ?? 0
    );

    const statCards = [
        {
            title: 'Total Sales',
            value: safeSummaryNumber('totalSales'),
            icon: ShoppingCart,
            color: 'blue',
            change: '+18%'
        },
        {
            title: 'Revenue',
            value: `₦${safeSummaryNumber('totalRevenue').toLocaleString()}`,
            icon: DollarSign,
            color: 'green',
            change: '+12%'
        },
        {
            title: 'Inventory Items',
            value: totalInventoryItems,
            icon: Package,
            color: 'purple',
            change: '+5%'
        },
        {
            title: 'Active Customers',
            value: activeCustomerCount,
            icon: Users,
            color: 'orange',
            change: '+8%'
        }
    ];

    const salesColumns = [
        {
            key: 'product',
            title: 'Product',
            render: (value: any) => value?.name || 'Unknown Product'
        },
        {
            key: 'customerName',
            title: 'Customer',
            render: (value: string) => value || 'Walk-in Customer'
        },
        {
            key: 'quantity',
            title: 'Quantity',
            render: (value: number | null | undefined) => {
                return typeof value === 'number' ? value.toLocaleString() : '0';
            }
        },
        {
            key: 'unitPrice',
            title: 'Unit Price',
            render: (value: number | null | undefined) => {
                const price = typeof value === 'number' ? value : 0;
                return `₦${price.toLocaleString()}`;
            }
        },
        {
            key: 'totalAmount',
            title: 'Total',
            render: (value: number | null | undefined) => {
                const amount = typeof value === 'number' ? value : 0;
                return `₦${amount.toLocaleString()}`;
            }
        },
        {
            key: 'createdAt',
            title: 'Date',
            render: (value: string) => value ? new Date(value).toLocaleDateString() : 'N/A'
        }
    ];

    const lowStockColumns = [
        {
            key: 'product',
            title: 'Product',
            render: (value: any) => value?.name || 'Unknown Product'
        },
        {
            key: 'currentStock',
            title: 'Current Stock',
            render: (value: number | undefined) => (
                <span className="text-red-600 font-medium">
                    {typeof value === 'number' ? value.toLocaleString() : '0'}
                </span>
            )
        },
        {
            key: 'minimumStock',
            title: 'Minimum Stock',
            render: (value: number | undefined) => (
                typeof value === 'number' ? value.toLocaleString() : '0'
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_value: any, _record: any) => (
                <Link to={`/warehouse/inventory`}>
                    <Button size="sm" variant="outline">
                        Restock
                    </Button>
                </Link>
            )
        }
    ];

    const rawLowStockData = lowStockItems?.data;
    const lowStockInventory = Array.isArray(rawLowStockData)
        ? rawLowStockData
        : Array.isArray((rawLowStockData as any)?.inventory)
            ? (rawLowStockData as any).inventory
            : [];

    const normalizedLowStock: WarehouseInventory[] = lowStockInventory.map((item: any) => {
        const currentStock = parseNumber(item.currentStock ?? item.packs ?? item.units ?? 0);
        const minimumStock = parseNumber(item.minimumStock ?? item.reorderLevel ?? 0);

        return {
            ...item,
            currentStock,
            minimumStock,
        } as WarehouseInventory;
    });

    const lowStock = normalizedLowStock.filter(item => {
        const current = parseNumber(item.currentStock);
        const minimum = parseNumber(item.minimumStock);
        return current <= minimum;
    });

    const recentExpenses: WarehouseExpense[] = expensesData?.data?.expenses || [];

    const expenseColumns = [
        {
            key: 'description',
            title: 'Description',
            render: (_value: string | undefined, record: WarehouseExpense) => (
                <div>
                    <div className="font-medium text-gray-900">
                        {record.description || record.category || 'Expense'}
                    </div>
                    <div className="text-xs text-gray-500">
                        {record.product?.name ? `Product: ${record.product.name}` : 'General expense'}
                    </div>
                </div>
            )
        },
        {
            key: 'amount',
            title: 'Amount',
            render: (value: number | string) => {
                const amountValue = parseNumber(value);
                return <span className="font-semibold text-gray-900">₦{amountValue.toLocaleString()}</span>;
            }
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: WarehouseExpense['status']) => {
                const badgeClasses: Record<WarehouseExpense['status'], string> = {
                    PENDING: 'bg-yellow-100 text-yellow-800',
                    APPROVED: 'bg-green-100 text-green-800',
                    REJECTED: 'bg-red-100 text-red-800',
                    PAID: 'bg-blue-100 text-blue-800'
                };
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses[value]}`}>
                        {value}
                    </span>
                );
            }
        },
        {
            key: 'createdAt',
            title: 'Date',
            render: (value: string) => new Date(value).toLocaleDateString()
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Warehouse Dashboard
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage inventory, sales, and direct customer operations
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    <Link to="/warehouse/sales/create">
                        <Button className="inline-flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            Record Sale
                        </Button>
                    </Link>
                    <Link to="/warehouse/customers">
                        <Button variant="outline">
                            Manage Customers
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Low Stock Alert */}
            {lowStock.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">
                                Low Stock Alert
                            </h3>
                            <div className="mt-1 text-sm text-red-700">
                                {lowStock.length} item(s) are running low on stock and need restocking.
                                <Link to="/warehouse/inventory" className="font-medium underline ml-1">
                                    View inventory →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {stat.title}
                                        </dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900">
                                                {stat.value}
                                            </div>
                                            <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                                                {stat.change}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <Link
                            to="/warehouse/sales/create"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                                    <ShoppingCart className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Record Sale
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Record a new warehouse sale
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>

                        <Link
                            to="/warehouse/inventory"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600 group-hover:bg-purple-100">
                                    <Package className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Manage Inventory
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    View and update stock levels
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>

                        <Link
                            to="/warehouse/customers"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 group-hover:bg-green-100">
                                    <Users className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Customer Database
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Manage warehouse customers
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>

                        <Link
                            to="/warehouse/cash-flow"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-orange-50 text-orange-600 group-hover:bg-orange-100">
                                    <DollarSign className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Cash Flow
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Monitor cash flow operations
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>

                        <Link
                            to="/warehouse/expenses"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-rose-50 text-rose-600 group-hover:bg-rose-100">
                                    <Receipt className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Warehouse Expenses
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Review and track spend history
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>

                        <Link
                            to="/warehouse/discounts"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
                                    <Percent className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Discount Requests
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Review and approve warehouse discounts
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3" id="recent-expenses">
                {/* Recent Sales */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Recent Sales
                            </h3>
                            <Link
                                to="/warehouse/sales"
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                View all sales
                            </Link>
                        </div>
                    </div>
                    <div className="p-6">
                        <Table
                            data={recentSales?.data?.sales || []}
                            columns={salesColumns}
                            loading={!recentSales}
                            emptyMessage="No recent sales found"
                        />
                    </div>
                </div>

                {/* Low Stock Items */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                Low Stock Items
                            </h3>
                            <Link
                                to="/warehouse/inventory"
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                View inventory
                            </Link>
                        </div>
                    </div>
                    <div className="p-6">
                        <Table
                            data={lowStock}
                            columns={lowStockColumns}
                            loading={!lowStockItems}
                            emptyMessage="All items are well stocked"
                        />
                    </div>
                </div>

                {/* Recent Expenses */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Recent Expenses
                            </h3>
                            <Link
                                to="/warehouse/expenses"
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                View details
                            </Link>
                        </div>
                    </div>
                    <div className="p-6">
                        <Table
                            data={recentExpenses}
                            columns={expenseColumns}
                            loading={expensesLoading}
                            emptyMessage="No expenses recorded yet"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
