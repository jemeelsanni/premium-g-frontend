/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Eye, Calendar, X } from 'lucide-react';
import { warehouseService, CustomerFilters } from '../../services/warehouseService';
import { WarehouseCustomer } from '../../types/warehouse';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { globalToast } from '../../components/ui/Toast';

const customerSchema = z.object({
    name: z.string().min(1, 'Customer name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    address: z.string().min(1, 'Address is required'),
    customerType: z.string().min(1, 'Customer type is required'),
});

type CustomerFormData = z.infer<typeof customerSchema>;
type DateFilterType = 'month' | 'year' | 'custom';

export const CustomersList: React.FC = () => {
    const navigate = useNavigate();

    // ✅ CHANGED: Default sortBy to 'topPurchases'
    const [filters, setFilters] = useState<Required<Pick<CustomerFilters, 'page' | 'limit' | 'sortBy'>>>({
        page: 1,
        limit: 10,
        sortBy: 'topPurchases',  // ✅ Default to highest purchases
    });

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<CustomerFilters['customerType']>();
    const [hasDebt, setHasDebt] = useState<boolean | undefined>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<WarehouseCustomer | null>(null);

    // ✅ NEW: Date filter states
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [dateFilterType, setDateFilterType] = useState<DateFilterType>('month');
    const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
    });

    // ✅ UPDATED: Query with new date filters
    const { data, isLoading } = useQuery({
        queryKey: ['warehouse-customers', filters, search, filterType, hasDebt, dateFilterType, filterMonth, filterYear, startDate, endDate],
        queryFn: async () => {
            const queryFilters: CustomerFilters = {
                ...filters,
                search: search || undefined,
                customerType: filterType,
                hasOutstandingDebt: hasDebt,
            };

            // Add date filters based on type
            if (dateFilterType === 'month' && filterMonth && filterYear) {
                queryFilters.filterMonth = filterMonth;
                queryFilters.filterYear = filterYear;
            } else if (dateFilterType === 'year' && filterYear) {
                queryFilters.filterYear = filterYear;
            } else if (dateFilterType === 'custom') {
                queryFilters.startDate = startDate || undefined;
                queryFilters.endDate = endDate || undefined;
            }

            return warehouseService.getCustomers(queryFilters);
        },
    });

    const customers = data?.data?.customers || [];
    const analytics = data?.data?.analytics || null;
    const pagination = data?.data?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };

    // ✅ NEW: Clear date filters
    const handleClearDateFilters = () => {
        setFilterMonth(new Date().getMonth() + 1);
        setFilterYear(new Date().getFullYear());
        setStartDate('');
        setEndDate('');
        setShowDateFilter(false);
    };

    // ✅ NEW: Get active filter description
    const getActiveDateFilterText = () => {
        if (!showDateFilter) return null;

        if (dateFilterType === 'month') {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[filterMonth - 1]} ${filterYear}`;
        } else if (dateFilterType === 'year') {
            return `Year ${filterYear}`;
        } else if (dateFilterType === 'custom' && (startDate || endDate)) {
            const start = startDate ? new Date(startDate).toLocaleDateString() : 'Start';
            const end = endDate ? new Date(endDate).toLocaleDateString() : 'End';
            return `${start} → ${end}`;
        }
        return null;
    };

    // Generate year options (last 5 years + current + next year)
    const yearOptions = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i);

    // ... rest of your existing mutation handlers ...

    const createMutation = useMutation({
        mutationFn: (payload: CustomerFormData) => warehouseService.createCustomer(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-customers'] });
            globalToast.success('Customer added successfully!');
            closeModal();
        },
        onError: (err: any) => {
            globalToast.error(err.response?.data?.message || 'Failed to add customer');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CustomerFormData }) =>
            warehouseService.updateCustomer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-customers'] });
            globalToast.success('Customer updated successfully!');
            closeModal();
        },
        onError: (err: any) => {
            globalToast.error(err.response?.data?.message || 'Failed to update customer');
        },
    });

    const openModal = (customer?: WarehouseCustomer) => {
        if (customer) {
            setEditingCustomer(customer);
            reset({
                name: customer.name,
                phone: customer.phone ?? '',
                address: customer.address ?? '',
                customerType: customer.customerType,
            });
        } else {
            setEditingCustomer(null);
            reset({
                name: '',
                phone: '',
                address: '',
                customerType: 'INDIVIDUAL',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
        reset();
    };

    const onSubmit = (data: CustomerFormData) => {
        if (editingCustomer) {
            updateMutation.mutate({ id: editingCustomer.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleSearch = () => {
        setFilters((prev) => ({ ...prev, page: 1 }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const columns = [
        {
            key: 'name',
            title: 'Customer Name',
            render: (_: unknown, record: WarehouseCustomer) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{record.name}</span>
                    {record.isVIP && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                            VIP
                        </span>
                    )}
                    {record.isRecent && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded">
                            Recent
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'totalProfit',
            title: 'Customer Profit',
            render: (value: number) => {
                const profit = parseFloat(value?.toString() || '0');
                return (
                    <span className={profit > 0 ? 'font-semibold text-green-600' : profit < 0 ? 'font-semibold text-red-600' : 'text-gray-500'}>
                        {formatCurrency(profit)}
                    </span>
                );
            },
        },
        {
            key: 'customerType',
            title: 'Type',
        },
        {
            key: 'totalPurchases',
            title: 'Total Purchases',
            render: (value: number) => (
                <span className="font-semibold text-blue-600">{value || 0}</span>
            ),
        },
        {
            key: 'totalSpent',
            title: 'Total Spent',
            render: (value: number) => (
                <span className="font-semibold">{formatCurrency(value || 0)}</span>
            ),
        },
        {
            key: 'outstandingDebt',
            title: 'Outstanding Debt',
            render: (value: number) => {
                const debt = parseFloat(value?.toString() || '0');
                return (
                    <span className={debt > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                        {formatCurrency(debt)}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_: unknown, record: WarehouseCustomer) => (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/warehouse/customers/${record.id}`)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openModal(record)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Warehouse Customers</h1>
            </div>

            {/* Analytics Cards */}
            {analytics && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Customers</h3>
                        <p className="text-2xl font-bold text-blue-600">{analytics.totalCustomers}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Purchases</h3>
                        <p className="text-2xl font-bold text-green-600">{analytics.totalPurchases}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Revenue</h3>
                        <p className="text-2xl font-bold text-purple-600">
                            {formatCurrency(analytics.totalRevenue)}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Avg Order Value</h3>
                        <p className="text-2xl font-bold text-indigo-600">
                            {formatCurrency(analytics.averageOrderValue)}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Avg Credit Score</h3>
                        <p className="text-2xl font-bold text-yellow-600">
                            {analytics.averagePaymentScore?.toFixed(1) || 0}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Debt</h3>
                        <p className="text-2xl font-bold text-red-600">
                            {formatCurrency(analytics.totalOutstandingDebt)}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="space-y-3">
                <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-1 gap-2 min-w-[200px]">
                        <Input
                            placeholder="Search customers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1"
                        />
                        <Button onClick={handleSearch}>Search</Button>
                    </div>

                    <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
                        className="px-3 py-2 border rounded-lg bg-white"
                    >
                        <option value="topPurchases">Most Purchases</option>
                        <option value="topSpender">Top Spenders</option>
                        <option value="recent">Recent Activity</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="creditScore">Credit Score</option>
                    </select>

                    <select
                        value={filterType || 'all'}
                        onChange={(e) =>
                            setFilterType(e.target.value === 'all' ? undefined : (e.target.value as any))
                        }
                        className="px-3 py-2 border rounded-lg bg-white"
                    >
                        <option value="all">All Types</option>
                        <option value="INDIVIDUAL">Individuals</option>
                        <option value="BUSINESS">Businesses</option>
                        <option value="RETAILER">Retailers</option>
                    </select>

                    <select
                        value={hasDebt === undefined ? 'all' : hasDebt ? 'true' : 'false'}
                        onChange={(e) =>
                            setHasDebt(e.target.value === 'all' ? undefined : e.target.value === 'true')
                        }
                        className="px-3 py-2 border rounded-lg bg-white"
                    >
                        <option value="all">All Customers</option>
                        <option value="true">With Debt</option>
                        <option value="false">No Debt</option>
                    </select>

                    {/* ✅ NEW: Date Filter Toggle */}
                    <Button
                        variant={showDateFilter ? 'primary' : 'outline'}
                        onClick={() => setShowDateFilter(!showDateFilter)}
                        className="flex items-center gap-2"
                    >
                        <Calendar className="h-4 w-4" />
                        {showDateFilter ? 'Hide Dates' : 'Filter by Date'}
                    </Button>

                    <Button onClick={() => openModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                    </Button>
                </div>

                {/* ✅ NEW: Date Filter Panel */}
                {showDateFilter && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg shadow-md border border-blue-200">
                        <div className="space-y-4">
                            {/* Filter Type Selector */}
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-semibold text-gray-700">Filter by:</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setDateFilterType('month')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateFilterType === 'month'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-blue-100'
                                            }`}
                                    >
                                        Month
                                    </button>
                                    <button
                                        onClick={() => setDateFilterType('year')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateFilterType === 'year'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-blue-100'
                                            }`}
                                    >
                                        Year
                                    </button>
                                    <button
                                        onClick={() => setDateFilterType('custom')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateFilterType === 'custom'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-blue-100'
                                            }`}
                                    >
                                        Custom Range
                                    </button>
                                </div>
                            </div>

                            {/* Month Filter */}
                            {dateFilterType === 'month' && (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Month
                                        </label>
                                        <select
                                            value={filterMonth}
                                            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border rounded-lg bg-white"
                                        >
                                            <option value={1}>January</option>
                                            <option value={2}>February</option>
                                            <option value={3}>March</option>
                                            <option value={4}>April</option>
                                            <option value={5}>May</option>
                                            <option value={6}>June</option>
                                            <option value={7}>July</option>
                                            <option value={8}>August</option>
                                            <option value={9}>September</option>
                                            <option value={10}>October</option>
                                            <option value={11}>November</option>
                                            <option value={12}>December</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Year
                                        </label>
                                        <select
                                            value={filterYear}
                                            onChange={(e) => setFilterYear(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border rounded-lg bg-white"
                                        >
                                            {yearOptions.map((year) => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Year Only Filter */}
                            {dateFilterType === 'year' && (
                                <div className="max-w-xs">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Year
                                    </label>
                                    <select
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border rounded-lg bg-white"
                                    >
                                        {yearOptions.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Custom Date Range Filter */}
                            {dateFilterType === 'custom' && (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Start Date
                                        </label>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Date
                                        </label>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Active Filter Display & Clear Button */}
                            <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                                {getActiveDateFilterText() && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-blue-700">
                                            Active filter:
                                        </span>
                                        <span className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                                            {getActiveDateFilterText()}
                                        </span>
                                    </div>
                                )}
                                <Button
                                    onClick={handleClearDateFilters}
                                    variant="outline"
                                    size="sm"
                                    className="ml-auto flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Clear Filter
                                </Button>
                            </div>

                            <p className="text-xs text-gray-600 italic">
                                Filter shows customers created or who made purchases during the selected period
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow">
                <Table
                    columns={columns}
                    data={customers}
                    loading={isLoading}
                    pagination={{
                        current: pagination.page,
                        pageSize: pagination.limit,
                        total: pagination.total,
                        onChange: (page) => setFilters((prev) => ({ ...prev, page })),
                    }}
                />
            </div>

            {/* Modal for Add/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Name *
                        </label>
                        <Input {...register('name')} placeholder="Enter customer name" />
                        {errors.name && (
                            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                        <Input {...register('phone')} placeholder="Enter phone number" />
                        {errors.phone && (
                            <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                        <Input {...register('address')} placeholder="Enter address" />
                        {errors.address && (
                            <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Type *
                        </label>
                        <select
                            {...register('customerType')}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="INDIVIDUAL">Individual</option>
                            <option value="BUSINESS">Business</option>
                            <option value="RETAILER">Retailer</option>
                        </select>
                        {errors.customerType && (
                            <p className="text-sm text-red-600 mt-1">{errors.customerType.message}</p>
                        )}
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Saving...'
                                : editingCustomer
                                    ? 'Update Customer'
                                    : 'Add Customer'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};