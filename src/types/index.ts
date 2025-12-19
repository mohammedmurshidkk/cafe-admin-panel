// Auth types
export type UserRole = 'admin' | 'superadmin';

export interface User {
  id: string;
  email: string;
  business_id?: string;
  business_name?: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Superadmin Business types
export interface SuperadminBusiness {
  id: string;
  name: string;
  phone: string;
  address?: string;
  logo_url?: string | null;
  is_active: boolean;
  supports_delivery: boolean;
  supports_takeaway: boolean;
  delivery_fee?: number;
  free_delivery_above?: number;
  minimum_wait_minutes?: number;
  admin_count: number;
  created_at: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
}

export interface SuperadminBusinessFormData {
  name: string;
  phone: string;
  address?: string;
  is_active: boolean;
}

export interface CreateAdminData {
  name: string;
  email: string;
  password: string;
  business_id: string;
}

export interface BusinessesResponse {
  businesses: SuperadminBusiness[];
  pagination: Pagination;
}

// Dashboard types
export interface DashboardStats {
  ordersToday: number;
  activeSessions: number;
  pendingOrders: number;
  revenueToday: number;
}

// Order types
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'completed'
  | 'cancelled';
export type FulfillmentType = 'delivery' | 'takeaway';

export interface OrderItem {
  item_name: string;
  name?: string
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface Order {
  id: string;
  customer_phone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  created_at: string;
  fulfillment_type?: FulfillmentType;
  fulfillment_datetime?: string;
  fulfillment_location?: string;
  order_number: string;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: Pagination;
}

// Session types
export type SessionStatus = 'active' | 'completed';

export interface Session {
  id: string;
  customer_phone: string;
  status: SessionStatus;
  ai_paused: boolean;
  items_count: number;
  last_message_at: string;
  created_at: string;
}

export interface SessionItem {
  name: string;
  quantity: number;
  unit_price?: number;
}

export interface SessionMessage {
  id: string;
  direction: 'inbound' | 'outbound' | 'incoming' | 'outgoing';
  content: string;
  created_at: string;
}

export interface SessionDetail {
  session: Session & { items: OrderItem[] };
  messages: SessionMessage[];
}

export interface SessionsResponse {
  sessions: Session[];
  pagination: Pagination;
}

// Menu types
export interface MenuItemSize {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category_name: string;
  base_price: number;
  sizes: MenuItemSize[];
  image_url: string | null;
  is_customizable: boolean;
  requires_date: boolean;
  is_available: boolean;
  special_notes?: string;
  price?: number;
}

export interface MenuItemFormData {
  name: string;
  description: string;
  category_id: string;
  base_price: number;
  sizes: MenuItemSize[];
  is_customizable: boolean;
  requires_date: boolean;
  is_available: boolean;
  special_notes?: string;
}

export interface MenuResponse {
  items: MenuItem[];
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string | null;
  custom_text_prompt?: string;
  sort_order: number;
  items_count: number;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  image_url?: string | null;
  category_note?: string;
  custom_text_prompt?: string;
  display_order?: number;
}

export interface CategoriesResponse {
  categories: Category[];
}

// Addon types
export interface Addon {
  id: string;
  name: string;
  price: number;
  description?: string;
  is_available: boolean;
}

export interface AddonGroup {
  name: string;
  addons: Addon[];
}

export interface AddonGroupsResponse {
  groups: AddonGroup[];
}

export interface CategoryAddon {
  addon_id: string;
  category_id: string;
  addon_name: string;
  addon_price: number;
}

export interface CategoryAddonsResponse {
  addons: CategoryAddon[];
}

// Business types
export interface Outlet {
  id: string;
  outlet_name: string;
  address: string;
  phone: string;
  is_active: boolean;
}

export interface Business {
  id: string;
  name: string;
  phone_number: string;
  logo_url: string | null;
  welcome_message: string;
  thank_you_message: string;
  custom_ai_prompt: string;
  critical_message: string;
  critical_message_enabled: boolean;
  order_number_prefix?: string;
  customer_support_phone?: string;
  supports_delivery: boolean;
  supports_takeaway: boolean;
  delivery_fee?: number;
  free_delivery_above?: number;
  delivery_radius_km?: number;
  minimum_wait_minutes?: number;
  outlets: Outlet[];
  phone?: string;
}

export interface BusinessResponse {
  business: Business;
}

// Common types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface SuccessResponse {
  success: boolean;
}

export interface ErrorResponse {
  error: string;
}

// Notification types
export type NotificationType = 'customer_image' | 'new_order' | 'ai_error';

export interface Notification {
  id: string;
  type: NotificationType;
  customer_phone: string | null;
  message: string;
  image_id: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  data: Notification[];
  pagination: Pagination;
}

export interface UnreadCountResponse {
  count: number;
  data: Notification[];
}
