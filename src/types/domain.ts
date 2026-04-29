export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  full_name?: string;
  avatar_url?: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  price: number;
  image_url: string | null;
}

export interface Cart {
  id: string;
  user_id: string;
  store_id: string | null;
  status: 'active' | 'checked_out' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface CartWithItems extends Cart {
  items?: CartItem[];
}

export interface Purchase {
  id: string;
  user_id: string;
  store_id: string | null;
  total: number;
  payment_id: string;
  payment_status: 'pending' | 'completed' | 'failed';
  created_at: string;
  store_name?: string | null;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_name: string;
  barcode: string;
  quantity: number;
  unit_price: number;
}

export interface PurchaseDetail extends Purchase {
  items: PurchaseItem[];
}

export interface CheckoutResponse {
  preference_id: string;
  init_point: string;
}

export interface Store {
  id: string;
  name: string;
  chain: string | null;
  address: string | null;
  lat: number;
  lng: number;
  distanceKm?: number;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}
