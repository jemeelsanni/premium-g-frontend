/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader, DollarSign, User, Package, Calendar, Percent, Phone } from 'lucide-react';

import { warehouseService } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { globalToast } from '../../components/ui/Toast';

interface RouteParams {
    id: string;
}

export const SaleDetails: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<RouteParams>();

    const {
        data: sale,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['warehouse-sale', id],
        queryFn: async () => {
            if (!id) {
                throw new Error('Sale ID is required');
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

    const discountApplied = Boolean((sale as any)?.discountApplied);
    const discountPercent = Number((sale as any)?.discountPercentage ?? 0);
    const discountAmount = Number((sale as any)?.totalDiscountAmount ?? 0);
    const originalUnitPrice = Number((sale as any)?.originalUnitPrice ?? sale.unitPrice ?? 0);

    const unitPrice = Number(sale.unitPrice ?? 0);
    const quantity = Number(sale.quantity ?? 0);
    const totalAmount = Number(sale.totalAmount ?? quantity * unitPrice);

    const productName = sale.product?.name || 'Unknown Product';
    const salesOfficerName = (sale as any)?.salesOfficerUser?.username || sale.salesOfficer || '—';
    const paymentMethod = (sale as any)?.paymentMethod || '—';

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
                            <span>{(sale as any)?.customerPhone || '—'}</span>
                        </p>
                        <p>Payment method: {paymentMethod}</p>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center space-x-3 text-gray-600">
                        <Package className="h-5 w-5" />
                        <span className="font-semibold text-gray-900">Product</span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                        <p className="text-lg font-semibold">{productName}</p>
                        <p>Quantity: {quantity.toLocaleString()} {sale.unitType?.toLowerCase?.() || 'units'}</p>
                        <p>Unit price: ₦{originalUnitPrice.toLocaleString()}</p>
                        <p>Total amount: ₦{totalAmount.toLocaleString()}</p>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center space-x-3 text-gray-600">
                        <DollarSign className="h-5 w-5" />
                        <span className="font-semibold text-gray-900">Summary</span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <p>Sales officer: {salesOfficerName}</p>
                        <div className="flex items-start space-x-2">
                            <Calendar className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                                <p>{new Date(sale.createdAt).toLocaleDateString()}</p>
                                <p className="text-gray-500">{new Date(sale.createdAt).toLocaleTimeString()}</p>
                            </div>
                        </div>
                        {discountApplied ? (
                            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                                <div className="flex items-center space-x-2">
                                    <Percent className="h-4 w-4" />
                                    <span>Discount approved: {discountPercent.toLocaleString()}%</span>
                                </div>
                                {discountAmount > 0 && (
                                    <p className="mt-2">
                                        Discount value: ₦{discountAmount.toLocaleString()}
                                    </p>
                                )}
                                {(sale as any)?.discountReason && (
                                    <p className="mt-1 text-gray-600">
                                        Reason: {(sale as any).discountReason}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                                No discount applied to this sale.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-700">
                <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                        <span className="font-medium text-gray-600">Receipt Number:</span>
                        <p>{(sale as any)?.receiptNumber || '—'}</p>
                    </div>
                    <div>
                        <span className="font-medium text-gray-600">Payment Status:</span>
                        <p>{discountApplied ? 'Awaiting approved discount payment reconciliation' : 'Paid'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaleDetails;
