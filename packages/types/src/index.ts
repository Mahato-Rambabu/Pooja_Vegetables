// ─────────────────────────────────────────────
//  @pooja-vegetables/types
//  Single source of truth for all data shapes.
//  Imported by: backend, dashboard, b2b, customer
// ─────────────────────────────────────────────

// ── Enums ────────────────────────────────────

export type UserRole = 'customer' | 'admin'
export type ClientType = 'local' | 'b2b'
export type B2BClientType = 'restaurant' | 'canteen'
export type ProductUnit = 'kg' | 'piece' | 'dozen'
export type OrderStatus = 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type PaymentMethod = 'cash' | 'upi' | 'razorpay'
export type PaymentStatus = 'pending' | 'paid' | 'failed'

// ── User (local customer) ─────────────────────

export interface User {
  _id: string
  name: string
  phone: string           // used as login identifier
  address: string
  location: GeoPoint
  role: UserRole
  createdAt: string
  updatedAt: string
}

// ── B2B Client (restaurant / canteen) ────────

export interface B2BClient {
  _id: string
  businessName: string
  contactPerson: string
  phone: string
  email: string           // used as login identifier
  type: B2BClientType
  address: string
  // password is NEVER sent to frontend — omitted here intentionally
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ── Product ───────────────────────────────────

export interface Product {
  _id: string
  name: string
  category: 'fruit' | 'vegetable'
  unit: ProductUnit
  priceRetail: number     // ₹ shown in customer app
  priceBulk: number       // ₹ shown in B2B portal
  stock: number
  imageUrl?: string
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

// Lightweight shape used in bulk price update from dashboard
export interface ProductPriceUpdate {
  _id: string
  priceRetail: number
  priceBulk: number
}

// ── Order ─────────────────────────────────────

export interface OrderItem {
  productId: string
  name: string            // denormalized — survives product rename
  qty: number
  unit: ProductUnit
  priceAtOrder: number    // FROZEN snapshot — never changes after order placed
  subtotal: number        // qty × priceAtOrder
}

export interface Order {
  _id: string
  orderNumber: string     // e.g. "PV-2025-0042" — human readable
  clientType: ClientType
  clientId: string        // ref → users._id OR b2b_clients._id
  clientName: string      // denormalized for fast dashboard display
  clientPhone: string     // denormalized for WhatsApp share
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  deliveryAddress: string
  location?: GeoPoint     // required for local orders (geo-fence check)
  billUrl?: string        // Cloudinary PDF URL — set after bill is generated
  notes?: string
  createdAt: string
  updatedAt: string
}

// Shape returned by the dashboard order list (lightweight)
export interface OrderSummary {
  _id: string
  orderNumber: string
  clientType: ClientType
  clientName: string
  clientPhone: string
  totalAmount: number
  status: OrderStatus
  itemCount: number
  createdAt: string
}

// ── Price History ─────────────────────────────
// Written automatically every time prices are bulk-updated.
// Lets your dad answer "what was the tomato price last Tuesday?"

export interface PriceHistoryEntry {
  _id: string
  productId: string
  productName: string     // denormalized
  priceRetail: number
  priceBulk: number
  recordedAt: Date        // Date in DB — serialises to ISO string in API responses
  recordedBy: string      // admin user id
}

// ── Payment (schema ready — Razorpay later) ───

export interface Payment {
  _id: string
  orderId: string
  clientId: string
  clientType: ClientType
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transactionId?: string  // Razorpay txn ID — populated after payment
  paidAt?: string
  createdAt: string
}

// ── Geo ───────────────────────────────────────

export interface GeoPoint {
  lat: number
  lng: number
}

// ── API response wrappers ─────────────────────
// Every API endpoint returns one of these shapes.

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  code?: string           // e.g. "GEO_OUT_OF_RANGE" | "MIN_ORDER_NOT_MET"
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ── Auth ──────────────────────────────────────

export interface AuthTokenPayload {
  id: string
  role: UserRole | 'b2b' | 'admin'
  clientType: ClientType | 'admin'
}

export interface LoginResponse {
  token: string
  user: User | B2BClient
  role: 'customer' | 'b2b' | 'admin'
}

// ── Dashboard stats (for the summary cards) ──

export interface DashboardStats {
  totalOrdersToday: number
  totalRevenueToday: number
  pendingOrders: number
  localOrdersToday: number
  b2bOrdersToday: number
}