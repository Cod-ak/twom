export const PRODUCT_CATEGORIES = [
  "Tees & Tanks",
  "Pants",
  "Hoodies",
  "Accessories",
  "Shirts",
  "Anime",
  "Outerwear",
  "Tailoring",
  "Essentials",
  "Knitwear",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: string;              // UUID from database
  sku: string;             // 'twom-01'
  slug: string;            // 'heavyweight-cashmere-overcoat'
  name: string;
  description: string | null;
  category: ProductCategory | string;
  price: number;           // Integer in Kobo
  image_url: string;
  images?: string[];       // Array of gallery image URLs
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  is_new?: boolean;
}

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded" | "failed";

export interface OrderItemWithProduct {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  products: {
    name: string;
    image_url: string;
  } | null;
}

export interface AdminOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  total_amount: number;
  status: OrderStatus;
  payment_reference: string | null;
  payment_channel: string | null;
  paid_at: string | null;
  created_at: string;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  refunded_at: string | null;
  order_items: OrderItemWithProduct[];
}

export interface HeroSection {
  id?: string;
  headline: string;
  subheadline?: string | null;
  button_text: string;
  button_link: string;
  video_url: string;
  poster_url: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerOrderSummary {
  id: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  items_count: number;
}

export interface CustomerSummary {
  id: string;
  email: string;
  name: string;
  is_registered: boolean;
  role?: string;
  orders_count: number;
  lifetime_spend: number; // in Kobo
  first_seen: string;
  last_order_date: string | null;
  latest_shipping_address: string | null;
  orders: CustomerOrderSummary[];
}
