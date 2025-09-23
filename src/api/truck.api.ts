import apiClient from './client';
import { ApiResponse } from '../types';

export interface Truck {
  id: string;
  truckId: string;
  registrationNumber: string;
  maxPallets: number;
  currentLoad: number;
  availableSpace: number;
  isActive: boolean;
  make?: string;
  model?: string;
  year?: number;
  notes?: string;
  updatedAt: string;
  createdAt: string;
}

export interface CreateTruckData {
  truckId: string;
  registrationNumber: string;
  maxPallets: number;
  make?: string;
  model?: string;
  year?: number;
  notes?: string;
}

export interface UpdateTruckData {
  registrationNumber?: string;
  maxPallets?: number;
  currentLoad?: number;
  isActive?: boolean;
  make?: string;
  model?: string;
  year?: number;
  notes?: string;
}

export const truckApi = {
  getTrucks: async () => {
    const { data } = await apiClient.get<ApiResponse<{ trucks: Truck[] }>>(
      '/transport/trucks'
    );
    return data;
  },

  createTruck: async (truckData: CreateTruckData) => {
    const { data } = await apiClient.post<ApiResponse<{ truck: Truck }>>(
      '/transport/trucks',
      truckData
    );
    return data;
  },

  getTruckById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<{ truck: Truck }>>(
      `/transport/trucks/${id}`
    );
    return data;
  },

  updateTruck: async (id: string, updateData: UpdateTruckData) => {
    const { data } = await apiClient.put<ApiResponse<{ truck: Truck }>>(
      `/transport/trucks/${id}`,
      updateData
    );
    return data;
  },

  deleteTruck: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/transport/trucks/${id}`
    );
    return data;
  },
};