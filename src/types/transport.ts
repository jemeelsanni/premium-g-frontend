export enum TransportOrderStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface TransportOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  pickupLocation: string;
  deliveryLocation: string;
  totalOrderAmount: number;
  deliveryStatus: TransportOrderStatus;
  truckId?: string;
  truck?: Truck;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Truck {
  id: string;
  plateNumber: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}