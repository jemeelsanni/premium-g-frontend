// src/pages/warehouse/ExpiringProducts.tsx

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package, TrendingDown, DollarSign } from 'lucide-react';
import { warehouseService, ExpiringProductsResponse } from '../../services/warehouseService';

export default function ExpiringProducts() {
    const { data, isLoading } = useQuery<ExpiringProductsResponse>({
        queryKey: ['expiring-products'],
        queryFn: warehouseService.getExpiringProducts
    });

    if (isLoading) {
        return <div className="p-6">Loading expiring products...</div>;
    }

    const { expiringPurchases = [], summary } = data || {};

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'critical': return 'bg-red-100 border-red-300 text-red-900';
            case 'high': return 'bg-orange-100 border-orange-300 text-orange-900';
            case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-900';
            default: return 'bg-gray-100 border-gray-300 text-gray-900';
        }
    };

    const getUrgencyIcon = (urgency: string) => {
        const colors = {
            critical: 'text-red-600',
            high: 'text-orange-600',
            medium: 'text-yellow-600'
        };
        return <AlertTriangle className={`w-5 h-5 ${colors[urgency as keyof typeof colors]}`} />;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Expiring Products</h1>
                <p className="text-gray-600">
                    Products expiring within 30 days (showing only active batches with remaining stock)
                </p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Batches</p>
                                <p className="text-2xl font-bold">{summary.totalBatchesExpiring}</p>
                            </div>
                            <Package className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600">Critical (≤7 days)</p>
                                <p className="text-2xl font-bold text-red-700">{summary.criticalBatches}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Value at Risk</p>
                                <p className="text-2xl font-bold text-red-600">
                                    ₦{summary.totalValueAtRisk.toLocaleString()}
                                </p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-red-500" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Potential Revenue</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ₦{summary.totalPotentialRevenue.toLocaleString()}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Expiring Batches List */}
            <div className="space-y-4">
                {expiringPurchases.length === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                        <Package className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-green-900">All Clear!</h3>
                        <p className="text-green-700">
                            No products with active inventory are expiring within the next 30 days.
                        </p>
                    </div>
                ) : (
                    expiringPurchases.map((batch) => (
                        <div
                            key={batch.id}
                            className={`p-4 rounded-lg border-2 ${getUrgencyColor(batch.urgency)}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                    {getUrgencyIcon(batch.urgency)}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold text-lg">{batch.productName}</h3>
                                            <span className="text-sm text-gray-600">({batch.productNo})</span>
                                        </div>

                                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-600">Batch:</span>
                                                <span className="ml-1 font-medium">{batch.batchNumber || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Expires in:</span>
                                                <span className="ml-1 font-bold">{batch.daysUntilExpiry} days</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Remaining:</span>
                                                <span className="ml-1 font-medium">
                                                    {batch.quantityRemaining} / {batch.originalQuantity} {batch.unitType}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Sold:</span>
                                                <span className="ml-1 font-medium">{batch.percentageSold}%</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center space-x-4 text-sm">
                                            <div className="bg-white bg-opacity-50 px-3 py-1 rounded">
                                                <span className="text-gray-700">Value at Risk:</span>
                                                <span className="ml-1 font-bold text-red-700">
                                                    ₦{batch.valueAtRisk.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="bg-white bg-opacity-50 px-3 py-1 rounded">
                                                <span className="text-gray-700">Potential Revenue:</span>
                                                <span className="ml-1 font-bold text-green-700">
                                                    ₦{batch.potentialRevenue.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress bar showing how much has been sold */}
                                        <div className="mt-3">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${batch.percentageSold}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-xs text-gray-600">Expiry Date</div>
                                    <div className="font-medium">
                                        {new Date(batch.expiryDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

