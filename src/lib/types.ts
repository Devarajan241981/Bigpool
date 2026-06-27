export type UserRole = "customer" | "seller" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: Address;
  createdAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Seller extends User {
  role: "seller";
  businessName: string;
  gstin?: string;
  verified: boolean;
  status: "pending" | "approved" | "rejected";
  products: string[];
  rating: number;
  totalSales: number;
  promotionRequests?: PromotionRequest[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  images: string[];
  category: string;
  categoryId: string;
  sellerId: string;
  sellerName: string;
  rating: number;
  reviewCount: number;
  stock: number;
  tags: string[];
  specifications: Record<string, string>;
  discount: number;
  featured: boolean;
  promoted: boolean;
  isDemo?: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: "paid" | "pending" | "failed";
  paymentMethod?: string;
  voucherCode?: string;
  voucherDiscount?: number;
  cashbackAmount?: number;
  address: Address;
  createdAt: string;
  estimatedDelivery: string;
  tracking: TrackingEvent[];
}

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned";

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "processed";
  amount: number;
  refundMethod?: "wallet" | "bank";
  bankDetails?: { accountNumber: string; ifsc: string; accountName: string };
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "order" | "promotion" | "refund" | "system" | "seller";
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface PromotionRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  productId?: string;
  productName?: string;
  type: "banner" | "featured" | "boost" | "ad" | "sale";
  budget: number;
  duration: number;
  status: "pending" | "approved" | "rejected";
  message: string;
  couponCode?: string;
  createdAt: string;
}

export type WalletTxType = "credit" | "debit" | "refund" | "cashback" | "cancellation_refund" | "withdrawal";

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  amount: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface CommissionTier {
  id: string;
  name: string;
  type: "listing_fee" | "transaction";
  condition: string;
  minValue: number;
  maxValue?: number;
  fee: number;
  active: boolean;
}

export interface BadgeRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  businessName: string;
  productsSold: number;
  razorpayPaymentId?: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  active: boolean;
}

// ─── Vouchers ────────────────────────────────────────────────────────────────

export type VoucherType = "percentage" | "flat" | "free_delivery";

export interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  /** Percentage (1-100) for "percentage" type, or flat INR amount for "flat/free_delivery" */
  value: number;
  minOrderValue: number;
  /** Cap for percentage vouchers (max rupee discount) */
  maxDiscount?: number;
  validUntil: string;
  maxUses: number;
  usedCount: number;
  /** User IDs that have already used this voucher */
  usedBy: string[];
  /** If set, voucher only applies to these category IDs */
  categories?: string[];
  description: string;
  active: boolean;
  createdAt: string;
  /** "mock" = demo placeholder, undefined/sellerId = real vendor coupon */
  createdBy?: string;
}

// ─── Cashback ─────────────────────────────────────────────────────────────────

export interface CashbackOffer {
  id: string;
  percentage: number; // e.g. 5 means 5%
  maxAmount: number;  // rupee cap
  minOrderValue: number;
  validUntil: string;
  description: string;
  /** If set, offer applies only to these category IDs */
  categories?: string[];
  active: boolean;
}

export type CashbackStatus = "pending" | "credited" | "expired";

export interface CashbackTransaction {
  id: string;
  orderId: string;
  amount: number;
  percentage: number;
  status: CashbackStatus;
  /** ISO string — when it will/was credited */
  creditedAt?: string;
  /** Pending cashback expires if order is cancelled */
  expiresAt: string;
  createdAt: string;
}

// ─── Review (extended) ────────────────────────────────────────────────────────

export interface ReviewVote {
  userId: string;
  helpful: boolean;
}
