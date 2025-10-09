/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    Loader,
    DollarSign,
    User,
    Calendar,
    Percent,
    Phone,
    Receipt,
    ShoppingCart
} from 'lucide-react';

import { warehouseService } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { globalToast } from '../../components/ui/Toast';
import { WarehouseSale, WarehouseSaleItem } from '../../types/warehouse';

interface RouteParams {
    id: string;
}

const formatCurrency = (value: number) => `₦${Number(value || 0).toLocaleString()}`;

const formatQuantityLabel = (item: WarehouseSaleItem) => {
    const quantity = Number(item?.quantity ?? 0);
    const unit = item?.unitType ? item.unitType.toLowerCase() : 'units';
    return `${quantity.toLocaleString()} ${unit}`;
};

export const SaleDetails: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<RouteParams>();

    const {
        data: sale,
        isLoading,
        isError,
        error
    } = useQuery<WarehouseSale>({
        queryKey: ['warehouse-sale', id],
        queryFn: async () => {
            if (!id) {
                throw new Error('Sale receipt number is required');
            }
            return warehouseService.getSale(id);
        }
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center text-gray-500">
                <Loader className="h-6 w-6 animate-spin mr-2" />
                Loading sale details...
            </div>
        );
    }

    if (isError || !sale) {
        globalToast.error((error as any)?.response?.data?.message || 'Failed to load sale details');
        return (
            <div className="flex h-64 flex-col items-center justify-center space-y-3 text-gray-600">
                <p>Unable to load sale details.</p>
                <Button variant="outline" onClick={() => navigate('/warehouse/sales')}>
                    Go back to sales
                </Button>
            </div>
        );
    }

    const items: WarehouseSaleItem[] = Array.isArray(sale.items) ? sale.items : [];
    const netAmount = Number(sale.totalAmount ?? 0);
    const totalDiscountAmount = Number(sale.totalDiscountAmount ?? 0);
    const grossAmount = netAmount + totalDiscountAmount;
    const discountApplied = Boolean(sale.discountApplied) && totalDiscountAmount > 0;
    const itemsCount = sale.itemsCount ?? items.length;
    const totalQuantity = sale.totalQuantity ?? items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
    const createdAt = sale.createdAt ? new Date(sale.createdAt) : null;
    const discountPercentage = grossAmount > 0 && totalDiscountAmount > 0
        ? ((totalDiscountAmount / grossAmount) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <h2 className="text-2xl font-bold text-gray-900">Sale Details</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center space-x-3 text-gray-600">
                        <User className="h-5 w-5" />
                        <span className="font-semibold text-gray-900">Customer</span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                        <p className="text-lg font-semibold">{sale.customerName || 'Walk-in Customer'}</p>
                        <p className="flex items-center space-x-2 text-gray-500">
                            <Phone className="h-4 w-4" />
                            <span>{sale.customerPhone || '—'}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                            Record number:
                            <span className="ml-1 font-mono text-sm text-gray-900">{sale.receiptNumber}</span>
                        </p>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center space-x-3 text-gray-600">
                        <Receipt className="h-5 w-5" />
                        <span className="font-semibold text-gray-900">Sale Summary</span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                            <span>Payment method</span>
                            <span className="font-medium text-gray-900">
                                {sale.paymentMethod?.replace(/_/g, ' ') || '—'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Sales officer</span>
                            <span className="font-medium text-gray-900">
                                {sale.salesOfficerUser?.username || '—'}
                            </span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Calendar className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                                <p>{createdAt ? createdAt.toLocaleDateString() : '—'}</p>
                                <p className="text-gray-500">{createdAt ? createdAt.toLocaleTimeString() : '—'}</p>
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <span>Total items</span>
                            <span className="font-medium text-gray-900">{itemsCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total quantity</span>
                            <span className="font-medium text-gray-900">{totalQuantity.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center space-x-3 text-gray-600">
                        <DollarSign className="h-5 w-5" />
                        <span className="font-semibold text-gray-900">Financials</span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                            <span>Gross amount</span>
                            <span className="font-medium text-gray-900">{formatCurrency(grossAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="inline-flex items-center space-x-2">
                                <Percent className="h-4 w-4 text-green-600" />
                                <span>Discount</span>
                            </span>
                            <span className={discountApplied ? 'font-medium text-green-700' : 'text-gray-500'}>
                                {discountApplied
                                    ? `${formatCurrency(totalDiscountAmount)}${discountPercentage ? ` (${discountPercentage.toFixed(1)}%)` : ''}`
                                    : 'No discount'}
                            </span>
                        </div>
                        <div className="flex justify-between text-base font-semibold text-gray-900">
                            <span>Net amount</span>
                            <span>{formatCurrency(netAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Sale Items</h3>
                    </div>
                    <span className="text-xs text-gray-500">{itemsCount} item{itemsCount === 1 ? '' : 's'}</span>
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Product</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Quantity</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Unit Price</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Total</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Discount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                                        No items recorded for this sale.
                                    </td>
                                </tr>
                            )}
                            {items.map((item) => {
                                const lineTotal = Number(item.totalAmount ?? 0);
                                const lineDiscount = Number(item.totalDiscountAmount ?? 0);
                                return (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {item.product?.name || 'Unknown Product'}
                                            {item.product?.productNo && (
                                                <div className="text-xs text-gray-500">SKU: {item.product.productNo}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{formatQuantityLabel(item)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(Number(item.unitPrice ?? 0))}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(lineTotal)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {item.discountApplied && lineDiscount > 0 ? formatCurrency(lineDiscount) : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-700">
                <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                        <span className="font-medium text-gray-600">Receipt Number:</span>
                        <p className="font-mono text-sm text-gray-900">{sale.receiptNumber}</p>
                    </div>
                    <div>
                        <span className="font-medium text-gray-600">Payment Status:</span>
                        <p>{discountApplied ? 'Awaiting approved discount payment reconciliation' : 'Paid'}</p>
                    </div>
                    {discountApplied && (
                        <div className="sm:col-span-2">
                            <span className="font-medium text-gray-600">Discounted Products:</span>
                            <p className="mt-1 text-gray-700">
                                {discountedProductNames.length > 0
                                    ? discountedProductNames.join(', ')
                                    : '—'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SaleDetails;
