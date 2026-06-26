import { describe, it, expect, beforeEach } from "vitest";
import { useProductStore } from "@/lib/store";
import { products as mockProducts } from "@/lib/mock-data";
import type { Product } from "@/lib/types";

const testProductBase: Omit<Product, "id" | "createdAt" | "rating" | "reviewCount" | "promoted" | "featured"> = {
  name: "Test Product",
  description: "A description",
  price: 999,
  originalPrice: 1999,
  images: ["https://example.com/img.jpg"],
  category: "Electronics",
  categoryId: "1",
  sellerId: "s_test",
  sellerName: "Test Seller",
  stock: 10,
  tags: ["test"],
  specifications: {},
  discount: 50,
};

beforeEach(() => {
  useProductStore.setState({ products: [...mockProducts] });
});

describe("useProductStore", () => {
  describe("addProduct", () => {
    it("prepends a new product with auto-generated fields", () => {
      const before = useProductStore.getState().products.length;
      useProductStore.getState().addProduct(testProductBase);
      const products = useProductStore.getState().products;
      expect(products.length).toBe(before + 1);
      // Prepended = first in array
      expect(products[0].name).toBe("Test Product");
      expect(products[0].id).toMatch(/^p_/);
      expect(products[0].rating).toBe(0);
      expect(products[0].featured).toBe(false);
    });
  });

  describe("updateProduct", () => {
    it("updates only the specified fields", () => {
      const { id } = useProductStore.getState().products[0];
      useProductStore.getState().updateProduct(id, { price: 1, stock: 999 });
      const p = useProductStore.getState().products.find((p) => p.id === id)!;
      expect(p.price).toBe(1);
      expect(p.stock).toBe(999);
      expect(p.name).toBe(mockProducts[0].name); // unchanged
    });

    it("does not modify other products", () => {
      const [first, second] = useProductStore.getState().products;
      useProductStore.getState().updateProduct(first.id, { price: 1 });
      const updated = useProductStore.getState().products.find((p) => p.id === second.id)!;
      expect(updated.price).toBe(second.price); // unchanged
    });
  });

  describe("deleteProduct", () => {
    it("removes the product by id", () => {
      const { id } = useProductStore.getState().products[0];
      const before = useProductStore.getState().products.length;
      useProductStore.getState().deleteProduct(id);
      expect(useProductStore.getState().products.length).toBe(before - 1);
      expect(useProductStore.getState().products.find((p) => p.id === id)).toBeUndefined();
    });
  });

  describe("initial state", () => {
    it("loads with 12 mock products", () => {
      expect(useProductStore.getState().products.length).toBe(12);
    });

    it("all products have required fields", () => {
      useProductStore.getState().products.forEach((p) => {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.price).toBeGreaterThan(0);
        expect(p.categoryId).toBeTruthy();
        expect(Array.isArray(p.images)).toBe(true);
        expect(p.images.length).toBeGreaterThan(0);
      });
    });
  });
});
