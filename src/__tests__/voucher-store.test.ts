import { describe, it, expect, beforeEach } from "vitest";
import { useVoucherStore } from "@/lib/store";
import { mockVouchers } from "@/lib/mock-data";

// Reset the store before each test
beforeEach(() => {
  useVoucherStore.setState({ vouchers: mockVouchers, appliedVoucher: null });
});

describe("useVoucherStore", () => {
  describe("applyVoucher", () => {
    it("applies a valid flat voucher", () => {
      const result = useVoucherStore.getState().applyVoucher("WELCOME200", 1500);
      expect(result.success).toBe(true);
      expect(useVoucherStore.getState().appliedVoucher?.discount).toBe(200);
    });

    it("applies a percentage voucher and caps correctly", () => {
      // SAVE10: 10% off, cap ₹500, min ₹500
      const result = useVoucherStore.getState().applyVoucher("SAVE10", 6000);
      expect(result.success).toBe(true);
      // 10% of 6000 = 600, capped at 500
      expect(useVoucherStore.getState().appliedVoucher?.discount).toBe(500);
    });

    it("applies percentage correctly under cap", () => {
      const result = useVoucherStore.getState().applyVoucher("SAVE10", 1000);
      expect(result.success).toBe(true);
      expect(useVoucherStore.getState().appliedVoucher?.discount).toBe(100);
    });

    it("rejects unknown code", () => {
      const result = useVoucherStore.getState().applyVoucher("INVALID", 1000);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/invalid/i);
    });

    it("rejects when order is below minimum", () => {
      const result = useVoucherStore.getState().applyVoucher("WELCOME200", 500);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/minimum/i);
    });

    it("rejects expired voucher", () => {
      // FLAT500 is inactive (active: false)
      const result = useVoucherStore.getState().applyVoucher("FLAT500", 3000);
      expect(result.success).toBe(false);
    });

    it("rejects when usage limit is reached", () => {
      // FLAT500 has usedCount = maxUses = 500
      const result = useVoucherStore.getState().applyVoucher("FLAT500", 3000);
      expect(result.success).toBe(false);
    });

    it("is case-insensitive", () => {
      const result = useVoucherStore.getState().applyVoucher("welcome200", 1500);
      expect(result.success).toBe(true);
    });

    it("free_delivery type gives delivery discount (40)", () => {
      const result = useVoucherStore.getState().applyVoucher("FREEDEL", 200);
      expect(result.success).toBe(true);
      expect(useVoucherStore.getState().appliedVoucher?.discount).toBe(40);
    });
  });

  describe("removeAppliedVoucher", () => {
    it("clears the applied voucher", () => {
      useVoucherStore.getState().applyVoucher("WELCOME200", 1500);
      useVoucherStore.getState().removeAppliedVoucher();
      expect(useVoucherStore.getState().appliedVoucher).toBeNull();
    });
  });

  describe("markUsed", () => {
    it("increments usedCount and adds userId", () => {
      useVoucherStore.getState().markUsed("WELCOME200", "user123");
      const v = useVoucherStore.getState().vouchers.find((v) => v.code === "WELCOME200")!;
      expect(v.usedCount).toBe(413); // 412 + 1
      expect(v.usedBy).toContain("user123");
    });

    it("clears appliedVoucher after marking used", () => {
      useVoucherStore.getState().applyVoucher("WELCOME200", 1500);
      useVoucherStore.getState().markUsed("WELCOME200", "user1");
      expect(useVoucherStore.getState().appliedVoucher).toBeNull();
    });
  });

  describe("addVoucher", () => {
    it("adds a new voucher to the list", () => {
      const before = useVoucherStore.getState().vouchers.length;
      useVoucherStore.getState().addVoucher({
        code: "NEWCODE", type: "flat", value: 100,
        minOrderValue: 500, validUntil: "2027-01-01T00:00:00Z",
        maxUses: 100, description: "Test", active: true,
      });
      expect(useVoucherStore.getState().vouchers.length).toBe(before + 1);
      expect(useVoucherStore.getState().vouchers[0].code).toBe("NEWCODE");
    });
  });

  describe("deleteVoucher", () => {
    it("removes the voucher by id", () => {
      const { id } = useVoucherStore.getState().vouchers[0];
      const before = useVoucherStore.getState().vouchers.length;
      useVoucherStore.getState().deleteVoucher(id);
      expect(useVoucherStore.getState().vouchers.length).toBe(before - 1);
      expect(useVoucherStore.getState().vouchers.find((v) => v.id === id)).toBeUndefined();
    });
  });
});
