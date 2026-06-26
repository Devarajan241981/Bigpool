import type {
  Product,
  Order,
  Voucher,
  CashbackOffer,
  Review,
  User,
  Category,
  RefundRequest,
  PromotionRequest,
  Notification,
} from "./types";

type FetchOpts = RequestInit & { params?: Record<string, string> };

async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { params, ...init } = opts;
  const qs = params && Object.keys(params).length
    ? `?${new URLSearchParams(params)}`
    : "";
  const res = await fetch(`${path}${qs}`, {
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  products: {
    list: (p?: Record<string, string>) =>
      apiFetch<Product[]>("/api/products", { params: p }),
    get: (id: string) => apiFetch<Product>(`/api/products/${id}`),
    create: (data: unknown) =>
      apiFetch<Product>("/api/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      apiFetch<Product>(`/api/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/api/products/${id}`, { method: "DELETE" }),
  },

  categories: {
    list: () => apiFetch<Category[]>("/api/categories"),
  },

  orders: {
    list: (p?: Record<string, string>) =>
      apiFetch<Order[]>("/api/orders", { params: p }),
    get: (id: string) => apiFetch<Order>(`/api/orders/${id}`),
    create: (data: unknown) =>
      apiFetch<Order>("/api/orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      apiFetch<Order>(`/api/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  vouchers: {
    list: () => apiFetch<Voucher[]>("/api/vouchers"),
    create: (data: unknown) =>
      apiFetch<Voucher>("/api/vouchers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      apiFetch<Voucher>(`/api/vouchers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/api/vouchers/${id}`, { method: "DELETE" }),
    validate: (code: string, orderTotal: number, categoryIds?: string[]) =>
      apiFetch<{ discount: number; voucher: Voucher }>("/api/vouchers/validate", {
        method: "POST",
        body: JSON.stringify({ code, orderTotal, categoryIds }),
      }),
  },

  cashback: {
    offers: () => apiFetch<CashbackOffer[]>("/api/cashback/offers"),
    earn: (data: unknown) =>
      apiFetch<{ amount: number }>("/api/cashback/earn", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  reviews: {
    list: (productId: string) =>
      apiFetch<Review[]>("/api/reviews", { params: { productId } }),
    create: (data: unknown) =>
      apiFetch<Review>("/api/reviews", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    signup: (data: unknown) =>
      apiFetch<{ user: User }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  sellers: {
    list: () => apiFetch<User[]>("/api/sellers"),
    update: (id: string, data: unknown) =>
      apiFetch<User>(`/api/sellers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  refunds: {
    list: (p?: Record<string, string>) =>
      apiFetch<RefundRequest[]>("/api/refunds", { params: p }),
    create: (data: unknown) =>
      apiFetch<RefundRequest>("/api/refunds", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      apiFetch<RefundRequest>(`/api/refunds/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  promotions: {
    list: (p?: Record<string, string>) =>
      apiFetch<PromotionRequest[]>("/api/promotions", { params: p }),
    create: (data: unknown) =>
      apiFetch<PromotionRequest>("/api/promotions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      apiFetch<PromotionRequest>(`/api/promotions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  notifications: {
    list: (userId: string) =>
      apiFetch<Notification[]>("/api/notifications", { params: { userId } }),
  },
};
