/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, DollarSign, Clock, CheckCircle, XCircle, History } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { distributionService } from '../../services/distributionService';
import supplierCompanyService from '../../services/supplierCompanyService';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface SupplierProduct {
  id: string;
  supplierCompanyId: string;
  productId: string;
  supplierCostPerPack: number;
  isAvailable: boolean;
  minimumOrderPacks?: number;
  leadTimeDays?: number;
  notes?: string;
  supplierCompany: {
    id: string;
    name: string;
    code: string;
  };
  product: {
    id: string;
    productNo: string;
    name: string;
    packsPerPallet?: number;
    pricePerPack?: number;
  };
}

interface FormData {
  supplierCompanyId: string;
  productId: string;
  supplierCostPerPack: string;
  isAvailable: boolean;
  minimumOrderPacks: string;
  leadTimeDays: string;
  notes: string;
  priceChangeReason: string;
}

const SupplierProducts: React.FC = () => {
  const location = useLocation();
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierProduct | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<SupplierProduct | null>(null);
  const [newProductData, setNewProductData] = useState({
    name: '',
    description: '',
    packsPerPallet: '',
  });

  const [formData, setFormData] = useState<FormData>({
    supplierCompanyId: '',
    productId: '',
    supplierCostPerPack: '',
    isAvailable: true,
    minimumOrderPacks: '',
    leadTimeDays: '',
    notes: '',
    priceChangeReason: '',
  });

  // Check if supplier was pre-selected from navigation
  useEffect(() => {
    const state = location.state as { selectedSupplierId?: string };
    if (state?.selectedSupplierId) {
      setSelectedSupplier(state.selectedSupplierId);
    }
  }, [location]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSupplier) {
      loadSupplierProducts(selectedSupplier);
    } else {
      loadAllSupplierProducts();
    }
  }, [selectedSupplier]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [suppliersData, productsData] = await Promise.all([
        supplierCompanyService.getAllSupplierCompanies(),
        distributionService.getProducts(),
      ]);
      setSuppliers(suppliersData);
      // Extract products from response
      const extractedProducts = productsData.data?.products || productsData.data || productsData;
      setProducts(extractedProducts);
      await loadAllSupplierProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAllSupplierProducts = async () => {
    try {
      const response = await distributionService.getSupplierProducts();
      // Backend returns { success: true, data: supplierProducts }
      // Axios wraps it, so response.data.data contains the array
      const products = response.data?.data || [];
      console.log('All supplier products response:', response.data);
      console.log('Extracted products:', products);
      setSupplierProducts(products);
    } catch (error: any) {
      console.error('Error loading supplier products:', error);
      toast.error('Failed to load supplier products');
    }
  };

  const loadSupplierProducts = async (supplierId: string) => {
    try {
      const response = await distributionService.getSupplierProductsBySupplier(supplierId);
      // Backend returns { success: true, data: { supplier, products } }
      // Axios wraps it, so response.data.data.products contains the array
      const products = response.data?.data?.products || [];
      console.log('Supplier products response:', response.data);
      console.log('Extracted products:', products);
      setSupplierProducts(products);
    } catch (error: any) {
      console.error('Error loading supplier products:', error);
      toast.error('Failed to load supplier products');
    }
  };

  const handleOpenModal = (item?: SupplierProduct) => {
    console.log('handleOpenModal called with item:', item);
    if (item) {
      setEditingItem(item);
      setFormData({
        supplierCompanyId: item.supplierCompanyId,
        productId: item.productId,
        supplierCostPerPack: item.supplierCostPerPack.toString(),
        isAvailable: item.isAvailable,
        minimumOrderPacks: item.minimumOrderPacks?.toString() || '',
        leadTimeDays: item.leadTimeDays?.toString() || '',
        notes: item.notes || '',
        priceChangeReason: '',
      });
    } else {
      setEditingItem(null);
      setNewProductData({
        name: '',
        description: '',
        packsPerPallet: '',
      });
      setFormData({
        supplierCompanyId: selectedSupplier || '',
        productId: '',
        supplierCostPerPack: '',
        isAvailable: true,
        minimumOrderPacks: '',
        leadTimeDays: '',
        notes: '',
        priceChangeReason: '',
      });
    }
    console.log('Setting showModal to true');
    setShowModal(true);
    console.log('Modal state should be:', true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let productId = formData.productId;

      // Create a new product if not editing (always create new product when adding)
      if (!editingItem) {
        // Find the selected supplier to get the supplier code
        const selectedSupplierData = suppliers.find(s => s.id === formData.supplierCompanyId);
        const supplierCode = selectedSupplierData?.code || 'SUP';

        // Get the count of existing products for this supplier to generate sequential number
        const existingSupplierProducts = supplierProducts.filter(
          sp => sp.supplierCompanyId === formData.supplierCompanyId
        );
        const nextNumber = (existingSupplierProducts.length + 1).toString().padStart(3, '0');

        // Generate product number: SUPPLIER_CODE-PRD-001
        const productNo = `${supplierCode}-PRD-${nextNumber}`;

        const productData = {
          productNo: productNo,
          name: newProductData.name,
          description: newProductData.description || undefined,
          module: 'DISTRIBUTION',
          packsPerPallet: parseInt(newProductData.packsPerPallet),
        };

        const createdProduct = await distributionService.createProduct(productData);
        productId = createdProduct.data?.id || createdProduct.id;
        toast.success('Product created successfully');

        // Reload products list
        const productsData = await distributionService.getProducts();
        const extractedProducts = productsData.data?.products || productsData.data || productsData;
        setProducts(extractedProducts);
      }

      if (editingItem) {
        // For updates, include price change reason
        const updateData = {
          supplierCostPerPack: parseFloat(formData.supplierCostPerPack),
          isAvailable: formData.isAvailable,
          minimumOrderPacks: formData.minimumOrderPacks ? parseInt(formData.minimumOrderPacks) : undefined,
          leadTimeDays: formData.leadTimeDays ? parseInt(formData.leadTimeDays) : undefined,
          notes: formData.notes || undefined,
          priceChangeReason: formData.priceChangeReason || undefined,
        };
        await distributionService.updateSupplierProduct(editingItem.id, updateData);
        toast.success('Supplier product updated successfully');
      } else {
        // For creation, use original structure
        const submitData = {
          supplierCompanyId: formData.supplierCompanyId,
          productId: productId,
          supplierCostPerPack: parseFloat(formData.supplierCostPerPack),
          isAvailable: formData.isAvailable,
          minimumOrderPacks: formData.minimumOrderPacks ? parseInt(formData.minimumOrderPacks) : undefined,
          leadTimeDays: formData.leadTimeDays ? parseInt(formData.leadTimeDays) : undefined,
          notes: formData.notes || undefined,
        };
        await distributionService.createSupplierProduct(submitData);
        toast.success('Supplier product added successfully');
      }

      handleCloseModal();
      if (selectedSupplier) {
        loadSupplierProducts(selectedSupplier);
      } else {
        loadAllSupplierProducts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save supplier product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this product from the supplier catalog?')) {
      return;
    }

    try {
      await distributionService.deleteSupplierProduct(id);
      toast.success('Supplier product removed successfully');
      if (selectedSupplier) {
        loadSupplierProducts(selectedSupplier);
      } else {
        loadAllSupplierProducts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete supplier product');
    }
  };

  const toggleAvailability = async (item: SupplierProduct) => {
    try {
      await distributionService.updateSupplierProduct(item.id, {
        isAvailable: !item.isAvailable,
      });
      toast.success(`Product ${item.isAvailable ? 'disabled' : 'enabled'} successfully`);
      if (selectedSupplier) {
        loadSupplierProducts(selectedSupplier);
      } else {
        loadAllSupplierProducts();
      }
    } catch (error: any) {
      toast.error('Failed to update availability');
    }
  };

  const handleViewPriceHistory = async (item: SupplierProduct) => {
    setSelectedProductForHistory(item);
    setShowPriceHistoryModal(true);
    setLoadingHistory(true);
    try {
      const response = await distributionService.getSupplierProductPriceHistory(item.id);
      const history = response.data?.data || response.data || [];
      setPriceHistory(history);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load price history');
      setPriceHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClosePriceHistoryModal = () => {
    setShowPriceHistoryModal(false);
    setSelectedProductForHistory(null);
    setPriceHistory([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  console.log('Rendering SupplierProducts - showModal:', showModal);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Supplier Products</h1>
        <p className="text-gray-600 mt-1">Manage products available from each supplier</p>
      </div>

      {/* Filter and Actions */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Supplier
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={() => handleOpenModal()} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier Product
          </Button>
        </div>
      </div>

      {/* Supplier Products Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {supplierProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedSupplier
                ? 'No products found for this supplier'
                : 'No supplier products configured yet'}
            </p>
            <Button onClick={() => handleOpenModal()} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add First Product
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost/Pack
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supplierProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.supplierCompany.name}
                        </div>
                        <div className="text-sm text-gray-500">{item.supplierCompany.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-sm text-gray-500">{item.product.productNo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="font-semibold">
                          ₦{item.supplierCostPerPack.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.minimumOrderPacks ? `${item.minimumOrderPacks} packs` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.leadTimeDays ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {item.leadTimeDays} days
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.isAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Available
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Unavailable
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewPriceHistory(item)}
                          className="text-purple-600 hover:text-purple-900"
                          title="View price history"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleCloseModal}></div>

            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingItem ? 'Edit Supplier Product' : 'Add Supplier Product'}
                  </h3>

                  <div className="space-y-4">
                    {/* Supplier Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        disabled={!!editingItem}
                        value={formData.supplierCompanyId}
                        onChange={(e) =>
                          setFormData({ ...formData, supplierCompanyId: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name} ({supplier.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Product Name (Create New Product Only) */}
                    {!editingItem ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={newProductData.name}
                            onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter product name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Packs Per Pallet <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={newProductData.packsPerPallet}
                            onChange={(e) => setNewProductData({ ...newProductData, packsPerPallet: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter packs per pallet"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Description
                          </label>
                          <textarea
                            value={newProductData.description}
                            onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                            placeholder="Optional product description"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          disabled
                          value={formData.productId}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                        >
                          <option value="">Select Product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.productNo})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Supplier Cost Per Pack */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier Cost Per Pack (₦) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={formData.supplierCostPerPack}
                        onChange={(e) =>
                          setFormData({ ...formData, supplierCostPerPack: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter cost per pack"
                      />
                    </div>

                    {/* Price Change Reason - only shown when editing */}
                    {editingItem && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price Change Reason
                        </label>
                        <input
                          type="text"
                          value={formData.priceChangeReason}
                          onChange={(e) =>
                            setFormData({ ...formData, priceChangeReason: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Optional: Why is the price changing?"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          If you change the supplier cost, explain why (e.g., "Supplier increased prices", "Negotiated discount")
                        </p>
                      </div>
                    )}

                    {/* Minimum Order Packs */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Order (Packs)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.minimumOrderPacks}
                        onChange={(e) =>
                          setFormData({ ...formData, minimumOrderPacks: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Optional minimum order quantity"
                      />
                    </div>

                    {/* Lead Time Days */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lead Time (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.leadTimeDays}
                        onChange={(e) =>
                          setFormData({ ...formData, leadTimeDays: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Optional delivery lead time"
                      />
                    </div>

                    {/* Availability */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isAvailable"
                        checked={formData.isAvailable}
                        onChange={(e) =>
                          setFormData({ ...formData, isAvailable: e.target.checked })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-700">
                        Product is currently available from this supplier
                      </label>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Optional notes about this product from this supplier"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button type="submit" className="w-full sm:w-auto sm:ml-3">
                    {editingItem ? 'Update' : 'Add'} Product
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                    className="mt-3 w-full sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {showPriceHistoryModal && selectedProductForHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClosePriceHistoryModal}></div>

            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-50">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Price Change History
                  </h3>
                  <button
                    onClick={handleClosePriceHistoryModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedProductForHistory.product.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedProductForHistory.supplierCompany.name} ({selectedProductForHistory.supplierCompany.code})
                  </p>
                  <p className="text-sm font-semibold text-blue-600 mt-1">
                    Current Price: ₦{Number(selectedProductForHistory.supplierCostPerPack).toLocaleString()}
                  </p>
                </div>

                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : priceHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No price changes recorded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Old Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            New Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Change
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Changed By
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {priceHistory.map((record: any) => {
                          const oldPrice = Number(record.oldPrice);
                          const newPrice = Number(record.newPrice);
                          const change = newPrice - oldPrice;
                          const percentChange = ((change / oldPrice) * 100).toFixed(2);
                          const isIncrease = change > 0;

                          return (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {new Date(record.createdAt).toLocaleDateString()}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {new Date(record.createdAt).toLocaleTimeString()}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                ₦{oldPrice.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                                ₦{newPrice.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                    isIncrease
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {isIncrease ? '↑' : '↓'} ₦{Math.abs(change).toLocaleString()}
                                  <span className="ml-1">({percentChange}%)</span>
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {record.changedByUser?.username || 'Unknown'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {record.reason || <span className="text-gray-400 italic">No reason provided</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClosePriceHistoryModal}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierProducts;
