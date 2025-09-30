export enum TransportOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface TransportOrder {
  id: string;
  orderNumber: string;
  invoiceNumber?: string;
  clientName: string;
  clientPhone?: string;
  pickupLocation: string;
  deliveryAddress: string;  // ✅ Added
  locationId: string;  // ✅ Added
  location?: Location;
  totalOrderAmount: number;
  
  // Fuel & Expenses
  fuelRequired: number;  // ✅ Added
  fuelPricePerLiter: number;  // ✅ Added
  totalFuelCost: number;
  serviceChargeExpense: number;
  driverWages: number;
  truckExpenses: number;
  totalExpenses: number;
  
  // Profit
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  
  // Status & Assignment
  deliveryStatus: TransportOrderStatus;
  deliveryDate?: string;
  truckId?: string;
  truck?: Truck;
  driverDetails?: string;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Truck {
  id: string;
  truckId: string;
  registrationNumber?: string;  // ✅ Updated to match schema
  maxPallets: number;  // ✅ Updated to match schema
  currentLoad?: number;
  availableSpace?: number;
  isActive: boolean;
  make?: string;
  model?: string;
  year?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Import Location type from index if needed
import { Location } from './index';