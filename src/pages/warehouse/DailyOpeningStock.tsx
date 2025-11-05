/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Package,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Download,
    Filter
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';

interface OpeningStockItem {
    productId: string;
    productNo: string;
    productName: string;
    location: string | null;
    date: string;
    openingStock: {
        pallets: number;
        packs: number;
        units: number;
        total: number;
    };
    movements: {
        salesQuantity: number;
        salesRevenue: number;
        purchasesQuantity: number;
        salesCount: number;
        purchasesCount: number;
    };
    closingStock: {
        pallets: number;
        packs: number;
        units: number;
        total: number;
    };
    variance: {
        pallets: number;
        packs: number;
        units: number;
        total: number;
    };
    reorderLevel: number;
    stockStatus: 'LOW_STOCK' | 'NORMAL';
}

interface OpeningStockResponse {
    success: boolean;
    data: {
        summary: {
            date: string;
            totalProducts: number;
            totalOpeningStock: number;
            totalClosingStock: number;
            totalSalesRevenue: number;
            totalSalesQuantity: number;
            totalPurchasesQuantity: number;
            lowStockItems: number;
        };
        openingStock: OpeningStockItem[];
    };
}

const DailyOpeningStock: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<string>(
        format(new Date(), 'yyyy-MM-dd')
    );
    const [filterProduct, setFilterProduct] = useState<string>('');
    const [filterLocation, setFilterLocation] = useState<string>('');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    // Fetch opening stock data
    const { data, isLoading, error } = useQuery<OpeningStockResponse>({
        queryKey: ['openingStock', selectedDate, filterProduct, filterLocation],
        queryFn: async () => {
            const params = new URLSearchParams({ date: selectedDate });
            if (filterProduct) params.append('productId', filterProduct);
            if (filterLocation) params.append('location', filterLocation);

            const response = await api.get(`/warehouse/opening-stock?${params.toString()}`);
            return response.data;
        },
    });

    // Fetch products for filter dropdown
    const { data: productsData } = useQuery({
        queryKey: ['warehouseProducts'],
        queryFn: async () => {
            const response = await api.get('/warehouse/products');
            return response.data;
        },
    });

    const products = productsData?.data?.products || [];

    // Filter data based on UI filters
    const filteredData = React.useMemo(() => {
        if (!data?.data?.openingStock) return [];

        let filtered = data.data.openingStock;

        if (showLowStockOnly) {
            filtered = filtered.filter(item => item.stockStatus === 'LOW_STOCK');
        }

        return filtered;
    }, [data, showLowStockOnly]);

    // Export to CSV function
    const handleExportCSV = () => {
        if (!filteredData.length) return;

        const headers = [
            'Product No',
            'Product Name',
            'Location',
            'Opening Stock (Total)',
            'Opening Pallets',
            'Opening Packs',
            'Opening Units',
            'Sales Qty',
            'Sales Revenue',
            'Purchases Qty',
            'Closing Stock (Total)',
            'Closing Pallets',
            'Closing Packs',
            'Closing Units',
            'Variance',
            'Status'
        ];

        const rows = filteredData.map(item => [
            item.productNo,
            item.productName,
            item.location || 'N/A',
            item.openingStock.total,
            item.openingStock.pallets,
            item.openingStock.packs,
            item.openingStock.units,
            item.movements.salesQuantity,
            item.movements.salesRevenue.toFixed(2),
            item.movements.purchasesQuantity,
            item.closingStock.total,
            item.closingStock.pallets,
            item.closingStock.packs,
            item.closingStock.units,
            item.variance.total,
            item.stockStatus
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `opening-stock-${selectedDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error loading opening stock data</p>
            </div>
        );
    }

    const summary = data?.data?.summary;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Daily Opening Stock</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Track daily opening stock levels and movements
                    </p>
                </div>
                <button
                    onClick={handleExportCSV}
                    disabled={!filteredData.length}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Date Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Product Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product
                        </label>
                        <select
                            value={filterProduct}
                            onChange={(e) => setFilterProduct(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">All Products</option>
                            {products.map((product: any) => (
                                <option key={product.id} value={product.id}>
                                    {product.productNo} - {product.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Location Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                        </label>
                        <input
                            type="text"
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            placeholder="Filter by location"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Low Stock Toggle */}
                    <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showLowStockOnly}
                                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Show Low Stock Only
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Opening Stock</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {summary.totalOpeningStock.toLocaleString()}
                                </p>
                            </div>
                            <Package className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Closing Stock</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {summary.totalClosingStock.toLocaleString()}
                                </p>
                            </div>
                            <Package className="h-8 w-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Sales Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    ₦{summary.totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {summary.totalSalesQuantity} units sold
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Low Stock Items</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {summary.lowStockItems}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Requires attention
                                </p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Opening Stock
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sales
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Purchases
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Closing Stock
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Variance
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        No data available for the selected date and filters
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.productId} className="hover:bg-gray-50">
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {item.productName}
                                                </p>
                                                <p className="text-xs text-gray-500">{item.productNo}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {item.location || '-'}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="text-sm font-medium text-gray-900">
                                                {item.openingStock.total.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                P:{item.openingStock.pallets} | K:{item.openingStock.packs} | U:{item.openingStock.units}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="text-sm text-gray-900">
                                                {item.movements.salesQuantity}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ₦{item.movements.salesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm text-gray-900">
                                            {item.movements.purchasesQuantity}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="text-sm font-medium text-gray-900">
                                                {item.closingStock.total.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                P:{item.closingStock.pallets} | K:{item.closingStock.packs} | U:{item.closingStock.units}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className={`flex items-center justify-end gap-1 text-sm font-medium ${item.variance.total > 0 ? 'text-green-600' :
                                                    item.variance.total < 0 ? 'text-red-600' :
                                                        'text-gray-600'
                                                }`}>
                                                {item.variance.total > 0 && <TrendingUp className="h-4 w-4" />}
                                                {item.variance.total < 0 && <TrendingDown className="h-4 w-4" />}
                                                {item.variance.total > 0 ? '+' : ''}{item.variance.total}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {item.stockStatus === 'LOW_STOCK' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Normal
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DailyOpeningStock;