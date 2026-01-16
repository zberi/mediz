export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  dosage: string;
  manufacturer: string;
  inStock: boolean;
  stockQuantity: number;
  requiresPrescription: boolean;
  warnings?: string[];
  sideEffects?: string[];
  ageRestriction?: number;
  tabletCount?: number; // Number of tablets/capsules in pack
  packSize?: string; // e.g., "1 Strip", "30 Tablets", "100ml Bottle"
  leafletIncluded?: boolean; // Whether product includes information leaflet
  defaultQuantity?: number; // Default quantity when adding to cart
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cnic?: string;
  age?: number;
  address?: Address;
  isSenior: boolean;
  medicalHistory?: string[];
}

export interface Address {
  id: string;
  label: string;
  fullAddress: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
  discount: number;
  address: Address;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  trackingUpdates: TrackingUpdate[];
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'wallet';

export interface TrackingUpdate {
  status: OrderStatus;
  timestamp: Date;
  message: string;
  location?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  medicineCount: number;
}

export interface SearchSuggestion {
  type: 'medicine' | 'category' | 'symptom';
  text: string;
  id?: string;
}
