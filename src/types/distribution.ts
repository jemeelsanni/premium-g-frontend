// src/types/distribution.ts
import { Product } from "./common";

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum CustomerType {
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
  GOVERNMENT = 'GOVERNMENT'
}

export enum PaymentTerms {
  CASH = 'CASH',
  NET_15 = 'NET_15',
  NET_30 = 'NET_30',
  NET_60 = 'NET_60'
}

// ✨ NEW: Payment status enum
export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  CONFIRMED = 'CONFIRMED'
}

// ✨ Supplier status enum
export enum SupplierStatus {
  NOT_SENT = 'NOT_SENT',
  PAYMENT_SENT = 'PAYMENT_SENT',
  ORDER_RAISED = 'ORDER_RAISED',
  PROCESSING = 'PROCESSING',
  LOADED = 'LOADED',
  DISPATCHED = 'DISPATCHED'
}

// ✨ NEW: Delivery status enum
export enum DeliveryStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  FULLY_DELIVERED = 'FULLY_DELIVERED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  FAILED = 'FAILED'
}

export interface SupplierCompany {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customerType: CustomerType;
  territory: string;
  salesRepId: string;
  totalOrders: number;
  totalSpent: number;
  customerBalance: number;  // Positive = customer owes us, Negative = we owe customer (credit)
  averageOrderValue: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: DistributionCustomer;
  locationId: string;
  location?: Location;
  deliveryLocation?: string;
  totalPallets: number;
  totalPacks: number;
  originalAmount: number;
  finalAmount: number;
  balance: number;
  amountPaid: number;
  
  // ✨ Payment fields
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentReference?: string;
  paymentConfirmedBy?: string;
  paymentConfirmedAt?: string;
  paymentNotes?: string;
  
  // ✨ Supplier company reference
  supplierCompanyId?: string;
  supplierCompany?: SupplierCompany;

  // ✨ Supplier payment tracking
  paidToSupplier: boolean;
  amountPaidToSupplier?: number;
  paymentDateToSupplier?: string;
  supplierOrderNumber?: string;
  supplierInvoiceNumber?: string;
  supplierStatus: SupplierStatus;

  // ✨ Critical fields for price adjustment lock
  orderRaisedBySupplier: boolean;  // TRUE when supplier raises the order
  orderRaisedAt?: string;          // Timestamp when order was raised
  supplierLoadedDate?: string;
  
  // Transport fields
  transporterCompany?: string;
  driverNumber?: string;
  truckNumber?: string;
  
  // Delivery tracking
  deliveryStatus: DeliveryStatus;
  deliveredPallets?: number;
  deliveredPacks?: number;
  deliveredAt?: string;
  deliveredBy?: string;
  deliveryNotes?: string;
  nonDeliveryReason?: string;
  partialDeliveryReason?: string;
  deliveryReviewedBy?: string;
  deliveryReviewedAt?: string;
  
  status: OrderStatus;
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: DistributionOrderItem[];
  priceAdjustments?: PriceAdjustment[]; // ✨ NEW: Track price adjustments
}

export interface DistributionOrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ✨ NEW: Price adjustment interface
export interface PriceAdjustment {
  id: string;
  orderId: string;
  originalAmount: number;
  adjustedAmount: number;
  adjustmentType: string;
  reason: string;
  riteFoodsInvoiceReference?: string;
  adjustedBy: string;
  adjuster?: {
    username: string;
  };
  createdAt: string;
}

export interface RecordPaymentData {
  orderId: string;
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'WHATSAPP_TRANSFER' | 'POS' | 'MOBILE_MONEY';
  reference?: string;
  paidBy?: string;
  receivedBy: string;
  notes?: string;
}

export interface SupplierPaymentData {
  orderId: string;
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'CHECK';
  reference?: string;
  supplierOrderNumber?: string;
  supplierInvoiceNumber?: string;
}

export interface AssignTransportData {
  orderId: string;
  transporterCompany: string;
  driverNumber: string;
  truckNumber?: string;
}

export interface RecordDeliveryData {
  orderId: string;
  deliveryStatus: 'FULLY_DELIVERED' | 'PARTIALLY_DELIVERED' | 'FAILED';
  deliveredPallets?: number;
  deliveredPacks?: number;
  deliveredBy: string;
  deliveryNotes?: string;
  nonDeliveryReason?: string;
  partialDeliveryReason?: string;
}

// ✨ NEW: Price adjustment request data
export interface PriceAdjustmentData {
  orderId: string;
  adjustedAmount: number;
  adjustmentType: 'SUPPLIER_PRICE_CHANGE' | 'CUSTOMER_NEGOTIATION' | 'ERROR_CORRECTION' | 'OTHER';
  reason: string;
  supplierInvoiceReference?: string;
}

// ✨ Update supplier status data
export interface UpdateSupplierStatusData {
  orderId: string;
  supplierStatus: 'PAYMENT_SENT' | 'ORDER_RAISED' | 'PROCESSING' | 'LOADED' | 'DISPATCHED';
  orderRaisedAt?: string;
  loadedDate?: string;
}

// ✨ NEW: Helper interface for checking price adjustment eligibility
export interface PriceAdjustmentEligibility {
  canAdjust: boolean;
  reason?: string;
}

/**
 * ✨ NEW: Helper function to check if price adjustment is allowed for an order
 * 
 * @param order - The distribution order to check
 * @returns Object indicating if adjustment is allowed and reason if not
 * 
 * @example
 * ```typescript
 * const eligibility = canAdjustOrderPrice(order);
 * if (eligibility.canAdjust) {
 *   // Show enabled button
 * } else {
 *   // Show disabled button with reason
 *   console.log(eligibility.reason);
 * }
 * ```
 */
export const canAdjustOrderPrice = (order: DistributionOrder): PriceAdjustmentEligibility => {
  // Check 1: Payment must be confirmed
  if (order.paymentStatus !== PaymentStatus.CONFIRMED) {
    return {
      canAdjust: false,
      reason: 'Payment must be confirmed before adjusting price'
    };
  }

  // Check 2: Order must NOT be raised by supplier (Primary check)
  if (order.orderRaisedBySupplier === true) {
    const raisedDate = order.orderRaisedAt
      ? new Date(order.orderRaisedAt).toLocaleDateString()
      : 'a previous date';

    const supplierName = order.supplierCompany?.name || 'the supplier';

    return {
      canAdjust: false,
      reason: `Order was raised by ${supplierName} on ${raisedDate}. Price adjustments are permanently locked.`
    };
  }

  // Check 3: Supplier status must not be in locked states
  const lockedStatuses: SupplierStatus[] = [
    SupplierStatus.ORDER_RAISED,
    SupplierStatus.PROCESSING,
    SupplierStatus.LOADED,
    SupplierStatus.DISPATCHED
  ];

  if (lockedStatuses.includes(order.supplierStatus)) {
    return {
      canAdjust: false,
      reason: `Order status is "${order.supplierStatus}". Price adjustments are not permitted at this stage.`
    };
  }

  // All checks passed - adjustment is allowed
  return {
    canAdjust: true
  };
};

/**
 * ✨ NEW: Check if user role can adjust prices
 * 
 * @param userRole - The role of the current user
 * @returns Boolean indicating if user has permission
 */
export const hasAdjustPricePermission = (userRole: string): boolean => {
  const allowedRoles = ['SUPER_ADMIN', 'DISTRIBUTION_ADMIN'];
  return allowedRoles.includes(userRole);
};

/**
 * ✨ NEW: Combined check for price adjustment availability
 * 
 * @param order - The distribution order
 * @param userRole - The current user's role
 * @returns Comprehensive eligibility check including role
 * 
 * @example
 * ```typescript
 * const { canAdjust, reason } = canUserAdjustOrderPrice(order, userRole);
 * 
 * <Button 
 *   disabled={!canAdjust}
 *   title={reason}
 *   onClick={openAdjustmentModal}
 * >
 *   Adjust Price
 * </Button>
 * ```
 */
export const canUserAdjustOrderPrice = (
  order: DistributionOrder, 
  userRole: string
): PriceAdjustmentEligibility => {
  // First check user permissions
  if (!hasAdjustPricePermission(userRole)) {
    return {
      canAdjust: false,
      reason: 'Insufficient permissions. Only admins can adjust prices.'
    };
  }
  
  // Then check order eligibility
  return canAdjustOrderPrice(order);
};