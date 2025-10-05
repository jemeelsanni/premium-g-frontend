/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/ProductManagement.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';
import { formatCurrency } from '../../utils/formatters';

interface ProductFormData {
    productNo: string;
    name: string;
    description: string;
    packsPerPallet: number;
    pricePerPack: number;
    costPerPack: number;
    module: 'DISTRIBUTION' | 'WAREHOUSE' | 'BOTH';
}

export const ProductManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [formData, setFormData] = useState<ProductFormData>({
        productNo: '',
        name: '',
        description: '',
        packsPerPallet: 0,
        pricePerPack: 0,
        costPerPack: 0,
        module: 'DISTRIBUTION',
    });

    const queryClient = useQueryClient();
    const pageSize = 10;

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['admin-products', currentPage, searchTerm],
        queryFn: () =>
            adminService.getProducts({
                page: currentPage,
                limit: pageSize,
                search: searchTerm || undefined,
            }),
    });

    // Calculate pagination values
    const totalPages = productsData?.pagination?.totalPages || 1;
    const total = productsData?.pagination?.total || 0;
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;

    const createMutation = useMutation({
        mutationFn: (data: ProductFormData) => adminService.createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            globalToast.success('Product created successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to create product');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
            adminService.updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            globalToast.success('Product updated successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to update product');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminService.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            globalToast.success('Product deleted successfully!');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to delete product');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setFormData({
            productNo: product.productNo,
            name: product.name,
            description: product.description || '',
            packsPerPallet: product.packsPerPallet,
            pricePerPack: product.pricePerPack,
            costPerPack: product.costPerPack || 0,
            module: product.module || 'DISTRIBUTION',
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({
            productNo: '',
            name: '',
            description: '',
            packsPerPallet: 0,
            pricePerPack: 0,
            costPerPack: 0,
            module: 'DISTRIBUTION',
        });
    };

    const productColumns = [
        {
            key: 'productNo',
            title: 'Product #',
            render: (value: string) => (
                <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-900">{value}</span>
                </div>
            ),
        },
        {
            key: 'name',
            title: 'Name',
            render: (value: string) => (
                <span className="text-gray-900">{value}</span>
            ),
        },
        {
            key: 'packsPerPallet',
            title: 'Packs/Pallet',
            render: (value: number) => (
                <span className="text-gray-600">{value}</span>
            ),
        },
        {
            key: 'pricePerPack',
            title: 'Price/Pack',
            render: (value: number) => (
                <span className="text-gray-900 font-medium">{formatCurrency(value)}</span>
            ),
        },
        {
            key: 'module',
            title: 'Module',
            render: (value: string) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${value === 'DISTRIBUTION' ? 'bg-blue-100 text-blue-800' :
                        value === 'WAREHOUSE' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                    }`}>
                    {value}
                </span>
            ),
        },
        {
            key: 'isActive',
            title: 'Status',
            render: (value: boolean) => (
                <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${value
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                >
                    {value ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleEdit(record)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(record.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
                    <p className="text-gray-600">Manage products across all modules</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <Table
                    data={productsData?.data || []}
                    columns={productColumns}
                />

                {/* Custom Pagination */}
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 sm:px-6">
                    <div className="flex items-center justify-between">
                        {/* Mobile Pagination */}
                        <div className="flex-1 flex justify-between sm:hidden">
                            <Button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={!hasPrev}
                                variant="outline"
                                size="sm"
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={!hasNext}
                                variant="outline"
                                size="sm"
                            >
                                Next
                            </Button>
                        </div>

                        {/* Desktop Pagination */}
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                    <span className="font-medium">{totalPages}</span>
                                    {' '}({total || 0} total records)
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={!hasPrev}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                        {currentPage}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={!hasNext}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Number *
                        </label>
                        <Input
                            type="text"
                            value={formData.productNo}
                            onChange={(e) =>
                                setFormData({ ...formData, productNo: e.target.value })
                            }
                            placeholder="e.g., P001"
                            required
                            disabled={!!editingProduct}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name *
                        </label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="e.g., Bigi Cola 50cl"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Product description"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Packs Per Pallet *
                        </label>
                        <Input
                            type="number"
                            value={formData.packsPerPallet}
                            onChange={(e) =>
                                setFormData({ ...formData, packsPerPallet: parseInt(e.target.value) || 0 })
                            }
                            placeholder="e.g., 50"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price Per Pack (₦) *
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.pricePerPack}
                            onChange={(e) =>
                                setFormData({ ...formData, pricePerPack: parseFloat(e.target.value) || 0 })
                            }
                            placeholder="e.g., 250.00"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cost Per Pack (₦)
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.costPerPack}
                            onChange={(e) =>
                                setFormData({ ...formData, costPerPack: parseFloat(e.target.value) || 0 })
                            }
                            placeholder="e.g., 180.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Module *
                        </label>
                        <select
                            value={formData.module}
                            onChange={(e) =>
                                setFormData({ ...formData, module: e.target.value as any })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="DISTRIBUTION">Distribution Only</option>
                            <option value="WAREHOUSE">Warehouse Only</option>
                            <option value="BOTH">Both Modules</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Determines which modules can use this product
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingProduct ? 'Update' : 'Create'} Product
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};