import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Building2, Mail, Phone, User, Eye, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import supplierCompanyService, { CategoryInput, SkuInput } from '../../services/supplierCompanyService';
import { SupplierCompany, CATEGORY_DISPLAY_NAMES, ProductCategoryType } from '../../types/distribution';
import toast from 'react-hot-toast';

const ALL_CATEGORIES: ProductCategoryType[] = [
  ProductCategoryType.CSD,
  ProductCategoryType.ED,
  ProductCategoryType.WATER,
  ProductCategoryType.JUICE,
];

interface SupplierFormData {
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  notes: string;
  productCategories: CategoryInput[];
}

const defaultForm = (): SupplierFormData => ({
  name: '',
  code: '',
  email: '',
  phone: '',
  address: '',
  contactPerson: '',
  notes: '',
  productCategories: [],
});

const SupplierCompanies: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<SupplierCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierCompany | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(defaultForm());
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierCompanyService.getAllSupplierCompanies();
      setSuppliers(data);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  // ─── Category helpers ──────────────────────────────────────────────────────

  const toggleCategory = (type: ProductCategoryType) => {
    setFormData(prev => {
      const exists = prev.productCategories.find(c => c.categoryType === type);
      if (exists) {
        return {
          ...prev,
          productCategories: prev.productCategories.filter(c => c.categoryType !== type),
        };
      }
      return {
        ...prev,
        productCategories: [...prev.productCategories, { categoryType: type, skus: [] }],
      };
    });
  };

  const addSku = (categoryType: ProductCategoryType) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.map(c =>
        c.categoryType === categoryType
          ? { ...c, skus: [...c.skus, { skuValue: '', skuUnit: 'CL' as const }] }
          : c
      ),
    }));
  };

  const removeSku = (categoryType: ProductCategoryType, skuIndex: number) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.map(c =>
        c.categoryType === categoryType
          ? { ...c, skus: c.skus.filter((_, i) => i !== skuIndex) }
          : c
      ),
    }));
  };

  const updateSku = (categoryType: ProductCategoryType, skuIndex: number, field: keyof SkuInput, value: string) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.map(c =>
        c.categoryType === categoryType
          ? {
              ...c,
              skus: c.skus.map((sku, i) =>
                i === skuIndex ? { ...sku, [field]: value } : sku
              ),
            }
          : c
      ),
    }));
  };

  const toggleCategoryExpand = (type: string) => {
    setExpandedCategories(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // ─── Form submit ───────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate SKUs: each must have a positive value
    for (const cat of formData.productCategories) {
      for (const sku of cat.skus) {
        const val = parseFloat(String(sku.skuValue));
        if (!sku.skuValue || isNaN(val) || val <= 0) {
          toast.error(`All SKU values must be positive numbers in "${CATEGORY_DISPLAY_NAMES[cat.categoryType]}"`);
          return;
        }
      }
    }

    const payload = {
      name: formData.name,
      code: formData.code,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      contactPerson: formData.contactPerson || undefined,
      notes: formData.notes || undefined,
      productCategories: formData.productCategories.map(cat => ({
        categoryType: cat.categoryType,
        skus: cat.skus.map(s => ({ skuValue: parseFloat(String(s.skuValue)), skuUnit: s.skuUnit })),
      })),
    };

    try {
      if (editingSupplier) {
        await supplierCompanyService.updateSupplierCompany(editingSupplier.id, payload);
        toast.success('Supplier updated successfully');
      } else {
        await supplierCompanyService.createSupplierCompany(payload);
        toast.success('Supplier created successfully');
      }
      resetForm();
      loadSuppliers();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save supplier');
    }
  };

  const handleEdit = (supplier: SupplierCompany) => {
    setEditingSupplier(supplier);
    // Rebuild form categories from existing data
    const cats: CategoryInput[] = (supplier.productCategories ?? []).map(cat => ({
      categoryType: cat.categoryType as ProductCategoryType,
      skus: cat.skus.map(s => ({ skuValue: String(s.skuValue), skuUnit: s.skuUnit as 'CL' | 'L' })),
    }));
    setFormData({
      name: supplier.name,
      code: supplier.code,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
      notes: supplier.notes || '',
      productCategories: cats,
    });
    // Expand all existing categories
    const expanded: Record<string, boolean> = {};
    cats.forEach(c => { expanded[c.categoryType] = true; });
    setExpandedCategories(expanded);
    setShowForm(true);
  };

  const handleToggleStatus = async (supplier: SupplierCompany) => {
    try {
      await supplierCompanyService.updateSupplierCompany(supplier.id, { isActive: !supplier.isActive });
      toast.success(`Supplier ${supplier.isActive ? 'deactivated' : 'activated'} successfully`);
      loadSuppliers();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update supplier status');
    }
  };

  const handleDelete = async (supplier: SupplierCompany) => {
    if (!window.confirm(`Are you sure you want to delete ${supplier.name}?`)) return;
    try {
      await supplierCompanyService.deleteSupplierCompany(supplier.id);
      toast.success('Supplier deleted successfully');
      loadSuppliers();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete supplier');
    }
  };

  const resetForm = () => {
    setFormData(defaultForm());
    setEditingSupplier(null);
    setExpandedCategories({});
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Supplier Companies</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Supplier
        </button>
      </div>

      {/* ── Form ── */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  placeholder="e.g., RFL, ABC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            </div>

            {/* ── Product Categories & SKUs ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Product Categories &amp; SKUs</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select categories this supplier carries and add SKU sizes for each
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {ALL_CATEGORIES.map(catType => {
                  const isSelected = !!formData.productCategories.find(c => c.categoryType === catType);
                  const catData = formData.productCategories.find(c => c.categoryType === catType);
                  const isExpanded = expandedCategories[catType] ?? true;

                  return (
                    <div
                      key={catType}
                      className={`border rounded-lg transition-colors ${
                        isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      {/* Category header row */}
                      <div className="flex items-center gap-3 p-3">
                        <input
                          type="checkbox"
                          id={`cat-${catType}`}
                          checked={isSelected}
                          onChange={() => toggleCategory(catType)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`cat-${catType}`}
                          className="flex-1 text-sm font-medium text-gray-800 cursor-pointer select-none"
                        >
                          {CATEGORY_DISPLAY_NAMES[catType]}
                          <span className="ml-2 text-xs font-normal text-gray-500">({catType})</span>
                        </label>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={() => toggleCategoryExpand(catType)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>

                      {/* SKUs */}
                      {isSelected && isExpanded && catData && (
                        <div className="px-3 pb-3 border-t border-blue-200 pt-3 space-y-2">
                          {catData.skus.length === 0 && (
                            <p className="text-xs text-gray-400 italic">No SKUs added yet. Click "Add SKU" below.</p>
                          )}
                          {catData.skus.map((sku, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  required={isSelected}
                                  placeholder="e.g., 50"
                                  value={sku.skuValue}
                                  onChange={e => updateSku(catType, idx, 'skuValue', e.target.value)}
                                  className="w-28 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <select
                                  value={sku.skuUnit}
                                  onChange={e => updateSku(catType, idx, 'skuUnit', e.target.value)}
                                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="CL">cl</option>
                                  <option value="L">L</option>
                                </select>
                                <span className="text-xs text-gray-500">
                                  {sku.skuValue ? `${sku.skuValue}${sku.skuUnit === 'CL' ? 'cl' : 'L'}` : '—'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSku(catType, idx)}
                                className="p-1 text-red-400 hover:text-red-600 rounded"
                                title="Remove SKU"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addSku(catType)}
                            className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add SKU
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Supplier Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(supplier => (
          <div
            key={supplier.id}
            className={`bg-white rounded-lg shadow-md p-6 ${!supplier.isActive ? 'opacity-60' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                  <span className="text-sm text-gray-500">{supplier.code}</span>
                </div>
              </div>
              {supplier.isActive ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>

            <div className="space-y-2 mb-3">
              {supplier.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{supplier.email}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.contactPerson && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{supplier.contactPerson}</span>
                </div>
              )}
            </div>

            {/* Category badges */}
            {(supplier.productCategories ?? []).length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {supplier.productCategories!.map(cat => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700"
                      title={cat.skus.map(s => `${s.skuValue}${s.skuUnit === 'CL' ? 'cl' : 'L'}`).join(', ')}
                    >
                      {cat.categoryType}
                      {cat.skus.length > 0 && (
                        <span className="ml-1 text-indigo-500">·{cat.skus.length} SKU{cat.skus.length !== 1 ? 's' : ''}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate(`/distribution/suppliers/${supplier.id}`)}
                className="flex-1 min-w-[80px] px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <button
                onClick={() => handleEdit(supplier)}
                className="flex-1 min-w-[80px] px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleToggleStatus(supplier)}
                className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs ${
                  supplier.isActive
                    ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {supplier.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDelete(supplier)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers yet</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first supplier company</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Supplier
          </button>
        </div>
      )}
    </div>
  );
};

export default SupplierCompanies;
