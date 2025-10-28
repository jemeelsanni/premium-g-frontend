/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { warehouseService, Debtor, DebtorAnalytics, RecordPaymentData } from '../../services/warehouseService';

const DebtorsDashboard: React.FC = () => {
    const [debtors, setDebtors] = useState<Debtor[]>([]);
    const [analytics, setAnalytics] = useState<DebtorAnalytics | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'OUTSTANDING' | 'PARTIAL' | 'OVERDUE' | 'PAID'>('all');
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 5,
        total: 0,
        pages: 0
    });

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD' | 'MOBILE_MONEY'>('CASH');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        fetchDebtors();
    }, [selectedStatus, pagination.page]);

    const fetchDebtors = async () => {
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
    };

    const openPaymentModal = (debtor: Debtor) => {
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
        setPaymentMethod('CASH');
        setPaymentDate(new Date().toISOString().split('T')[0]);
    };

    const handleRecordPayment = async () => {
        if (!selectedDebtor) return;

        const amount = parseFloat(paymentAmount);

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }

        if (amount > selectedDebtor.amountDue) {
            alert(`Payment amount cannot exceed outstanding debt of ₦${selectedDebtor.amountDue.toLocaleString()}`);
            return;
        }

        try {
            setProcessingPayment(true);

            const paymentData: RecordPaymentData = {
                amount,
                paymentMethod,
                paymentDate: new Date(paymentDate).toISOString(),
                referenceNumber: paymentReference || undefined,
                notes: paymentNotes || undefined
            };

            await warehouseService.recordDebtorPayment(selectedDebtor.id, paymentData);

            alert('Payment recorded successfully!');
            closePaymentModal();
            fetchDebtors(); // Refresh the list
        } catch (error: any) {
            console.error('Failed to record payment:', error);
            alert(error.response?.data?.message || 'Failed to record payment. Please try again.');
        } finally {
            setProcessingPayment(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
            case 'OVERDUE': return 'bg-red-100 text-red-800';
            case 'OUTSTANDING': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const calculateTotalStats = () => {
        if (!analytics) return { total: 0, outstanding: 0, paid: 0 };

        let total = 0;
        let outstanding = 0;
        let paid = 0;

        Object.values(analytics).forEach(stat => {
            total += stat.totalAmount || 0;
            outstanding += stat.amountDue || 0;
            paid += stat.amountPaid || 0;
        });

        return { total, outstanding, paid };
    };

    const stats = calculateTotalStats();

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Debtors Management</h1>

            {/* Summary Analytics */}
            {analytics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Debt</h3>
                        <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Outstanding</h3>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.outstanding)}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Paid</h3>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Records</h3>
                        <p className="text-2xl font-bold">{pagination.total}</p>
                    </div>
                </div>
            )}

            {/* Status Breakdown */}
            {analytics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                        {debtors.map((debtor) => (
                            <div key={debtor.id} className="bg-white rounded-lg shadow p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold">{debtor.customer.name}</h3>
                                        <p className="text-sm text-gray-600">📞 {debtor.customer.phone}</p>
                                        {debtor.customer.email && (
                                            <p className="text-sm text-gray-600">✉️ {debtor.customer.email}</p>
                                        )}
                                        <p className="text-sm text-gray-500 mt-1">
                                            Receipt: {debtor.sale.receiptNumber}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Sale Date: {formatDate(debtor.sale.createdAt)}
                                        </p>
                                        {debtor.dueDate && (
                                            <p className="text-sm text-gray-500">
                                                Due Date: {formatDate(debtor.dueDate)}
                                            </p>
                                        )}

                                        {/* Payment History */}
                                        {debtor.payments && debtor.payments.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-sm font-semibold text-gray-600">Payment History:</p>
                                                <div className="mt-1 space-y-1">
                                                    {debtor.payments.slice(0, 3).map(payment => (
                                                        <p key={payment.id} className="text-xs text-gray-500">
                                                            {formatDate(payment.paymentDate)} - {formatCurrency(payment.amount)} ({payment.paymentMethod})
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-right ml-6">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(debtor.status)}`}>
                                            {debtor.status}
                                        </span>

                                        <div className="mt-4 space-y-2">
                                            <div>
                                                <p className="text-sm text-gray-500">Total Amount</p>
                                                <p className="text-lg font-bold">
                                                    {formatCurrency(debtor.totalAmount)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-500">Paid</p>
                                                <p className="text-md text-green-600">
                                                    {formatCurrency(debtor.amountPaid)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-500">Outstanding</p>
                                                <p className="text-md font-semibold text-red-600">
                                                    {formatCurrency(debtor.amountDue)}
                                                </p>
                                            </div>

                                            {debtor.amountDue > 0 && (
                                                <button
                                                    onClick={() => openPaymentModal(debtor)}
                                                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 w-full"
                                                >
                                                    Record Payment
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="mt-6 px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-lg shadow">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                {/* Pagination Info */}
                                <div className="text-sm text-gray-700">
                                    Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
                                    <span className="font-semibold">{pagination.pages}</span>
                                    {' '}({pagination.total} total records)
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex items-center gap-2">
                                    {/* First Page Button */}
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                                        title="First page"
                                    >
                                        ««
                                    </button>

                                    {/* Previous Button */}
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                                    >
                                        Previous
                                    </button>

                                    {/* Page Numbers */}
                                    <div className="hidden sm:flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                            // Smart page number display logic
                                            let pageNum;
                                            if (pagination.pages <= 5) {
                                                pageNum = i + 1;
                                            } else if (pagination.page <= 3) {
                                                pageNum = i + 1;
                                            } else if (pagination.page >= pagination.pages - 2) {
                                                pageNum = pagination.pages - 4 + i;
                                            } else {
                                                pageNum = pagination.page - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${pagination.page === pageNum
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Mobile: Current Page Display */}
                                    <div className="sm:hidden px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">
                                        {pagination.page} / {pagination.pages}
                                    </div>

                                    {/* Next Button */}
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page === pagination.pages}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                                    >
                                        Next
                                    </button>

                                    {/* Last Page Button */}
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: pagination.pages }))}
                                        disabled={pagination.page === pagination.pages}
                                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                                        title="Last page"
                                    >
                                        »»
                                    </button>
                                </div>

                                {/* Items Per Page Selector (Optional Enhancement) */}
                                <div className="hidden lg:flex items-center gap-2">
                                    <span className="text-sm text-gray-700">Items per page:</span>
                                    <select
                                        value={pagination.limit}
                                        onChange={(e) => setPagination(prev => ({
                                            ...prev,
                                            limit: parseInt(e.target.value),
                                            page: 1 // Reset to first page when changing limit
                                        }))}
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedDebtor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">Record Payment</h3>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600">Customer: <span className="font-semibold">{selectedDebtor.customer.name}</span></p>
                            <p className="text-sm text-gray-600">Outstanding: <span className="font-semibold text-red-600">{formatCurrency(selectedDebtor.amountDue)}</span></p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Payment Amount (₦)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    max={selectedDebtor.amountDue}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="Enter amount"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    className="w-full px-4 py-2 border rounded-lg"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CARD">Card</option>
                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Payment Date</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Reference Number (Optional)</label>
                                <input
                                    type="text"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="Transaction reference"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                                <textarea
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    rows={3}
                                    placeholder="Add any notes..."
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <button
                                onClick={handleRecordPayment}
                                disabled={processingPayment}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {processingPayment ? 'Processing...' : 'Record Payment'}
                            </button>
                            <button
                                onClick={closePaymentModal}
                                disabled={processingPayment}
                                className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
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