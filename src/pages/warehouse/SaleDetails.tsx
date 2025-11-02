/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/SaleDetails.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    User,
    Phone,
    Receipt,
    Calendar,
    Package,
    TrendingDown,
    Download,
} from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import PrintableReceipt from './PrintableReceipt';
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
    const [printMode, setPrintMode] = useState(false);

    // Handle Export PDF
    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            const blob = await warehouseService.exportSaleToPDF(receiptNumber!);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `warehouse-sale-${receiptNumber}-${new Date()
                .toISOString()
                .split('T')[0]}.pdf`;
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

    // Handle Inline Thermal Print
    const handlePrintThermalReceipt = () => {
        if (!saleData?.data) return;
        setPrintMode(true);
        setTimeout(() => {
            window.print();
            setTimeout(() => setPrintMode(false), 1000);
        }, 300);
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

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatQuantityLabel = (item: any) => {
        const qty = Number(item.quantity || 0);
        const unit = item.unitType ? item.unitType.toLowerCase() : 'units';
        return `${qty.toLocaleString()} ${unit}`;
    };


    const createdAt = sale.createdAt ? new Date(sale.createdAt) : null;

    // 🧾 Print Mode View (Thermal Receipt Inline)
    if (printMode && sale) {
        return (
            <div className="p-2 bg-white">
                <PrintableReceipt sale={sale} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between space-x-3">
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => navigate('/warehouse/sales')}>
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
                    <Button onClick={handlePrintThermalReceipt}>
                        Print Thermal Receipt
                    </Button>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sale Details</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Receipt #{receiptNumber}
                    </p>
                </div>
            </div>

            {/* Customer & Sale Info */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Customer Information */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center space-x-3 text-gray-600 mb-4">
                        <User className="h-5 w-5" />
                        <span className="font-semibold text-gray-900">Customer</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-lg font-semibold text-gray-900">
                            {sale.customerName ||
                                sale.warehouseCustomer?.name ||
                                'Walk-in Customer'}
                        </p>
                        {(sale.customerPhone || sale.warehouseCustomer?.phone) && (
                            <p className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>
                                    {sale.customerPhone || sale.warehouseCustomer?.phone}
                                </span>
                            </p>
                        )}
                        {sale.warehouseCustomer?.email && (
                            <p className="text-sm text-gray-600">
                                {sale.warehouseCustomer.email}
                            </p>
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

                {/* Transaction Date */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center space-x-3 text-gray-600 mb-4">
                        <Calendar className="h-5 w-5" />
                        <span className="font-semibold text-gray-900">
                            Transaction Date
                        </span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-lg font-semibold text-gray-900">
                            {createdAt
                                ? createdAt.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })
                                : '—'}
                        </p>
                        <p className="text-sm text-gray-600">
                            {createdAt
                                ? createdAt.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                                : '—'}
                        </p>
                    </div>
                </div>
            </div>

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
                                const originalUnitPrice = Number(
                                    item.originalUnitPrice || item.unitPrice || 0
                                );
                                const finalUnitPrice = Number(item.unitPrice || 0);

                                return (
                                    <tr
                                        key={item.id}
                                        className={itemHasDiscount ? 'bg-green-50' : ''}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {item.product?.name || 'Unknown Product'}
                                            </div>
                                            {item.product?.productNo && (
                                                <div className="text-xs text-gray-500">
                                                    SKU: {item.product.productNo}
                                                </div>
                                            )}
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
                                                        {item.discountPercentage
                                                            ? `${Number(
                                                                item.discountPercentage
                                                            ).toFixed(1)}%`
                                                            : 'Applied'}
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
                                        <td
                                            colSpan={4}
                                            className="px-6 py-3 text-right text-sm font-medium text-gray-600"
                                        >
                                            Subtotal (before discount):
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm text-gray-900">
                                            {formatCurrency(grossAmount)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-3 text-right text-sm font-medium text-green-700"
                                        >
                                            Total Discount:
                                        </td>
                                        <td className="px-6 py-3 text-right text-sm font-semibold text-green-700">
                                            -{formatCurrency(totalDiscount)}
                                        </td>
                                    </tr>
                                </>
                            )}
                            <tr className="bg-gray-100">
                                <td
                                    colSpan={4}
                                    className="px-6 py-4 text-right text-lg font-bold text-gray-900"
                                >
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

            {/* Debtor Info */}
            {(sale.paymentStatus === 'CREDIT' || sale.paymentStatus === 'PARTIAL') &&
                sale.debtor && (
                    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-6">
                        <h3 className="font-semibold text-gray-800 mb-3">
                            Outstanding Payment
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Total Amount:</span>
                                <span className="font-medium">
                                    {formatCurrency(sale.totalAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Amount Paid:</span>
                                <span className="font-medium text-green-600">
                                    {formatCurrency(sale.debtor.amountPaid)}
                                </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span>Outstanding Balance:</span>
                                <span className="font-semibold text-red-600">
                                    {formatCurrency(sale.debtor.amountDue)}
                                </span>
                            </div>
                            {sale.creditDueDate && (
                                <div className="flex justify-between">
                                    <span>Due Date:</span>
                                    <span
                                        className={`${new Date(sale.creditDueDate) < new Date() &&
                                            sale.debtor.amountDue > 0
                                            ? 'text-red-600 font-semibold'
                                            : 'text-gray-800'
                                            }`}
                                    >
                                        {new Date(sale.creditDueDate).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
        </div>
    );
};

export default SaleDetails;


