import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PersistStorage } from "zustand/middleware";
import { useState, useEffect } from "react";
import type { CartItem, Product, Order, User, Notification, CommissionTier, BadgeRequest, WalletTransaction, Voucher, CashbackOffer, CashbackTransaction, Review, RefundRequest } from "./types";
import { mockNotifications, products as mockProducts, categories, mockVouchers, cashbackOffers, mockOrders } from "./mock-data";

// SSR-safe storage that checks typeof window on EVERY call, so the server-side
// module evaluation never caches noopStorage into a closure.
const ssrStorage: PersistStorage<any> = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(name);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(name, JSON.stringify(value)); } catch {}
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(name);
  },
};

export interface SellerApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  gstin: string;
  category: string;
  address: string;
  description: string;
  bankAccount: string;
  ifsc: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  fromCustomer?: boolean;
}

interface SellerApplicationStore {
  applications: SellerApplication[];
  submit: (app: Omit<SellerApplication, "id" | "status" | "submittedAt">) => void;
  updateStatus: (id: string, status: "approved" | "rejected") => void;
}

export const useSellerApplicationStore = create<SellerApplicationStore>()(
  persist(
    (set) => ({
      applications: [],
      submit: (app) =>
        set((state) => ({
          applications: [
            ...state.applications,
            {
              ...app,
              id: `app_${Date.now()}`,
              status: "pending",
              submittedAt: new Date().toLocaleDateString("en-IN"),
            },
          ],
        })),
      updateStatus: (id, status) =>
        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
        })),
    }),
    { name: "seller-applications", storage: ssrStorage }
  )
);

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

interface WishlistStore {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  updateUser: (patch: Partial<User>) => void;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const existing = get().items.find((i) => i.product.id === product.id);
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          }));
        } else {
          set((state) => ({ items: [...state.items, { product, quantity }] }));
        }
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "cart-store", storage: ssrStorage }
  )
);

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        if (!get().isWishlisted(product.id)) {
          set((state) => ({ items: [...state.items, product] }));
        }
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((p) => p.id !== productId),
        }));
      },
      isWishlisted: (productId) => get().items.some((p) => p.id === productId),
    }),
    { name: "wishlist-store", storage: ssrStorage }
  )
);

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      login: (user, accessToken) => set({ user, isAuthenticated: true, accessToken }),
      logout: () => {
        if (typeof window !== "undefined") {
          fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        }
        set({ user: null, isAuthenticated: false, accessToken: null });
      },
      setAccessToken: (token) => set({ accessToken: token }),
      updateUser: (patch) => set((state) => ({ user: state.user ? { ...state.user, ...patch } : null })),
    }),
    {
      name: "auth-store",
      storage: ssrStorage,
      // accessToken is intentionally NOT persisted — lives in memory only
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

/** Call anywhere (outside React) to get Authorization header for API calls. */
export function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (n) =>
        set((state) => ({
          notifications: [
            {
              ...n,
              id: `notif_${Date.now()}`,
              read: false,
              createdAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
            },
            ...state.notifications,
          ],
        })),
      markRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: "notification-store-v2", storage: ssrStorage }
  )
);

/* ─── Wallet store ───────────────────────────────────────────── */
interface WalletStore {
  balance: number;
  transactions: WalletTransaction[];
  credit: (amount: number, description: string, orderId?: string, type?: WalletTransaction["type"]) => void;
  debit: (amount: number, description: string, orderId?: string, type?: WalletTransaction["type"]) => boolean;
  refundCancellation: (orderId: string, paid: number, status: "packed" | "shipped" | "out_for_delivery") => number;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      credit: (amount, description, orderId, type = "credit") =>
        set((state) => ({
          balance: state.balance + amount,
          transactions: [
            {
              id: `tx_${Date.now()}`,
              type,
              amount,
              description,
              orderId,
              createdAt: new Date().toISOString(),
            },
            ...state.transactions,
          ],
        })),
      debit: (amount, description, orderId, type = "debit") => {
        if (get().balance < amount) return false;
        set((state) => ({
          balance: state.balance - amount,
          transactions: [
            {
              id: `tx_${Date.now()}`,
              type,
              amount,
              description,
              orderId,
              createdAt: new Date().toISOString(),
            },
            ...state.transactions,
          ],
        }));
        return true;
      },
      // Zepto-style: if packed → 80% refund, shipped/OFD → 50% refund
      refundCancellation: (orderId, paid, status) => {
        const pct = status === "packed" ? 0.8 : 0.5;
        const refundAmt = Math.round(paid * pct);
        const deduction = paid - refundAmt;
        set((state) => ({
          balance: state.balance + refundAmt,
          transactions: [
            {
              id: `tx_${Date.now()}`,
              type: "cancellation_refund",
              amount: refundAmt,
              description: `Cancellation refund for #${orderId} (${Math.round(pct * 100)}% returned, ₹${deduction} deducted)`,
              orderId,
              createdAt: new Date().toISOString(),
            },
            ...state.transactions,
          ],
        }));
        return refundAmt;
      },
    }),
    { name: "wallet-store-v2", storage: ssrStorage }
  )
);

/* ─── Commission tiers (admin-configurable) ─────────────────── */
const DEFAULT_COMMISSION_TIERS: CommissionTier[] = [
  { id: "lf1", name: "Starter Listing", type: "listing_fee", condition: "Sellers with fewer than 500 products", minValue: 0, maxValue: 499, fee: 10, active: true },
  { id: "lf2", name: "Growth Listing", type: "listing_fee", condition: "Sellers with 500–999 products", minValue: 500, maxValue: 999, fee: 40, active: true },
  { id: "lf3", name: "Pro Listing", type: "listing_fee", condition: "Sellers with 1,000+ products", minValue: 1000, fee: 70, active: true },
  { id: "tc1", name: "Small Order", type: "transaction", condition: "Orders below ₹750", minValue: 0, maxValue: 749, fee: 15, active: true },
  { id: "tc2", name: "Standard Order", type: "transaction", condition: "Orders ₹750–₹1,999", minValue: 750, maxValue: 1999, fee: 30, active: true },
  { id: "tc3", name: "Large Order", type: "transaction", condition: "Orders ₹2,000 and above", minValue: 2000, fee: 100, active: true },
];

interface CommissionStore {
  tiers: CommissionTier[];
  updateFee: (id: string, fee: number) => void;
  toggleActive: (id: string) => void;
  resetDefaults: () => void;
}

export const useCommissionStore = create<CommissionStore>()(
  persist(
    (set) => ({
      tiers: DEFAULT_COMMISSION_TIERS,
      updateFee: (id, fee) =>
        set((state) => ({
          tiers: state.tiers.map((t) => t.id === id ? { ...t, fee } : t),
        })),
      toggleActive: (id) =>
        set((state) => ({
          tiers: state.tiers.map((t) => t.id === id ? { ...t, active: !t.active } : t),
        })),
      resetDefaults: () => set({ tiers: DEFAULT_COMMISSION_TIERS }),
    }),
    { name: "commission-tiers", storage: ssrStorage }
  )
);

/* ─── Verified badge requests ────────────────────────────────── */
interface BadgeStore {
  requests: BadgeRequest[];
  submit: (req: Omit<BadgeRequest, "id" | "status" | "appliedAt">) => void;
  updateStatus: (id: string, status: "approved" | "rejected") => void;
}

export const useBadgeStore = create<BadgeStore>()(
  persist(
    (set) => ({
      requests: [],
      submit: (req) =>
        set((state) => ({
          requests: [
            ...state.requests,
            {
              ...req,
              id: `badge_${Date.now()}`,
              status: "pending",
              appliedAt: new Date().toLocaleDateString("en-IN"),
            },
          ],
        })),
      updateStatus: (id, status) =>
        set((state) => ({
          requests: state.requests.map((r) => r.id === id ? { ...r, status } : r),
        })),
    }),
    { name: "badge-requests", storage: ssrStorage }
  )
);

export interface TrackingInfo {
  courier: string;
  trackingNumber: string;
  trackingUrl: string;
  updatedAt: string;
}

interface OrderTrackingStore {
  tracking: Record<string, TrackingInfo>;
  updateTracking: (orderId: string, info: Omit<TrackingInfo, "updatedAt">) => void;
  clearTracking: (orderId: string) => void;
}

export const useOrderTrackingStore = create<OrderTrackingStore>()(
  persist(
    (set) => ({
      tracking: {},
      updateTracking: (orderId, info) =>
        set((state) => ({
          tracking: {
            ...state.tracking,
            [orderId]: { ...info, updatedAt: new Date().toISOString() },
          },
        })),
      clearTracking: (orderId) =>
        set((state) => {
          const { [orderId]: _, ...rest } = state.tracking;
          return { tracking: rest };
        }),
    }),
    { name: "order-tracking", storage: ssrStorage }
  )
);

/* ─── Order store ────────────────────────────────────────────── */
interface OrderStore {
  orders: Order[];
  loading: boolean;
  /** Fetch orders from the API, filtered by customerId or sellerId */
  fetchOrders: (filter?: { customerId?: string; sellerId?: string; status?: string }) => Promise<void>;
  createOrder: (data: Omit<Order, "id" | "createdAt" | "tracking" | "status" | "estimatedDelivery">) => Promise<Order>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      loading: false,
      fetchOrders: async (filter) => {
        // No backend configured — orders live only in this store (persisted via localStorage).
        // Don't fetch; just surface whatever createOrder already saved.
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          set({ loading: false });
          return;
        }
        set({ loading: true });
        try {
          const params = new URLSearchParams();
          if (filter?.customerId) params.set("customerId", filter.customerId);
          if (filter?.sellerId) params.set("sellerId", filter.sellerId);
          if (filter?.status) params.set("status", filter.status);
          const res = await fetch(`/api/orders?${params}`);
          if (res.ok) {
            const fetched: Order[] = await res.json();
            set((state) => {
              const fetchedIds = new Set(fetched.map((o) => o.id));
              const localOnly = state.orders.filter((o) => !fetchedIds.has(o.id));
              return { orders: [...localOnly, ...fetched], loading: false };
            });
          } else {
            set({ loading: false });
          }
        } catch {
          set({ loading: false });
        }
      },
      createOrder: async (data) => {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          // Offline fallback — build order locally
          const order: Order = {
            ...data,
            id: `ORD-${Date.now()}`,
            status: "placed",
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
            createdAt: new Date().toLocaleDateString("en-IN"),
            tracking: [{ status: "placed", location: "Online", timestamp: new Date().toLocaleString("en-IN"), description: "Order placed successfully" }],
          };
          set((state) => ({ orders: [order, ...state.orders] }));
          return order;
        }
        const order = await res.json();
        set((state) => ({ orders: [order, ...state.orders] }));
        return order;
      },
      updateOrderStatus: async (id, status) => {
        // Optimistic update
        set((state) => ({
          orders: state.orders.map((o) => o.id === id ? { ...o, status } : o),
        }));
        try {
          await fetch(`/api/orders/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
        } catch {
          // Optimistic update already reflected in UI; log silently
        }
      },
    }),
    { name: "order-store", storage: ssrStorage }
  )
);

/* ─── Product store ──────────────────────────────────────────── */
interface ProductStore {
  products: Product[];
  addProduct: (product: Omit<Product, "id" | "createdAt" | "rating" | "reviewCount" | "promoted" | "featured">) => Promise<void>;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  /** Sync products from the API (replaces localStorage cache with live data) */
  fetchProducts: (filter?: { sellerId?: string; category?: string }) => Promise<void>;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: mockProducts,
      addProduct: async (product) => {
        const newProduct = {
          ...product,
          id: `p_${Date.now()}`,
          createdAt: new Date().toISOString(),
          rating: 0,
          reviewCount: 0,
          promoted: false,
          featured: false,
        };
        // Add to local state immediately (optimistic)
        set((state) => ({ products: [newProduct, ...state.products] }));
        // Persist to API
        try {
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newProduct),
          });
          if (res.ok) {
            const saved = await res.json();
            // Replace optimistic entry with the API-assigned record if ID differs
            if (saved.id && saved.id !== newProduct.id) {
              set((state) => ({
                products: state.products.map((p) => p.id === newProduct.id ? saved : p),
              }));
            }
          }
        } catch { /* keep optimistic entry */ }
      },
      updateProduct: (id, patch) =>
        set((state) => ({
          products: state.products.map((p) => p.id === id ? { ...p, ...patch } : p),
        })),
      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
      fetchProducts: async (filter) => {
        try {
          const params = new URLSearchParams();
          if (filter?.sellerId) params.set("sellerId", filter.sellerId);
          if (filter?.category) params.set("category", filter.category);
          const res = await fetch(`/api/products?${params}`);
          if (res.ok) {
            const fetched = await res.json();
            if (Array.isArray(fetched) && fetched.length > 0) {
              set((state) => {
                // Preserve locally-added products (id starts with "p_") not yet in the API response
                const apiIds = new Set(fetched.map((p: Product) => p.id));
                const localOnly = state.products.filter((p) => p.id.startsWith("p_") && !apiIds.has(p.id));
                return { products: [...localOnly, ...fetched] };
              });
            }
          }
        } catch {
          // Keep existing products on network failure
        }
      },
    }),
    {
      name: "product-store",
      storage: ssrStorage,
      skipHydration: true,
      version: 1,
      migrate: (persisted: any) => {
        const fixed = (persisted.products ?? []).map((p: any) => {
          if (categories.some((c) => c.id === p.categoryId)) return p;
          const match = categories.find(
            (c) => c.slug === p.categoryId || (p.category && c.name.toLowerCase() === p.category.toLowerCase())
          );
          return match ? { ...p, categoryId: match.id } : p;
        });
        return { ...persisted, products: fixed };
      },
    }
  )
);

// Cross-tab real-time product sync via BroadcastChannel.
// BroadcastChannel is more reliable than the storage event because it pushes
// the exact products array to other tabs without requiring localStorage to be
// written/read successfully first.
if (typeof window !== "undefined") {
  let receivingBroadcast = false;
  const bc = new BroadcastChannel("bigpool-products");

  bc.onmessage = (e: MessageEvent) => {
    if (e.data?.type === "products" && Array.isArray(e.data.products)) {
      receivingBroadcast = true;
      useProductStore.setState({ products: e.data.products });
      receivingBroadcast = false;
    }
  };

  let lastProducts = useProductStore.getState().products;
  useProductStore.subscribe((state) => {
    if (!receivingBroadcast && state.products !== lastProducts) {
      lastProducts = state.products;
      try { bc.postMessage({ type: "products", products: state.products }); } catch {}
    }
  });
}

// ─── Voucher store ───────────────────────────────────────────────────────────
interface VoucherStore {
  vouchers: Voucher[];
  /** Voucher currently applied at checkout (one at a time) */
  appliedVoucher: { voucher: Voucher; discount: number } | null;
  applyVoucher: (code: string, orderTotal: number, categoryIds?: string[]) => { success: boolean; message: string };
  removeAppliedVoucher: () => void;
  markUsed: (code: string, userId: string) => void;
  // Admin operations
  addVoucher: (v: Omit<Voucher, "id" | "usedCount" | "usedBy" | "createdAt">) => void;
  updateVoucher: (id: string, patch: Partial<Voucher>) => void;
  deleteVoucher: (id: string) => void;
  /** Sync vouchers from the API */
  fetchVouchers: () => Promise<void>;
}

export const useVoucherStore = create<VoucherStore>()(
  persist(
    (set, get) => ({
      vouchers: mockVouchers,
      appliedVoucher: null,

      applyVoucher: (code, orderTotal, categoryIds = []) => {
        const voucher = get().vouchers.find(
          (v) => v.code.toUpperCase() === code.toUpperCase() && v.active
        );
        if (!voucher) return { success: false, message: "Invalid or expired voucher code." };
        if (voucher.createdBy === "mock") return { success: false, message: "This is a demo coupon and cannot be applied to real orders." };

        const now = new Date();
        if (new Date(voucher.validUntil) < now)
          return { success: false, message: "This voucher has expired." };
        if (voucher.usedCount >= voucher.maxUses)
          return { success: false, message: "This voucher has reached its usage limit." };
        if (orderTotal < voucher.minOrderValue)
          return { success: false, message: `Minimum order of ₹${voucher.minOrderValue.toLocaleString()} required for this voucher.` };

        // Category restriction check
        if (voucher.categories?.length && categoryIds.length) {
          const overlap = voucher.categories.some((c) => categoryIds.includes(c));
          if (!overlap)
            return { success: false, message: "This voucher doesn't apply to your cart items." };
        }

        let discount = 0;
        if (voucher.type === "percentage") {
          discount = Math.floor((orderTotal * voucher.value) / 100);
          if (voucher.maxDiscount) discount = Math.min(discount, voucher.maxDiscount);
        } else if (voucher.type === "flat") {
          discount = voucher.value;
        } else if (voucher.type === "free_delivery") {
          discount = 40; // flat delivery fee
        }
        discount = Math.min(discount, orderTotal);

        set({ appliedVoucher: { voucher, discount } });
        return { success: true, message: `Voucher applied! You save ₹${discount.toLocaleString()}.` };
      },

      removeAppliedVoucher: () => set({ appliedVoucher: null }),

      markUsed: (code, userId) =>
        set((state) => ({
          vouchers: state.vouchers.map((v) =>
            v.code.toUpperCase() === code.toUpperCase()
              ? { ...v, usedCount: v.usedCount + 1, usedBy: [...v.usedBy, userId] }
              : v
          ),
          appliedVoucher: null,
        })),

      addVoucher: (v) =>
        set((state) => ({
          vouchers: [
            {
              ...v,
              id: `v_${Date.now()}`,
              usedCount: 0,
              usedBy: [],
              createdAt: new Date().toISOString(),
            },
            ...state.vouchers,
          ],
        })),

      updateVoucher: (id, patch) =>
        set((state) => ({
          vouchers: state.vouchers.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        })),

      deleteVoucher: (id) =>
        set((state) => ({
          vouchers: state.vouchers.filter((v) => v.id !== id),
        })),

      fetchVouchers: async () => {
        try {
          const res = await fetch("/api/vouchers");
          if (res.ok) {
            const vouchers = await res.json();
            if (Array.isArray(vouchers)) set({ vouchers });
          }
        } catch {
          // Keep existing vouchers on network failure
        }
      },
    }),
    { name: "voucher-store", storage: ssrStorage }
  )
);

// ─── Cashback store ──────────────────────────────────────────────────────────
interface CashbackStore {
  offers: CashbackOffer[];
  transactions: CashbackTransaction[];
  /** Calculate and store a pending cashback for an order */
  earnCashback: (orderId: string, orderTotal: number, categoryIds?: string[]) => number;
  /** Credit all pending cashbacks for an order (call on delivery) */
  creditForOrder: (orderId: string) => void;
  /** Expire pending cashbacks for a cancelled order */
  expireForOrder: (orderId: string) => void;
  pendingTotal: () => number;
  /** Sync cashback offers from the API */
  fetchOffers: () => Promise<void>;
}

export const useCashbackStore = create<CashbackStore>()(
  persist(
    (set, get) => ({
      offers: cashbackOffers,
      transactions: [],

      earnCashback: (orderId, orderTotal, categoryIds = []) => {
        const now = new Date();
        // Find best applicable offer
        const applicable = get().offers.filter((o) => {
          if (!o.active) return false;
          if (new Date(o.validUntil) < now) return false;
          if (orderTotal < o.minOrderValue) return false;
          if (o.categories?.length && categoryIds.length) {
            return o.categories.some((c) => categoryIds.includes(c));
          }
          return !o.categories?.length; // global offers apply when no category filter
        });
        if (!applicable.length) return 0;

        const best = applicable.reduce((a, b) => {
          const aAmt = Math.min((orderTotal * a.percentage) / 100, a.maxAmount);
          const bAmt = Math.min((orderTotal * b.percentage) / 100, b.maxAmount);
          return aAmt >= bAmt ? a : b;
        });

        const amount = Math.floor(
          Math.min((orderTotal * best.percentage) / 100, best.maxAmount)
        );
        if (amount <= 0) return 0;

        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        set((state) => ({
          transactions: [
            {
              id: `cb_${Date.now()}`,
              orderId,
              amount,
              percentage: best.percentage,
              status: "pending" as const,
              expiresAt,
              createdAt: new Date().toISOString(),
            },
            ...state.transactions,
          ],
        }));
        return amount;
      },

      creditForOrder: (orderId) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.orderId === orderId && t.status === "pending"
              ? { ...t, status: "credited" as const, creditedAt: new Date().toISOString() }
              : t
          ),
        })),

      expireForOrder: (orderId) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.orderId === orderId && t.status === "pending"
              ? { ...t, status: "expired" as const }
              : t
          ),
        })),

      pendingTotal: () =>
        get().transactions
          .filter((t) => t.status === "pending")
          .reduce((s, t) => s + t.amount, 0),

      fetchOffers: async () => {
        try {
          const res = await fetch("/api/cashback/offers");
          if (res.ok) {
            const offers = await res.json();
            if (Array.isArray(offers)) set({ offers });
          }
        } catch {
          // Keep existing offers on network failure
        }
      },
    }),
    { name: "cashback-store", storage: ssrStorage }
  )
);

/* ─── Local Review Store (persists reviews when no Supabase) ──── */
interface ReviewReply {
  vendorId: string;
  vendorName: string;
  text: string;
  createdAt: string;
}

interface LocalReview extends Review {
  reply?: ReviewReply;
}

interface ReviewStore {
  reviews: LocalReview[];
  addReview: (review: Review) => void;
  addReply: (reviewId: string, reply: ReviewReply) => void;
  getForProduct: (productId: string) => LocalReview[];
}

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      reviews: [],
      addReview: (review) =>
        set((state) => ({
          reviews: [
            { ...review },
            ...state.reviews.filter(
              (r) => !(r.productId === review.productId && r.userId === review.userId)
            ),
          ],
        })),
      addReply: (reviewId, reply) =>
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === reviewId ? { ...r, reply } : r
          ),
        })),
      getForProduct: (productId) =>
        get().reviews.filter((r) => r.productId === productId),
    }),
    { name: "review-store", storage: ssrStorage }
  )
);

/* ─── Refund Store ───────────────────────────────────────────────────────── */
interface RefundStore {
  refunds: RefundRequest[];
  addRefund: (refund: RefundRequest) => void;
  updateRefund: (id: string, patch: Partial<RefundRequest>) => void;
  getForCustomer: (customerId: string) => RefundRequest[];
}

export const useRefundStore = create<RefundStore>()(
  persist(
    (set, get) => ({
      refunds: [],
      addRefund: (refund) =>
        set((state) => ({
          refunds: [refund, ...state.refunds.filter((r) => r.id !== refund.id)],
        })),
      updateRefund: (id, patch) =>
        set((state) => ({
          refunds: state.refunds.map((r) => r.id === id ? { ...r, ...patch } : r),
        })),
      getForCustomer: (customerId) =>
        get().refunds.filter((r) => r.customerId === customerId),
    }),
    { name: "refund-store", storage: ssrStorage }
  )
);

/* ─── Recently Viewed Store ──────────────────────────────────────────────── */
interface RecentlyViewedStore {
  items: Product[];
  addItem: (product: Product) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) =>
        set((state) => ({
          items: [product, ...state.items.filter((p) => p.id !== product.id)].slice(0, 12),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "recently-viewed", storage: ssrStorage }
  )
);

// Returns true after the first client-side render. By that point Zustand
// persist has already read from localStorage (toThenable is synchronous for
// localStorage), so gating redirects on this avoids premature redirects.
//
// Uses a module-level flag so once ANY component has hydrated in this session,
// all future renders start as `true` — eliminating the blank-frame flash on
// page navigation within the same SPA session.
let _hydrated = false;

export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(_hydrated);
  useEffect(() => {
    if (!_hydrated) {
      _hydrated = true;
      setHydrated(true);
    }
  }, []);
  return hydrated;
}
