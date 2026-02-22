/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, DollarSign, Clock, CheckCircle, XCircle, History, Tag } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { distributionService } from '../../services/distributionService';
import supplierCompanyService from '../../services/supplierCompanyService';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  SupplierCategory,
  SupplierCategorySKU,
  formatSkuLabel,
  formatSkuProductName,
} from '../../types/distribution';

interface SupplierProduct {
  id: string;
  supplierCompanyId: string;
  productId: string;
  supplierCategorySkuId?: string;
  supplierCostPerPack: number;
  isAvailable: boolean;
  minimumOrderPacks?: number;
  leadTimeDays?: number;
  notes?: string;
  supplierCompany: { id: string; name: string; code: string };
  product: { id: string; productNo: string; name: string; packsPerPallet?: number; pricePerPack?: number };
  categorySku?: {
    id: string;
    skuValue: number;
    skuUnit: string;
    supplierCategory: { categoryType: string };
  };
}

interface FormData {
  supplierCompanyId: string;
  supplierCategorySkuId: string;  // selected category+SKU combo
  productBaseName: string;        // user-entered base name e.g. "Coca Cola"
  supplierCostPerPack: string;
  isAvailable: boolean;
  minimumOrderPacks: string;
  leadTimeDays: string;
  notes: string;
  priceChangeReason: string;
  packsPerPallet: string;
}

/** Flat option list built from a supplier's categories */
interface SkuOption {
  skuId: string;
  label: string;       // e.g. "Carbonated Soda Drink (50cl)"
  productName: string; // e.g. "Carbonated Soda Drink 50cl"
  category: SupplierCategory;
  sku: SupplierCategorySKU;
}

const SupplierProducts: React.FC = () => {
  const location = useLocation();
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierProduct | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');

  // Categories/SKUs for the selected supplier in the modal
  const [skuOptions, setSkuOptions] = useState<SkuOption[]>([]);
  const [loadingSkus, setLoadingSkus] = useState(false);

  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<SupplierProduct | null>(null);

  const [formData, setFormData] = useState<FormData>({
    supplierCompanyId: '',
    supplierCategorySkuId: '',
    productBaseName: '',
    supplierCostPerPack: '',
    isAvailable: true,
    minimumOrderPacks: '',
    leadTimeDays: '',
    notes: '',
    priceChangeReason: '',
    packsPerPallet: '',
  });

  // Pre-select supplier from navigation state
  useEffect(() => {
    const state = location.state as { selectedSupplierId?: string };
    if (state?.selectedSupplierId) setSelectedSupplier(state.selectedSupplierId);
  }, [location]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (selectedSupplier) loadSupplierProducts(selectedSupplier);
    else loadAllSupplierProducts();
  }, [selectedSupplier]);

  // When the supplier in the modal changes, load their categories
  useEffect(() => {
    if (formData.supplierCompanyId) loadSkuOptions(formData.supplierCompanyId);
    else setSkuOptions([]);
  }, [formData.supplierCompanyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const suppliersData = await supplierCompanyService.getAllSupplierCompanies();
      setSuppliers(suppliersData);
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
      setSupplierProducts(response.data?.data || []);
    } catch {
      toast.error('Failed to load supplier products');
    }
  };

  const loadSupplierProducts = async (supplierId: string) => {
    try {
      const response = await distributionService.getSupplierProductsBySupplier(supplierId);
      setSupplierProducts(response.data?.data?.products || []);
    } catch {
      toast.error('Failed to load supplier products');
    }
  };

  const loadSkuOptions = async (supplierId: string) => {
    setLoadingSkus(true);
    try {
      const categories = await supplierCompanyService.getSupplierCategories(supplierId);
      const opts: SkuOption[] = [];
      for (const cat of categories) {
        for (const sku of cat.skus) {
          opts.push({
            skuId: sku.id,
            label: formatSkuLabel(cat, sku),
            productName: formatSkuProductName(cat, sku),
            category: cat,
            sku,
          });
        }
      }
      setSkuOptions(opts);
    } catch {
      setSkuOptions([]);
    } finally {
      setLoadingSkus(false);
    }
  };

  const handleOpenModal = (item?: SupplierProduct) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        supplierCompanyId: item.supplierCompanyId,
        supplierCategorySkuId: item.supplierCategorySkuId || '',
        productBaseName: '',
        supplierCostPerPack: item.supplierCostPerPack.toString(),
        isAvailable: item.isAvailable,
        minimumOrderPacks: item.minimumOrderPacks?.toString() || '',
        leadTimeDays: item.leadTimeDays?.toString() || '',
        notes: item.notes || '',
        priceChangeReason: '',
        packsPerPallet: '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        supplierCompanyId: selectedSupplier || '',
        supplierCategorySkuId: '',
        productBaseName: '',
        supplierCostPerPack: '',
        isAvailable: true,
        minimumOrderPacks: '',
        leadTimeDays: '',
        notes: '',
        priceChangeReason: '',
        packsPerPallet: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => { setShowModal(false); setEditingItem(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!editingItem) {
        // ── CREATE ──
        if (!formData.supplierCompanyId) { toast.error('Please select a supplier'); return; }
        if (!formData.productBaseName.trim()) { toast.error('Please enter a product name'); return; }
        if (!formData.supplierCategorySkuId) { toast.error('Please select a product category & SKU'); return; }
        if (!formData.packsPerPallet || parseInt(formData.packsPerPallet) < 1) {
          toast.error('Packs per pallet must be at least 1'); return;
        }
        if (!formData.supplierCostPerPack || parseFloat(formData.supplierCostPerPack) <= 0) {
          toast.error('Supplier cost per pack must be greater than 0'); return;
        }

        // Find supplier + SKU option
        const selectedSupplierData = suppliers.find(s => s.id === formData.supplierCompanyId);
        if (!selectedSupplierData) { toast.error('Supplier not found'); return; }

        const skuOption = skuOptions.find(o => o.skuId === formData.supplierCategorySkuId);
        if (!skuOption) { toast.error('Category/SKU not found'); return; }

        const supplierCode = selectedSupplierData.code;

        // Build the full product name: "[base name] [CATEGORY] [skuValue][unit]"
        const skuUnit = skuOption.sku.skuUnit === 'CL' ? 'cl' : 'L';
        const fullProductName = `${formData.productBaseName.trim()} ${skuOption.category.categoryType} ${skuOption.sku.skuValue}${skuUnit}`;

        // Generate product number
        const allProductsResp = await distributionService.getProducts();
        const allProducts: any[] = allProductsResp.data?.products || allProductsResp.data || [];
        const prefix = `${supplierCode}-PRD-`;
        const existingNumbers = allProducts
          .map((p: any) => p.productNo)
          .filter((no: string) => no?.startsWith(prefix))
          .map((no: string) => { const m = no.match(/-PRD-(\d+)$/); return m ? parseInt(m[1]) : 0; })
          .filter((n: number) => !isNaN(n));
        const nextNum = ((existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0) + 1)
          .toString().padStart(3, '0');
        const productNo = `${supplierCode}-PRD-${nextNum}`;

        // Create the product
        const createdProduct = await distributionService.createProduct({
          productNo,
          name: fullProductName,
          module: 'DISTRIBUTION',
          packsPerPallet: parseInt(formData.packsPerPallet),
        });

        const productId =
          createdProduct.data?.data?.product?.id ||
          createdProduct.data?.product?.id ||
          createdProduct.data?.id;

        if (!productId) { toast.error('Failed to create product'); return; }

        // Link product to supplier with category SKU
        await distributionService.createSupplierProduct({
          supplierCompanyId: formData.supplierCompanyId,
          productId,
          supplierCategorySkuId: formData.supplierCategorySkuId,
          supplierCostPerPack: parseFloat(formData.supplierCostPerPack),
          isAvailable: formData.isAvailable,
          minimumOrderPacks: formData.minimumOrderPacks ? parseInt(formData.minimumOrderPacks) : undefined,
          leadTimeDays: formData.leadTimeDays ? parseInt(formData.leadTimeDays) : undefined,
          notes: formData.notes || undefined,
        });

        toast.success('Supplier product added successfully');
      } else {
        // ── UPDATE ──
        if (!formData.supplierCostPerPack || parseFloat(formData.supplierCostPerPack) <= 0) {
          toast.error('Supplier cost per pack must be greater than 0'); return;
        }
        await distributionService.updateSupplierProduct(editingItem.id, {
          supplierCostPerPack: parseFloat(formData.supplierCostPerPack),
          isAvailable: formData.isAvailable,
          minimumOrderPacks: formData.minimumOrderPacks ? parseInt(formData.minimumOrderPacks) : undefined,
          leadTimeDays: formData.leadTimeDays ? parseInt(formData.leadTimeDays) : undefined,
          notes: formData.notes || undefined,
          priceChangeReason: formData.priceChangeReason || undefined,
        });
        toast.success('Supplier product updated successfully');
      }

      handleCloseModal();
      if (selectedSupplier) loadSupplierProducts(selectedSupplier);
      else loadAllSupplierProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save supplier product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this product from the supplier catalog?')) return;
    try {
      await distributionService.deleteSupplierProduct(id);
      toast.success('Supplier product removed successfully');
      if (selectedSupplier) loadSupplierProducts(selectedSupplier);
      else loadAllSupplierProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete supplier product');
    }
  };

  const toggleAvailability = async (item: SupplierProduct) => {
    try {
      await distributionService.updateSupplierProduct(item.id, { isAvailable: !item.isAvailable });
      toast.success(`Product ${item.isAvailable ? 'disabled' : 'enabled'} successfully`);
      if (selectedSupplier) loadSupplierProducts(selectedSupplier);
      else loadAllSupplierProducts();
    } catch { toast.error('Failed to update availability'); }
  };

  const handleViewPriceHistory = async (item: SupplierProduct) => {
    setSelectedProductForHistory(item);
    setShowPriceHistoryModal(true);
    setLoadingHistory(true);
    try {
      const response = await distributionService.getSupplierProductPriceHistory(item.id);
      setPriceHistory(response.data?.data || response.data || []);
    } catch { toast.error('Failed to load price history'); setPriceHistory([]); }
    finally { setLoadingHistory(false); }
  };

  // Helper: category+SKU label from a product row
  const getCategorySkuBadge = (item: SupplierProduct) => {
    if (!item.categorySku) return null;
    const { skuValue, skuUnit, supplierCategory } = item.categorySku;
    const unit = skuUnit === 'CL' ? 'cl' : 'L';
    return `${supplierCategory.categoryType} · ${skuValue}${unit}`;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Supplier Products</h1>
        <p className="text-gray-600 mt-1">Manage products available from each supplier</p>
      </div>

      {/* Filter + actions */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Supplier</label>
            <select
              value={selectedSupplier}
              onChange={e => setSelectedSupplier(e.target.value)}
              className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Suppliers</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <Button onClick={() => handleOpenModal()} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" /> Add Supplier Product
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {supplierProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedSupplier ? 'No products found for this supplier' : 'No supplier products configured yet'}
            </p>
            <Button onClick={() => handleOpenModal()} className="mt-4">
              <Plus className="h-4 w-4 mr-2" /> Add First Product
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category / SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Pack</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supplierProducts.map(item => {
                  const skuBadge = getCategorySkuBadge(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.supplierCompany.name}</div>
                        <div className="text-sm text-gray-500">{item.supplierCompany.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-sm text-gray-500">{item.product.productNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {skuBadge ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                            <Tag className="w-3 h-3" />
                            {skuBadge}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="font-semibold">₦{item.supplierCostPerPack.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.minimumOrderPacks ? `${item.minimumOrderPacks} packs` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.leadTimeDays ? (
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />{item.leadTimeDays} days
                          </div>
                        ) : <span className="text-sm text-gray-400">N/A</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleAvailability(item)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.isAvailable ? <><CheckCircle className="h-3 w-3 mr-1" />Available</> : <><XCircle className="h-3 w-3 mr-1" />Unavailable</>}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleViewPriceHistory(item)} className="text-purple-600 hover:text-purple-900" title="Price history">
                            <History className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:text-blue-900" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleCloseModal} />

            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingItem ? 'Edit Supplier Product' : 'Add Supplier Product'}
                  </h3>

                  <div className="space-y-4">
                    {/* Supplier */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        disabled={!!editingItem}
                        value={formData.supplierCompanyId}
                        onChange={e => setFormData({ ...formData, supplierCompanyId: e.target.value, supplierCategorySkuId: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Category + SKU dropdown (create mode) */}
                    {!editingItem && (
                      <>
                        {/* Product base name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.productBaseName}
                            onChange={e => setFormData({ ...formData, productBaseName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. Coca Cola, Pepsi, Bigi"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Category and SKU will be appended automatically (e.g. "Coca Cola CSD 50cl")
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Category &amp; SKU <span className="text-red-500">*</span>
                          </label>
                          {!formData.supplierCompanyId ? (
                            <p className="text-xs text-gray-400 italic py-2">Select a supplier first</p>
                          ) : loadingSkus ? (
                            <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                              <LoadingSpinner size="sm" /> Loading categories…
                            </div>
                          ) : skuOptions.length === 0 ? (
                            <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-700">
                              This supplier has no product categories configured. Edit the supplier to add categories &amp; SKUs first.
                            </div>
                          ) : (
                            <select
                              required
                              value={formData.supplierCategorySkuId}
                              onChange={e => setFormData({ ...formData, supplierCategorySkuId: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select category &amp; SKU</option>
                              {skuOptions.map(opt => (
                                <option key={opt.skuId} value={opt.skuId}>{opt.label}</option>
                              ))}
                            </select>
                          )}
                          {formData.supplierCategorySkuId && formData.productBaseName.trim() && (() => {
                            const opt = skuOptions.find(o => o.skuId === formData.supplierCategorySkuId);
                            if (!opt) return null;
                            const unit = opt.sku.skuUnit === 'CL' ? 'cl' : 'L';
                            const preview = `${formData.productBaseName.trim()} ${opt.category.categoryType} ${opt.sku.skuValue}${unit}`;
                            return (
                              <p className="mt-1 text-xs text-blue-600">
                                Product will be named: <strong>{preview}</strong>
                              </p>
                            );
                          })()}
                        </div>

                        {/* Packs per pallet */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Packs Per Pallet <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={formData.packsPerPallet}
                            onChange={e => setFormData({ ...formData, packsPerPallet: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 12"
                          />
                        </div>
                      </>
                    )}

                    {/* Edit mode: show product info read-only */}
                    {editingItem && (
                      <div className="rounded-md bg-gray-50 border border-gray-200 p-3 space-y-1">
                        <p className="text-sm font-medium text-gray-900">{editingItem.product.name}</p>
                        <p className="text-xs text-gray-500">{editingItem.product.productNo}</p>
                        {editingItem.categorySku && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                            <Tag className="w-3 h-3" />
                            {editingItem.categorySku.supplierCategory.categoryType} · {editingItem.categorySku.skuValue}{editingItem.categorySku.skuUnit === 'CL' ? 'cl' : 'L'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Cost */}
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
                        onChange={e => setFormData({ ...formData, supplierCostPerPack: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter cost per pack"
                      />
                    </div>

                    {/* Price change reason (edit only) */}
                    {editingItem && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price Change Reason</label>
                        <input
                          type="text"
                          value={formData.priceChangeReason}
                          onChange={e => setFormData({ ...formData, priceChangeReason: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Optional: Why is the price changing?"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Explain if the price changed (e.g., "Supplier increased prices")
                        </p>
                      </div>
                    )}

                    {/* Min order */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order (Packs)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.minimumOrderPacks}
                        onChange={e => setFormData({ ...formData, minimumOrderPacks: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Optional"
                      />
                    </div>

                    {/* Lead time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (Days)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.leadTimeDays}
                        onChange={e => setFormData({ ...formData, leadTimeDays: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Optional"
                      />
                    </div>

                    {/* Availability */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isAvailable"
                        checked={formData.isAvailable}
                        onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
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
                        rows={2}
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button type="submit" className="w-full sm:w-auto sm:ml-3">
                    {editingItem ? 'Update' : 'Add'} Product
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseModal} className="mt-3 w-full sm:mt-0 sm:w-auto">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Price History Modal ── */}
      {showPriceHistoryModal && selectedProductForHistory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowPriceHistoryModal(false)} />

            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-50">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Price Change History</h3>
                  <button onClick={() => setShowPriceHistoryModal(false)} className="text-gray-400 hover:text-gray-500">
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{selectedProductForHistory.product.name}</p>
                  <p className="text-xs text-gray-600">{selectedProductForHistory.supplierCompany.name} ({selectedProductForHistory.supplierCompany.code})</p>
                  {selectedProductForHistory.categorySku && (
                    <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                      <Tag className="w-3 h-3" />
                      {selectedProductForHistory.categorySku.supplierCategory.categoryType} · {selectedProductForHistory.categorySku.skuValue}{selectedProductForHistory.categorySku.skuUnit === 'CL' ? 'cl' : 'L'}
                    </span>
                  )}
                  <p className="text-sm font-semibold text-blue-600 mt-1">
                    Current Price: ₦{Number(selectedProductForHistory.supplierCostPerPack).toLocaleString()}
                  </p>
                </div>

                {loadingHistory ? (
                  <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Old Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changed By</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {priceHistory.map((record: any) => {
                          const oldP = Number(record.oldPrice);
                          const newP = Number(record.newPrice);
                          const change = newP - oldP;
                          const pct = ((change / oldP) * 100).toFixed(2);
                          const up = change > 0;
                          return (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {new Date(record.createdAt).toLocaleDateString()}<br />
                                <span className="text-xs text-gray-500">{new Date(record.createdAt).toLocaleTimeString()}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">₦{oldP.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">₦{newP.toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${up ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                  {up ? '↑' : '↓'} ₦{Math.abs(change).toLocaleString()} ({pct}%)
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{record.changedByUser?.username || 'Unknown'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{record.reason || <span className="text-gray-400 italic">No reason</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button type="button" variant="outline" onClick={() => setShowPriceHistoryModal(false)} className="w-full sm:w-auto">
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
