/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/SaleDetails.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, Phone, Receipt, Calendar, Package, Tag, TrendingDown, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { toast } from 'react-hot-toast';


export const SaleDetails: React.FC = () => {
    const navigate = useNavigate();
    const { id: receiptNumber } = useParams<{ id: string }>();

    const { data: saleData, isLoading } = useQuery({
        queryKey: ['warehouse-sale', receiptNumber],
        queryFn: () => warehouseService.getSaleByReceipt(receiptNumber!),
        enabled: !!receiptNumber,
    });

    const [isExportingPDF, setIsExportingPDF] = useState(false);

    // Add this handler function
    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            const blob = await warehouseService.exportSaleToPDF(receiptNumber!);

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `warehouse-sale-${receiptNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Sale exported to PDF successfully');
        } catch (error) {
            toast.error('Failed to export sale to PDF');
            console.error('Export error:', error);
        } finally {
            setIsExportingPDF(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading sale details...</p>
                </div>
            </div>
        );
    }

    if (!saleData?.data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Sale not found</p>
                <Button onClick={() => navigate('/warehouse/sales')} className="mt-4">
                    Back to Sales
                </Button>
            </div>
        );
    }

    const sale = saleData.data;
    const items = sale.items || [];
    const totalAmount = Number(sale.totalAmount || 0);
    const totalDiscount = Number(sale.totalDiscountAmount || 0);
    const grossAmount = totalAmount + totalDiscount;
    const hasDiscount = sale.discountApplied && totalDiscount > 0;
    const discountPercentage = grossAmount > 0 && totalDiscount > 0
        ? ((totalDiscount / grossAmount) * 100)
        : 0;

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatQuantityLabel = (item: any) => {
        const qty = Number(item.quantity || 0);
        const unit = item.unitType ? item.unitType.toLowerCase() : 'units';
        return `${qty.toLocaleString()} ${unit}`;
    };

    const getDiscountedItems = () => {
        return items.filter((item: any) => item.discountApplied && Number(item.totalDiscountAmount || 0) > 0);
    };

    const discountedItems = getDiscountedItems();
    const createdAt = sale.createdAt ? new Date(sale.createdAt) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between space-x-3">
                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/warehouse/sales')}
                    >
                        Back to Sales List
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportPDF}
                        disabled={isExportingPDF}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {isExportingPDF ? 'Exporting...' : 'Export PDF'}
                    </Button>
                    <Button
                        onClick={() => window.print()}
                    >
                        Print Receipt
                    </Button>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sale Details</h2>
                    <p className="text-sm text-gray-500 mt-1">Receipt #{receiptNumber}</p>
                </div>
            </div>

            {/* Customer & Sale Info Cards */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Customer Information */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center space-x-3 text-gray-600 mb-4">
                        <User className="h-5 w-5" />
                        <span className="font-semibold text-gray-900">Customer</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-lg font-semibold text-gray-900">
                            {sale.customerName || sale.warehouseCustomer?.name || 'Walk-in Customer'}
                        </p>
                        {(sale.customerPhone || sale.warehouseCustomer?.phone) && (
                            <p className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>{sale.customerPhone || sale.warehouseCustomer?.phone}</span>
                            </p>
                        )}
                        {sale.warehouseCustomer?.email && (
                            <p className="text-sm text-gray-600">{sale.warehouseCustomer.email}</p>
                        )}
                    </div>
                </div>

                {/* Sale Summary */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center space-x-3 text-gray-600 mb-4">
                        <Receipt className="h-5 w-5" />
                        <span className="font-semibold text-gray-900">Sale Summary</span>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Payment Method</span>
                            <span className="font-medium text-gray-900">
                                {sale.paymentMethod?.replace(/_/g, ' ') || '—'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Sales Officer</span>
                            <span className="font-medium text-gray-900">
                                {sale.salesOfficerUser?.username || '—'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Items Count</span>
                            <span className="font-medium text-gray-900">
                                {sale.itemsCount || items.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Date & Time */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center space-x-3 text-gray-600 mb-4">
                        <Calendar className="h-5 w-5" />
                        <span className="font-semibold text-gray-900">Transaction Date</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-lg font-semibold text-gray-900">
                            {createdAt ? createdAt.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }) : '—'}
                        </p>
                        <p className="text-sm text-gray-600">
                            {createdAt ? createdAt.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Discount Alert Banner */}
            {hasDiscount && (
                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
                    <div className="flex items-start space-x-3">
                        <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-green-900 mb-2">
                                💰 Discount Applied
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-green-700 font-medium">Total Saved</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {formatCurrency(totalDiscount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-green-700 font-medium">Discount Rate</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {discountPercentage.toFixed(1)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-green-700 font-medium">Items Discounted</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {discountedItems.length} of {items.length}
                                    </p>
                                </div>
                            </div>
                            {discountedItems.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-green-200">
                                    <p className="text-xs font-medium text-green-800 mb-2">Discounted Products:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {discountedItems.map((item: any) => (
                                            <span
                                                key={item.id}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                            >
                                                <Tag className="h-3 w-3 mr-1" />
                                                {item.product?.name || 'Unknown'}
                                                {item.discountPercentage && ` (-${Number(item.discountPercentage).toFixed(1)}%)`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Package className="h-5 w-5 mr-2" />
                        Products
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Unit Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Discount
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subtotal
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {items.map((item: any) => {
                                const itemTotal = Number(item.totalAmount || 0);
                                const itemDiscount = Number(item.totalDiscountAmount || 0);
                                const itemHasDiscount = item.discountApplied && itemDiscount > 0;
                                const originalUnitPrice = Number(item.originalUnitPrice || item.unitPrice || 0);
                                const finalUnitPrice = Number(item.unitPrice || 0);

                                return (
                                    <tr key={item.id} className={itemHasDiscount ? 'bg-green-50' : ''}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.product?.name || 'Unknown Product'}
                                                    </div>
                                                    {item.product?.productNo && (
                                                        <div className="text-xs text-gray-500">
                                                            SKU: {item.product.productNo}
                                                        </div>
                                                    )}
                                                    {itemHasDiscount && (
                                                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            <Tag className="h-3 w-3 mr-1" />
                                                            Discounted
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {formatQuantityLabel(item)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {itemHasDiscount ? (
                                                <div>
                                                    <div className="text-sm text-gray-500 line-through">
                                                        {formatCurrency(originalUnitPrice)}
                                                    </div>
                                                    <div className="text-sm font-semibold text-green-600 flex items-center">
                                                        {formatCurrency(finalUnitPrice)}
                                                        <TrendingDown className="h-3 w-3 ml-1" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-900">
                                                    {formatCurrency(finalUnitPrice)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {itemHasDiscount ? (
                                                <div>
                                                    <div className="text-sm font-semibold text-green-700">
                                                        {item.discountPercentage ? `${Number(item.discountPercentage).toFixed(1)}%` : 'Applied'}
                                                    </div>
                                                    <div className="text-xs text-green-600">
                                                        -{formatCurrency(itemDiscount)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {formatCurrency(itemTotal)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            {hasDiscount && (
                                <>
                                    <tr>
                                        <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-600">
                                            Subtotal (before discount):
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-gray-900">
                                            {formatCurrency(grossAmount)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-green-700">
                                            Total Discount:
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm font-semibold text-green-700">
                                            -{formatCurrency(totalDiscount)}
                                        </td>
                                    </tr>
                                </>
                            )}
                            <tr className="bg-gray-100">
                                <td colSpan={4} className="px-6 py-4 text-right text-lg font-bold text-gray-900">
                                    Total Amount Paid:
                                </td>
                                <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">
                                    {formatCurrency(totalAmount)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Additional Information */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <span className="text-sm font-medium text-gray-600">Receipt Number:</span>
                        <p className="mt-1 font-mono text-sm font-semibold text-gray-900">{sale.receiptNumber}</p>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-600">Payment Status:</span>
                        <div className="mt-1 flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-green-700">Paid</span>
                        </div>
                    </div>
                    {sale.totalCost && (
                        <>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Cost of Goods:</span>
                                <p className="mt-1 text-sm text-gray-900">
                                    {formatCurrency(Number(sale.totalCost))}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Gross Profit:</span>
                                <p className="mt-1 text-sm font-semibold text-green-700">
                                    {formatCurrency(Number(sale.grossProfit || 0))}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Discount Details */}
                {hasDiscount && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
                            Discount Details
                        </h4>
                        <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
                            <p className="mb-2">
                                <strong>Total Savings:</strong> {formatCurrency(totalDiscount)} ({discountPercentage.toFixed(2)}% off)
                            </p>
                            <p className="mb-2">
                                <strong>Original Amount:</strong> {formatCurrency(grossAmount)}
                            </p>
                            <p>
                                <strong>Final Amount:</strong> {formatCurrency(totalAmount)}
                            </p>
                            {sale.discountReason && (
                                <p className="mt-3 pt-3 border-t border-blue-200 italic">
                                    Reason: {sale.discountReason}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={() => navigate('/warehouse/sales')}
                >
                    Back to Sales List
                </Button>
                <Button
                    onClick={() => window.print()}
                >
                    Print Receipt
                </Button>
            </div>
        </div>
    );
};

export default SaleDetails;