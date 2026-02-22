/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, MapPin, Fuel, User } from 'lucide-react';
import { transportService, TransportLocation, CreateTransportLocationData } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/authStore';

// ── Location Form Modal ──────────────────────────────────────────────────────
interface LocationModalProps {
  location?: TransportLocation;
  onClose: () => void;
  onSuccess: () => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ location, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateTransportLocationData>({
    name: location?.name || '',
    fuelRequired: location?.fuelRequired ?? 0,
    driverWages: location?.driverWages ?? 0,
    address: location?.address || '',
    deliveryNotes: location?.deliveryNotes || '',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTransportLocationData) => transportService.createLocation(data),
    onSuccess: () => {
      globalToast.success('Location created successfully');
      onSuccess();
    },
    onError: (err: any) => {
      globalToast.error(err.response?.data?.message || 'Failed to create location');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateTransportLocationData>) =>
      transportService.updateLocation(location!.id, data),
    onSuccess: () => {
      globalToast.success('Location updated successfully');
      onSuccess();
    },
    onError: (err: any) => {
      globalToast.error(err.response?.data?.message || 'Failed to update location');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { globalToast.error('Location name is required'); return; }
    if (formData.fuelRequired < 0 || formData.driverWages < 0) {
      globalToast.error('Values cannot be negative'); return;
    }
    if (location) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={location ? 'Edit Location' : 'Add New Location'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
          <Input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Lagos, Abuja, Port Harcourt"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Required (Litres) *
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={formData.fuelRequired}
              onChange={(e) => setFormData({ ...formData, fuelRequired: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 250"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Wages (₦) *
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={formData.driverWages}
              onChange={(e) => setFormData({ ...formData, driverWages: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 15000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <Input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Optional address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Notes</label>
          <textarea
            value={formData.deliveryNotes}
            onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            rows={2}
            placeholder="Optional notes about this location"
          />
        </div>

        {/* Cost preview */}
        {(formData.fuelRequired > 0 || formData.driverWages > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-800 mb-1">Per-trip base costs</p>
            <div className="space-y-1 text-blue-700">
              <div className="flex justify-between">
                <span>Fuel required</span>
                <span>{Number(formData.fuelRequired).toLocaleString()} litres</span>
              </div>
              <div className="flex justify-between">
                <span>Driver wages</span>
                <span>₦{Number(formData.driverWages).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : location ? 'Update Location' : 'Create Location'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
export const TransportLocations: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<TransportLocation | null>(null);

  const canManage = ['SUPER_ADMIN', 'TRANSPORT_ADMIN'].includes(user?.role || '');

  const { data: locations, isLoading } = useQuery({
    queryKey: ['transport-locations'],
    queryFn: () => transportService.getLocations(),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => transportService.deleteLocation(id),
    onSuccess: () => {
      globalToast.success('Location deactivated');
      queryClient.invalidateQueries({ queryKey: ['transport-locations'] });
    },
    onError: (err: any) => {
      globalToast.error(err.response?.data?.message || 'Failed to deactivate location');
    },
  });

  const handleEdit = (loc: TransportLocation) => {
    setEditingLocation(loc);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingLocation(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingLocation(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['transport-locations'] });
    handleClose();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transport Locations</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage delivery locations with per-trip cost rates
          </p>
        </div>
        {canManage && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        )}
      </div>

      {/* Locations Grid */}
      {!locations || locations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No locations yet</h3>
          <p className="mt-1 text-sm text-gray-500">Add a location to get started.</p>
          {canManage && (
            <Button className="mt-4" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-white rounded-lg shadow border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{loc.name}</h3>
                    {loc.address && (
                      <p className="text-xs text-gray-500">{loc.address}</p>
                    )}
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(loc)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Deactivate "${loc.name}"?`)) {
                          deactivateMutation.mutate(loc.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Cost Details */}
              <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Fuel className="h-3.5 w-3.5 text-orange-500" />
                    Fuel required
                  </span>
                  <span className="font-medium text-gray-900">
                    {Number(loc.fuelRequired).toLocaleString()} litres
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                    Driver wages
                  </span>
                  <span className="font-medium text-gray-900">
                    ₦{Number(loc.driverWages).toLocaleString()}
                  </span>
                </div>
              </div>

              {loc.deliveryNotes && (
                <p className="mt-3 text-xs text-gray-500 italic">{loc.deliveryNotes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <LocationModal
          location={editingLocation || undefined}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default TransportLocations;
