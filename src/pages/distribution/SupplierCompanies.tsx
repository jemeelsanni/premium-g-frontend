import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Building2, Mail, Phone, User } from 'lucide-react';
import supplierCompanyService from '../../services/supplierCompanyService';
import { SupplierCompany } from '../../types/distribution';
import toast from 'react-hot-toast';

interface SupplierFormData {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms?: string;
  notes?: string;
}

const SupplierCompanies: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierCompany | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    paymentTerms: '',
    notes: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierCompanyService.getAllSupplierCompanies();
      setSuppliers(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSupplier) {
        await supplierCompanyService.updateSupplierCompany(editingSupplier.id, formData);
        toast.success('Supplier updated successfully');
      } else {
        await supplierCompanyService.createSupplierCompany(formData);
        toast.success('Supplier created successfully');
      }

      resetForm();
      loadSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    }
  };

  const handleEdit = (supplier: SupplierCompany) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      code: supplier.code,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
      paymentTerms: supplier.paymentTerms || '',
      notes: supplier.notes || ''
    });
    setShowForm(true);
  };

  const handleToggleStatus = async (supplier: SupplierCompany) => {
    try {
      await supplierCompanyService.updateSupplierCompany(supplier.id, {
        isActive: !supplier.isActive
      });
      toast.success(`Supplier ${supplier.isActive ? 'deactivated' : 'activated'} successfully`);
      loadSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update supplier status');
    }
  };

  const handleDelete = async (supplier: SupplierCompany) => {
    if (!window.confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      return;
    }

    try {
      await supplierCompanyService.deleteSupplierCompany(supplier.id);
      toast.success('Supplier deleted successfully');
      loadSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete supplier');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
      paymentTerms: '',
      notes: ''
    });
    setEditingSupplier(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  placeholder="e.g., RFL, ABC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., NET 30, COD"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className={`bg-white rounded-lg shadow-md p-6 ${
              !supplier.isActive ? 'opacity-60' : ''
            }`}
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

            <div className="space-y-2 mb-4">
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
              {supplier.paymentTerms && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Payment Terms:</span> {supplier.paymentTerms}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(supplier)}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleToggleStatus(supplier)}
                className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 ${
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
