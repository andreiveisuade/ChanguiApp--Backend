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

export interface TaxCategory {
  id: string;
  name: string;
  rate: number;
  legal_reference: string;
  keywords: string[];
  priority: number;
  is_fallback: boolean;
}

export interface TaxCategoryRef {
  id: string;
  name: string;
  rate: number;
}

export interface TaxBreakdown {
  category: string;
  rate: number;
  net_price: number;
  tax_amount: number;
}

export interface TaxLine {
  rate: number;
  label: string;
  base: number;
  amount: number;
}

export interface TaxSummary {
  subtotal_net: number;
  taxes: TaxLine[];
  total: number;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  price: number;
  image_url: string | null;
  tax_category_id?: string;
  tax_locked?: boolean;
  tax_category?: TaxCategoryRef | null;
}

export interface ProductWithTax extends Product {
  tax: TaxBreakdown;
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
  tax_rate: number;
}

export interface PurchaseDetail extends Purchase {
  items: PurchaseItem[];
  summary?: TaxSummary;
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

export type SyncJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface SyncJob {
  id: string;
  type: string;
  status: SyncJobStatus;
  total_target: number | null;
  processed: number;
  errors: number;
  last_offset: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}
