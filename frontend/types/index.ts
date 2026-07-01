// User types
export type UserRole = "admin" | "employee";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Dealer types
export interface Dealer {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gst_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product types
export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Order types
export type OrderStatus = "pending" | "ongoing" | "completed" | "cancelled";

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface OrderStatusLog {
  id: number;
  old_status: string;
  new_status: string;
  changed_by_id: number;
  changed_by_name: string;
  remarks: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  dealer_id: number;
  dealer_name: string;
  created_by_id: number;
  created_by_name: string;
  assigned_to_id: number | null;
  assigned_to_name: string | null;
  status: OrderStatus;
  order_date: string;
  expected_delivery_date: string | null;
  completed_at: string | null;
  total_amount: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  status_logs: OrderStatusLog[];
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  page_size: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
}

// Dashboard types
export interface DashboardSummary {
  total_orders: number;
  pending_orders: number;
  ongoing_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  current_month_revenue: string;
  low_stock_products: number;
  total_active_dealers: number;
  total_active_employees: number;
}

export interface OrdersTrendItem {
  period: string;
  order_count: number;
  revenue: string;
}

export interface OrdersTrendResponse {
  period_type: string;
  data: OrdersTrendItem[];
}

export interface TopProductItem {
  product_id: number;
  product_name: string;
  product_sku: string;
  total_quantity_sold: number;
  total_revenue: string;
}

export interface TopProductsResponse {
  data: TopProductItem[];
}

export interface TopDealerItem {
  dealer_id: number;
  dealer_name: string;
  total_orders: number;
  total_value: string;
}

export interface TopDealersResponse {
  data: TopDealerItem[];
}

export interface RecentOrderItem {
  id: number;
  order_number: string;
  dealer_name: string;
  status: OrderStatus;
  total_amount: string;
  order_date: string;
}

export interface RecentOrdersResponse {
  data: RecentOrderItem[];
}

// Employee types
export interface Employee {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWorkload {
  employee_id: number;
  employee_name: string;
  pending_orders: number;
  ongoing_orders: number;
  completed_orders: number;
  total_assigned_orders: number;
}
