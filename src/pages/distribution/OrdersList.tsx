import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { distributionApi } from '../../api/distribution.api';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/format';
import { Plus, Eye, Edit, Download } from 'lucide-react';
import { toast } from '../../utils/toast';

export const OrdersList = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0
    });
    const [filters, setFilters] = useState({});

    // Fetch orders
    const fetchOrders = async (page = 1, pageSize = 20, searchTerm = '', filterParams = {}) => {
        try {
            setLoading(true);
            const response = await distributionApi.getOrders({
                page,
                limit: pageSize,
                search: searchTerm,
                ...filterParams
            });

            setOrders(response.data);
            setPagination({
                current: page,
                pageSize,
                total: response.total
            });
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Handle search
    const handleSearch = (searchTerm: string) => {
        fetchOrders(1, pagination.pageSize, searchTerm, filters);
    };

    // Handle filter
    const handleFilter = (newFilters: Record<string, any>) => {
        setFilters(newFilters);
        fetchOrders(1, pagination.pageSize, '', newFilters);
    };

    // Handle sort
    const handleSort = (sortField: string, sortOrder: 'asc' | 'desc') => {
        fetchOrders(pagination.current, pagination.pageSize, '', {
            ...filters,
            sortField,
            sortOrder
        });
    };

    // Handle pagination
    const handlePagination = (page: number, pageSize: number) => {
        fetchOrders(page, pageSize, '', filters);
    };

    // Handle export
    const handleExport = async (format: 'csv' | 'excel') => {
        try {
            const response = await distributionApi.exportOrders(filters, format);

            // Create download link
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `distribution_orders.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success(`Orders exported as ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export orders');
        }
    };

    // Status badge color mapping
    const getStatusColor = (status: string) => {
        const colors = {
            PENDING: 'yellow',
            CONFIRMED: 'blue',
            PROCESSING: 'purple',
            IN_TRANSIT: 'indigo',
            DELIVERED: 'green',
            PARTIALLY_DELIVERED: 'orange',
            CANCELLED: 'red'
        };
        return colors[status as keyof typeof colors] || 'gray';
    };

    // Table columns
    const columns: Column[] = [
        {
            key: 'id',
            title: 'Order ID',
            sortable: true,
            render: (value) => (
                <span className="font-mono text-sm">{value.slice(-8)}</span>
            )
        },
        {
            key: 'customer',
            title: 'Customer',
            sortable: true,
            filterable: true,
            render: (_, record) => (
                <div>
                    <div className="font-medium">{record.customer?.name}</div>
                    <div className="text-sm text-gray-500">{record.customer?.email}</div>
                </div>
            )
        },
        {
            key: 'location',
            title: 'Location',
            filterable: true,
            render: (_, record) => record.location?.name
        },
        {
            key: 'totalPacks',
            title: 'Packs',
            sortable: true,
            align: 'right' as const,
            render: (value) => value.toLocaleString()
        },
        {
            key: 'finalAmount',
            title: 'Amount',
            sortable: true,
            align: 'right' as const,
            render: (value) => formatCurrency(value)
        },
        {
            key: 'status',
            title: 'Status',
            filterable: true,
            render: (value) => (
                <Badge color={getStatusColor(value)} variant="soft">
                    {value.replace('_', ' ')}
                </Badge>
            )
        },
        {
            key: 'createdAt',
            title: 'Created',
            sortable: true,
            render: (value) => formatDate(value)
        }
    ];

    // Row actions
    const rowActions = [
        {
            key: 'view',
            label: 'View',
            icon: Eye,
            onClick: (record: any) => navigate(`/distribution/orders/${record.id}`)
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: Edit,
            onClick: (record: any) => navigate(`/distribution/orders/${record.id}/edit`),
            visible: (record: any) => ['PENDING', 'CONFIRMED'].includes(record.status)
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Distribution Orders</h1>
                    <p className="text-gray-600">Manage B2B customer orders and deliveries</p>
                </div>

                <Button onClick={() => navigate('/distribution/orders/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Order
                </Button>
            </div>

            <DataTable
                data={orders}
                columns={columns}
                loading={loading}
                pagination={{
                    ...pagination,
                    onChange: handlePagination
                }}
                onSearch={handleSearch}
                onFilter={handleFilter}
                onSort={handleSort}
                onExport={handleExport}
                onRefresh={() => fetchOrders(pagination.current, pagination.pageSize)}
                rowActions={rowActions}
                selectable
                title="Orders"
                subtitle={`${pagination.total} total orders`}
            />
        </div>
    );
};