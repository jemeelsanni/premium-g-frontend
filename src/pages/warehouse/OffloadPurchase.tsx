/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Package,
    AlertTriangle,
    Plus,
    Calendar,
    DollarSign,
    User,
    Phone,
    Mail,
    FileText,
    Hash,
    Clock
} from 'lucide-react';
import {
    warehouseService,
    CreatePurchaseData,
    ExpiringPurchase,
    WarehousePurchase
} from '../../services/warehouseService';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { globalToast } from '../../components/ui/Toast';
import { Table } from '../../components/ui/Table';

const OffloadPurchase: React.FC = () => {
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showExpiringModal, setShowExpiringModal] = useState(false);

    const [formData, setFormData] = useState<Partial<CreatePurchaseData>>({
        vendorName: '',
        vendorPhone: '',
        vendorEmail: '',
        orderNumber: '',
        batchNumber: '',
        expiryDate: '',
        quantity: 1,
        unitType: 'PACKS',
        costPerUnit: 0,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        amountPaid: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        notes: ''
    });

    const [currentPage] = useState(1);
    const pageLimit = 20;

    // Fetch products
    const { data: products = [] } = useQuery({
        queryKey: ['warehouse-products'],
        queryFn: () => warehouseService.getProducts()
    });

    // Fetch purchases
    const { data: purchasesData, isLoading } = useQuery({
        queryKey: ['warehouse-purchases', currentPage, pageLimit],
        queryFn: () => warehouseService.getPurchases({ page: currentPage, limit: pageLimit })
    });

    // Fetch expiring products
    const { data: expiringData } = useQuery({
        queryKey: ['warehouse-expiring-purchases'],
        queryFn: () => warehouseService.getExpiringPurchases(),
        refetchInterval: 60000 // Refetch every minute
    });

    // Create purchase mutation
    const createPurchaseMutation = useMutation({
        mutationFn: (data: CreatePurchaseData) => warehouseService.createPurchase(data),
        onSuccess: (response: {
            success: boolean;
            message: string;
            warning?: { message: string; daysRemaining: number; expiryDate: string };
            data: WarehousePurchase;
        }) => {
            globalToast.success(response.message);

            if (response.warning) {
                globalToast.error(response.warning.message);
            }

            queryClient.invalidateQueries({ queryKey: ['warehouse-purchases'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-expiring-purchases'] });
            setShowCreateModal(false);
            resetForm();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to create purchase');
        }
    });

    const resetForm = () => {
        setFormData({
            vendorName: '',
            vendorPhone: '',
            vendorEmail: '',
            orderNumber: '',
            batchNumber: '',
            expiryDate: '',
            quantity: 1,
            unitType: 'PACKS',
            costPerUnit: 0,
            paymentMethod: 'CASH',
            paymentStatus: 'PAID',
            amountPaid: 0,
            purchaseDate: new Date().toISOString().split('T')[0],
            invoiceNumber: '',
            notes: ''
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['quantity', 'costPerUnit', 'amountPaid'].includes(name) ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.productId) {
            globalToast.error('Please select a product');
            return;
        }
        if (!formData.vendorName) {
            globalToast.error('Please enter vendor name');
            return;
        }

        createPurchaseMutation.mutate(formData as CreatePurchaseData);
    };

    const totalCost = (formData.quantity || 0) * (formData.costPerUnit || 0);
    const amountDue = totalCost - (formData.amountPaid || 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Offload Purchases</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Record product purchases and automatically update inventory
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Record Purchase
                </Button>
            </div>

            {/* Expiry Alerts */}
            {expiringData && expiringData.data.count > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-yellow-900">
                                Expiry Alert: {expiringData.data.count} product batch(es) expiring soon
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                Some products in inventory are within 30 days of expiry
                            </p>
                            <Button
                                variant="secondary"
                                onClick={() => setShowExpiringModal(true)}
                                className="mt-2 text-sm"
                            >
                                View Details
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Purchases Table */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold">Recent Purchases</h2>
                </div>
                <Table
                    data={purchasesData?.data.purchases || []}
                    columns={[
                        {
                            key: 'product',
                            title: 'Product',
                            render: (_value: any, record: any) => {
                                const purchase = record as WarehousePurchase;
                                return (
                                    <div>
                                        <div className="font-medium">
                                            {purchase?.product?.name || 'Unknown Product'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {purchase?.product?.productNo || 'N/A'}
                                        </div>
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'orderNumber',
                            title: 'Order/Batch',
                            render: (_value: any, record: any) => {  // ← MUST have _value first!
                                const purchase = record as WarehousePurchase;
                                return (
                                    <div>
                                        {purchase.orderNumber && (
                                            <div className="text-sm">Order: {purchase.orderNumber}</div>
                                        )}
                                        {purchase.batchNumber && (
                                            <div className="text-sm text-gray-500">Batch: {purchase.batchNumber}</div>
                                        )}
                                        {!purchase.orderNumber && !purchase.batchNumber && (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'quantity',
                            title: 'Quantity',
                            render: (_value: any, record: any) => {  // ← MUST have _value first!
                                const purchase = record as WarehousePurchase;
                                return (
                                    <span>
                                        {purchase.quantity} {purchase.unitType}
                                    </span>
                                );
                            }
                        },
                        {
                            key: 'expiryDate',
                            title: 'Expiry Date',
                            render: (_value: any, record: any) => {  // ← MUST have _value first!
                                const purchase = record as WarehousePurchase;
                                if (!purchase.expiryDate) return <span className="text-gray-400">N/A</span>;

                                const expiry = new Date(purchase.expiryDate);
                                const today = new Date();
                                const daysUntilExpiry = Math.ceil(
                                    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                                );

                                return (
                                    <div>
                                        <div>{expiry.toLocaleDateString()}</div>
                                        {daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
                                            <div className="text-xs text-yellow-600 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                {daysUntilExpiry} days left
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'vendorName',
                            title: 'Vendor'
                        },
                        {
                            key: 'totalCost',
                            title: 'Cost',
                            render: (value: any) => `₦${parseFloat(value).toLocaleString()}`
                        },
                        {
                            key: 'paymentStatus',
                            title: 'Status',
                            render: (value: any) => (
                                <span
                                    className={`px-2 py-1 text-xs rounded-full ${value === 'PAID'
                                        ? 'bg-green-100 text-green-800'
                                        : value === 'PARTIAL'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                >
                                    {value}
                                </span>
                            )
                        },
                        {
                            key: 'purchaseDate',
                            title: 'Date',
                            render: (value: any) => new Date(value).toLocaleDateString()
                        }
                    ]}
                    loading={isLoading}
                />
            </div>

            {/* Create Purchase Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Record Warehouse Purchase"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Product Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product *
                        </label>
                        <select
                            name="productId"
                            value={formData.productId || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Product</option>
                            {products.map((product: any) => (
                                <option key={product.id} value={product.id}>
                                    {product.name} ({product.productNo})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Vendor Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-1" />
                                Vendor Name *
                            </label>
                            <Input
                                name="vendorName"
                                value={formData.vendorName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Phone className="w-4 h-4 inline mr-1" />
                                Vendor Phone
                            </label>
                            <Input
                                name="vendorPhone"
                                value={formData.vendorPhone}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Mail className="w-4 h-4 inline mr-1" />
                                Vendor Email
                            </label>
                            <Input
                                name="vendorEmail"
                                type="email"
                                value={formData.vendorEmail}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* Order/Batch Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Order Number
                            </label>
                            <Input
                                name="orderNumber"
                                value={formData.orderNumber}
                                onChange={handleInputChange}
                                placeholder="e.g., ORD-2024-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4 inline mr-1" />
                                Batch Number
                            </label>
                            <Input
                                name="batchNumber"
                                value={formData.batchNumber}
                                onChange={handleInputChange}
                                placeholder="e.g., BATCH-A123"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Expiry Date
                            </label>
                            <Input
                                name="expiryDate"
                                type="date"
                                value={formData.expiryDate}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* Quantity and Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4 inline mr-1" />
                                Quantity *
                            </label>
                            <Input
                                name="quantity"
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unit Type *
                            </label>
                            <select
                                name="unitType"
                                value={formData.unitType}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="PALLETS">Pallets</option>
                                <option value="PACKS">Packs</option>
                                <option value="UNITS">Units</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Cost Per Unit *
                            </label>
                            <Input
                                name="costPerUnit"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.costPerUnit}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Cost Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Total Cost:</span>
                            <span className="font-medium">₦{totalCost.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Method *
                            </label>
                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="CASH">Cash</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="CHECK">Check</option>
                                <option value="CARD">Card</option>
                                <option value="MOBILE_MONEY">Mobile Money</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Status *
                            </label>
                            <select
                                name="paymentStatus"
                                value={formData.paymentStatus}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="PAID">Paid</option>
                                <option value="PARTIAL">Partial</option>
                                <option value="PENDING">Pending</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Amount Paid
                            </label>
                            <Input
                                name="amountPaid"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.amountPaid}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {amountDue > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm text-yellow-800">
                                    Amount Due: ₦{amountDue.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Purchase Date *
                            </label>
                            <Input
                                name="purchaseDate"
                                type="date"
                                value={formData.purchaseDate}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4 inline mr-1" />
                                Invoice Number
                            </label>
                            <Input
                                name="invoiceNumber"
                                value={formData.invoiceNumber}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional notes about this purchase..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowCreateModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={createPurchaseMutation.isPending}
                        >
                            Record Purchase
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Expiring Products Modal */}
            <Modal
                isOpen={showExpiringModal}
                onClose={() => setShowExpiringModal(false)}
                title="Products Expiring Soon"
            >
                <div className="space-y-4">
                    {expiringData?.data.expiringPurchases.map((purchase: ExpiringPurchase) => (
                        <div
                            key={purchase.id}
                            className={`p-4 rounded-lg border-2 ${purchase.urgency === 'critical'
                                ? 'bg-red-50 border-red-300'
                                : purchase.urgency === 'high'
                                    ? 'bg-orange-50 border-orange-300'
                                    : 'bg-yellow-50 border-yellow-300'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <AlertTriangle
                                            className={`w-5 h-5 ${purchase.urgency === 'critical'
                                                ? 'text-red-600'
                                                : purchase.urgency === 'high'
                                                    ? 'text-orange-600'
                                                    : 'text-yellow-600'
                                                }`}
                                        />
                                        <h3 className="font-medium text-gray-900">
                                            {purchase?.product?.name ?? 'Unknown Product'}
                                        </h3>
                                    </div>
                                    <div className="mt-2 text-sm space-y-1">
                                        <div className="text-gray-700">
                                            Product No: {purchase.product.productNo}
                                        </div>
                                        {purchase.batchNumber && (
                                            <div className="text-gray-700">
                                                Batch: {purchase.batchNumber}
                                            </div>
                                        )}
                                        <div className="text-gray-700">
                                            Quantity: {purchase.quantity} {purchase.unitType}
                                        </div>
                                        <div className="text-gray-700">
                                            Expiry Date: {new Date(purchase.expiryDate!).toLocaleDateString()}
                                        </div>
                                        <div
                                            className={`font-medium ${purchase.urgency === 'critical'
                                                ? 'text-red-700'
                                                : purchase.urgency === 'high'
                                                    ? 'text-orange-700'
                                                    : 'text-yellow-700'
                                                }`}
                                        >
                                            {purchase.daysUntilExpiry} days remaining
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
};

export default OffloadPurchase;