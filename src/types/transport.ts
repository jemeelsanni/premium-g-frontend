/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/transport.ts - COMPLETE TYPE DEFINITIONS

import { ReactNode } from 'react';
import { Location } from './index';

export enum TransportOrderStatus {
  PENDING = 'PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  SENT_TO_SUPPLIER = 'SENT_TO_SUPPLIER',
  PROCESSING_BY_SUPPLIER = 'PROCESSING_BY_SUPPLIER',
  LOADED = 'LOADED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED'
}

export enum DeliveryStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PROCESSING = 'PROCESSING',
    IN_TRANSIT = 'IN_TRANSIT',
    DELIVERED = 'DELIVERED',
    PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
    CANCELLED = 'CANCELLED'
}


export enum ExpenseType {
  TRIP = 'TRIP',
  NON_TRIP = 'NON_TRIP'
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface TransportOrder {
  deliveryLocation: ReactNode;
  id: string;
  orderNumber: string;
  invoiceNumber?: string;
  clientName: string;
  clientPhone?: string;
  pickupLocation: string;
  deliveryAddress: string;
  locationId: string;
  location?: Location;
  totalOrderAmount: number;
  deliveryStatus: DeliveryStatus;
  
  // Fuel & Expenses
  fuelRequired: number;
  fuelPricePerLiter: number;
  totalFuelCost: number;
  serviceChargeExpense: number;
  driverWages: number;
  tripAllowance: number;
  truckExpenses: number;
  totalTripExpenses: number;
  
  // Profit
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  
  // Status & Assignment
  deliveryDate?: string;
  truckId?: string;
  truck?: Truck;
  driverDetails?: string;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Truck {
  capacity: any;
  plateNumber: string;
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
  createdAt: string;
  updatedAt?: string;
}

export interface TransportExpense {
  id: string;
  truckId?: string;
  truck?: Truck;
  locationId?: string;
  location?: Location;
  expenseType: ExpenseType;
  category: string;
  amount: number;
  description: string;
  expenseDate: string;
  status: ExpenseStatus;
  approvedBy?: string;
  approver?: { username: string; role: string };  // ✅ Changed from approvedByUser
  // ❌ Removed rejectedBy and rejectedByUser - not in schema
  approvedAt?: string;
  // ❌ Removed rejectedAt - not in schema
  approvalNotes?: string;
  isPaid: boolean;
  paidAt?: string;
  createdBy: string;
  createdByUser?: { username: string; role: string };
  createdAt: string;
  updatedAt: string;
}

export interface TransportAnalytics {
  success: boolean;
  data: {
    summary: {
      totalRevenue: number;
      tripExpenses: {
        fuel: number;
        wages: number;
        serviceCharges: number;
        total: number;
      };
      nonTripExpenses: number;
      totalExpenses: number;
      grossProfit: number;
      netProfit: number;
      profitMargin: number;
      totalTrips: number;
      averageTripRevenue: number;
      totalFuelLiters: number;
    };
    breakdown: {
      byClient: {
        name: string;
        trips: number;
        revenue: number;
        profit: number;
      }[];
      byTruck: {
        truck: string;
        trips: number;
        revenue: number;
        fuelUsed: number;
        profit: number;
      }[];
      byLocation: {
        name: string;
        trips: number;
        revenue: number;
      }[];
      expensesByCategory: Record<string, number>;
    };
    period: {
      startDate?: string;
      endDate?: string;
    };
  };
}

export interface TruckPerformance {
  success: boolean;
  data: {
    truck: {
      truckId: string;
      registrationNumber: string;
      make?: string;
      model?: string;
      maxPallets: number;
    };
    performance: {
      totalTrips: number;
      totalRevenue: number;
      totalTripExpenses: number;
      totalMaintenanceExpenses: number;
      totalExpenses: number;
      netProfit: number;
      profitMargin: number;
      totalFuelUsed: number;
      totalFuelCost: number;
      averageRevenuePerTrip: number;
      averageFuelPerTrip: number;
    };
    monthlyBreakdown: {
      month: string;
      trips: number;
      revenue: number;
      fuelUsed: number;
    }[];
    recentTrips: {
      id: string;
      orderNumber: string;
      client: string;
      location?: string;
      revenue: number;
      profit: number;
      fuelUsed: number;
      date: string;
    }[];
    recentExpenses: {
      id: string;
      category: string;
      amount: number;
      description: string;
      date: string;
    }[];
    period: {
      startDate?: string;
      endDate?: string;
    };
  };
}

export interface ClientStats {
  success: boolean;
  data: {
    clients: {
      clientName: string;
      totalTrips: number;
      totalRevenue: number;
      totalProfit: number;
      averageRevenuePerTrip: number;
      profitMargin: number;
      lastTrip: string;
    }[];
    summary: {
      totalClients: number;
      totalRevenue: number;
      totalProfit: number;
    };
    period: {
      startDate?: string;
      endDate?: string;
    };
  };
}

export interface ProfitAnalysis {
  success: boolean;
  data: {
    summary: {
      totalTrips: number;
      totalRevenue: number;
      totalExpenses: number;
      totalProfit: number;
      averageMargin: number;
      breakdown: {
        fuel: number;
        wages: number;
        serviceCharges: number;
      };
    };
    byLocation: {
      location: string;
      trips: number;
      revenue: number;
      profit: number;
    }[];
    monthlyTrend: {
      month: string;
      trips: number;
      revenue: number;
      profit: number;
      avgMargin: number;
    }[];
    recentOrders: {
      id: string;
      orderNumber: string;
      client: string;
      location?: string;
      revenue: number;
      expenses: number;
      profit: number;
      margin: number;
      date: string;
    }[];
  };
}

export interface ExpenseSummary {
  success: boolean;
  data: {
    summary: {
      totalAmount: number;
      totalCount: number;
      averageAmount: number;
      pendingCount?: number;      // ADD THIS
      pendingAmount?: number;      // ADD THIS
      approvedCount?: number;      // ADD THIS
      approvedAmount?: number;     // ADD THIS
      rejectedCount?: number;      // ADD THIS
      rejectedAmount?: number;     // ADD THIS
    };
    byCategory: {
      category: string;
      amount: number;
      count: number;
    }[];
    byType: {
      type: string;
      amount: number;
      count: number;
    }[];
    byTruck: {
      truckId: string;
      amount: number;
      count: number;
    }[];
    period: {
      startDate?: string;
      endDate?: string;
    };
    byStatus?: { 
      status: string; 
      amount: number; 
      count: number; 
    }[];  // ADD THIS
    monthly?: { 
      month: string; 
      tripExpenses: number; 
      nonTripExpenses: number; 
      total: number; 
    }[];  // ADD THIS


    
  };
}