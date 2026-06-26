import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/lib/store";
import type { Product } from "@/lib/types";

const mockProduct: Product = {
  id: "test-p1",
  name: "Test Product",
  description: "A test product",
  price: 999,
  originalPrice: 1499,
  images: ["https://example.com/img.jpg"],
  category: "Electronics",
  categoryId: "1",
  sellerId: "s1",
  sellerName: "Test Seller",
  rating: 4.5,
  reviewCount: 100,
  stock: 50,
  tags: ["test"],
  specifications: {},
  discount: 33,
  featured: false,
  promoted: false,
  createdAt: new Date().toISOString(),
};

const mockProduct2: Product = { ...mockProduct, id: "test-p2", name: "Product 2", price: 499 };

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("useCartStore", () => {
  describe("addItem", () => {
    it("adds a new item to cart", () => {
      useCartStore.getState().addItem(mockProduct);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });

    it("increments quantity for existing item", () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].quantity).toBe(2);
    });

    it("adds with custom quantity", () => {
      useCartStore.getState().addItem(mockProduct, 3);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });
  });

  describe("removeItem", () => {
    it("removes an item from cart", () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().removeItem("test-p1");
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("only removes the specified item", () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      useCartStore.getState().removeItem("test-p1");
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].product.id).toBe("test-p2");
    });
  });

  describe("updateQuantity", () => {
    it("updates item quantity", () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity("test-p1", 5);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it("removes item when quantity set to 0", () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity("test-p1", 0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe("total", () => {
    it("calculates total correctly", () => {
      useCartStore.getState().addItem(mockProduct, 2); // 2 × 999 = 1998
      useCartStore.getState().addItem(mockProduct2, 1); // 1 × 499 = 499
      expect(useCartStore.getState().total()).toBe(2497);
    });

    it("returns 0 for empty cart", () => {
      expect(useCartStore.getState().total()).toBe(0);
    });
  });

  describe("itemCount", () => {
    it("counts total item quantities", () => {
      useCartStore.getState().addItem(mockProduct, 2);
      useCartStore.getState().addItem(mockProduct2, 3);
      expect(useCartStore.getState().itemCount()).toBe(5);
    });
  });

  describe("clearCart", () => {
    it("empties the cart", () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      useCartStore.getState().clearCart();
      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().total()).toBe(0);
    });
  });
});
