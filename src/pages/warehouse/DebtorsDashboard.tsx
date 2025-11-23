/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';

// 🆕 Updated interface to match new backend structure
interface AggregatedDebtor {
    customerId: string;
    customer: {
        id: string;
        name: string;
        phone: string;
        email: string | null;
        customerType: string;
        paymentReliabilityScore: number;
    };
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
    debtCount: number;
    sales: Array<{
        id: string;
        saleId: string;
        receiptNumber: string;
        product: {
            name: string;
            productNo: string;
        };
        totalAmount: number;
        amountPaid: number;
        amountDue: number;
        status: string;
        dueDate: string | null;
        createdAt: string;
    }>;
    earliestDueDate: string | null;
    latestCreatedAt: string;
    status: 'OUTSTANDING' | 'PARTIAL' | 'OVERDUE' | 'PAID';
    allPayments: Array<{
        id: string;
        amount: number;
        paymentMethod: string;
        paymentDate: string;
        referenceNumber?: string;
        notes?: string;
    }>;
}

interface DebtorAnalytics {
    [key: string]: {
        count: number;
        totalAmount: number;
        amountPaid: number;
        amountDue: number;
    };
}

const DebtorsDashboard: React.FC = () => {
    const [debtors, setDebtors] = useState<AggregatedDebtor[]>([]);
    const [analytics, setAnalytics] = useState<DebtorAnalytics | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'OUTSTANDING' | 'PARTIAL' | 'OVERDUE' | 'PAID'>('all');
    const [loading, setLoading] = useState(true);
    const [expandedDebtors, setExpandedDebtors] = useState<Set<string>>(new Set());
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState<AggregatedDebtor | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD' | 'MOBILE_MONEY'>('CASH');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);

    const fetchDebtors = useCallback(async () => {
        try {
            setLoading(true);

            const response = await warehouseService.getDebtors({
                page: pagination.page,
                limit: pagination.limit,
                status: selectedStatus
            });

            setDebtors(response.data.debtors);
            setPagination(response.data.pagination);
            setAnalytics(response.data.analytics);
        } catch (error) {
            console.error('Failed to fetch debtors:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, selectedStatus]);

    useEffect(() => {
        fetchDebtors();
    }, [selectedStatus, pagination.page, fetchDebtors]);

    const toggleExpanded = (customerId: string) => {
        setExpandedDebtors(prev => {
            const newSet = new Set(prev);
            if (newSet.has(customerId)) {
                newSet.delete(customerId);
            } else {
                newSet.add(customerId);
            }
            return newSet;
        });
    };

    const openPaymentModal = (debtor: AggregatedDebtor) => {
        setSelectedDebtor(debtor);
        setPaymentAmount(debtor.amountDue.toString());
        setShowPaymentModal(true);
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedDebtor(null);
        setPaymentAmount('');
        setPaymentReference('');
        setPaymentNotes('');
    };

    const handleRecordPayment = async () => {
        if (!selectedDebtor) return;

        // Validate payment amount
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }

        if (amount > selectedDebtor.amountDue) {
            alert(`Payment amount cannot exceed outstanding balance of ${formatCurrency(selectedDebtor.amountDue)}`);
            return;
        }

        try {
            setProcessingPayment(true);

            const paymentData = {
                amount: amount,
                paymentMethod,
                paymentDate,
                referenceNumber: paymentReference || undefined,
                notes: paymentNotes || undefined
            };

            // 🆕 NEW METHOD - Payment for entire customer debt
            const response = await warehouseService.recordCustomerDebtPayment(
                selectedDebtor.customerId,
                paymentData
            );

            console.log('Payment response:', response.data);

            alert(
                `✅ Payment recorded successfully!\n\n` +
                `Amount: ${formatCurrency(amount)}\n` +
                `Debts Updated: ${response.data.data.debtsUpdated}\n` +
                `Sales Updated: ${response.data.data.salesUpdated}`
            );

            closePaymentModal();
            fetchDebtors();
        } catch (error: any) {
            console.error('Failed to record payment:', error);
            alert(error?.response?.data?.message || 'Failed to record payment');
        } finally {
            setProcessingPayment(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            OUTSTANDING: 'bg-yellow-100 text-yellow-800',
            PARTIAL: 'bg-blue-100 text-blue-800',
            OVERDUE: 'bg-red-100 text-red-800',
            PAID: 'bg-green-100 text-green-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Warehouse Debtors</h1>

            {/* Analytics Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Object.entries(analytics).map(([status, data]) => (
                        <div key={status} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                            <h3 className="text-sm font-semibold text-gray-600 mb-2">
                                {status.replace('_', ' ')}
                            </h3>
                            <p className="text-xl font-bold">{data.count}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Due: {formatCurrency(data.amountDue)}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filter */}
            <div className="mb-4">
                <label className="text-sm font-medium mr-2">Filter by Status:</label>
                <select
                    value={selectedStatus}
                    onChange={(e) => {
                        setSelectedStatus(e.target.value as any);
                        setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="px-4 py-2 border rounded-lg"
                >
                    <option value="all">All Status</option>
                    <option value="OUTSTANDING">Outstanding</option>
                    <option value="PARTIAL">Partially Paid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="PAID">Paid</option>
                </select>
            </div>

            {/* Debtors List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading debtors...</p>
                </div>
            ) : debtors.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500">No debtors found</p>
                </div>
            ) : (
                <>
                    <div className="grid gap-4">
                        {debtors.map((debtor) => {
                            const isExpanded = expandedDebtors.has(debtor.customerId);

                            return (
                                <div key={debtor.customerId} className="bg-white rounded-lg shadow">
                                    {/* Customer Header */}
                                    <div className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-semibold">{debtor.customer.name}</h3>
                                                    {getStatusBadge(debtor.status)}
                                                    <button
                                                        onClick={() => toggleExpanded(debtor.customerId)}
                                                        className="text-gray-500 hover:text-gray-700"
                                                    >
                                                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-600">📞 {debtor.customer.phone}</p>
                                                {debtor.customer.email && (
                                                    <p className="text-sm text-gray-600">✉️ {debtor.customer.email}</p>
                                                )}
                                                <p className="text-sm text-gray-500 mt-2">
                                                    {debtor.debtCount} {debtor.debtCount === 1 ? 'debt' : 'debts'}
                                                </p>
                                                {debtor.customer.paymentReliabilityScore && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Reliability Score: {debtor.customer.paymentReliabilityScore.toFixed(1)}%
                                                    </p>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Total Amount</p>
                                                <p className="text-xl font-bold">{formatCurrency(debtor.totalAmount)}</p>

                                                <p className="text-sm text-green-600 mt-2">Paid: {formatCurrency(debtor.amountPaid)}</p>
                                                <p className="text-sm text-red-600 font-semibold">Due: {formatCurrency(debtor.amountDue)}</p>

                                                {/* 🆕 Single Payment Button for All Debts */}
                                                {debtor.amountDue > 0 && (
                                                    <button
                                                        onClick={() => openPaymentModal(debtor)}
                                                        className="mt-3 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                                                    >
                                                        <CreditCard className="h-4 w-4" />
                                                        Record Payment
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Sales Details */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-200 p-6 bg-gray-50">
                                            <h4 className="font-semibold mb-4">Individual Sales</h4>
                                            <div className="space-y-3">
                                                {debtor.sales.map((sale) => (
                                                    <div key={sale.id} className="bg-white p-4 rounded border">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-mono text-sm font-medium">{sale.receiptNumber}</p>
                                                                <p className="text-sm text-gray-600">{sale.product.name}</p>
                                                                <p className="text-xs text-gray-500">Sale Date: {formatDate(sale.createdAt)}</p>
                                                                {sale.dueDate && (
                                                                    <p className="text-xs text-gray-500">Due: {formatDate(sale.dueDate)}</p>
                                                                )}
                                                                <span className="text-xs mt-1 inline-block">{getStatusBadge(sale.status)}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold">{formatCurrency(sale.totalAmount)}</p>
                                                                <p className="text-xs text-green-600">Paid: {formatCurrency(sale.amountPaid)}</p>
                                                                <p className="text-xs text-red-600">Due: {formatCurrency(sale.amountDue)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Payment History */}
                                            {debtor.allPayments.length > 0 && (
                                                <div className="mt-6">
                                                    <h4 className="font-semibold mb-3">Payment History ({debtor.allPayments.length} payments)</h4>
                                                    <div className="space-y-2">
                                                        {debtor.allPayments.slice(0, 5).map((payment) => (
                                                            <div key={payment.id} className="flex justify-between text-sm bg-white p-3 rounded border">
                                                                <div>
                                                                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                                                                    <span className="text-gray-500 ml-2">via {payment.paymentMethod}</span>
                                                                    {payment.referenceNumber && (
                                                                        <span className="text-xs text-gray-400 ml-2">Ref: {payment.referenceNumber}</span>
                                                                    )}
                                                                </div>
                                                                <span className="text-gray-500">{formatDate(payment.paymentDate)}</span>
                                                            </div>
                                                        ))}
                                                        {debtor.allPayments.length > 5 && (
                                                            <p className="text-sm text-gray-500 text-center">
                                                                +{debtor.allPayments.length - 5} more payments
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-6">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span>Page {pagination.page} of {pagination.pages}</span>
                        <button
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedDebtor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Record Payment</h2>

                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-700">Customer</p>
                                <p className="text-lg font-semibold">{selectedDebtor.customer.name}</p>
                                <div className="mt-2 text-sm">
                                    <p className="text-gray-600">Total Outstanding: <span className="font-semibold text-red-600">{formatCurrency(selectedDebtor.amountDue)}</span></p>
                                    <p className="text-gray-600">Number of Debts: <span className="font-semibold">{selectedDebtor.debtCount}</span></p>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 Payment will be automatically allocated across all outstanding debts (oldest first)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Payment Amount *</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                                    step="0.01"
                                    min="0"
                                    max={selectedDebtor.amountDue}
                                    placeholder="Enter amount"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Max: {formatCurrency(selectedDebtor.amountDue)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Payment Method *</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CARD">Card</option>
                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Payment Date *</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Reference Number</label>
                                <input
                                    type="text"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Optional payment notes"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleRecordPayment}
                                disabled={processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processingPayment ? 'Processing...' : 'Record Payment'}
                            </button>
                            <button
                                onClick={closePaymentModal}
                                disabled={processingPayment}
                                className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtorsDashboard;