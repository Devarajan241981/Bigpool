import { describe, it, expect, beforeEach } from "vitest";
import { useCashbackStore } from "@/lib/store";
import { cashbackOffers } from "@/lib/mock-data";

beforeEach(() => {
  useCashbackStore.setState({ offers: cashbackOffers, transactions: [] });
});

describe("useCashbackStore", () => {
  describe("earnCashback", () => {
    it("calculates 5% cashback on a general order", () => {
      const earned = useCashbackStore.getState().earnCashback("order1", 1000);
      expect(earned).toBe(50); // 5% of 1000
    });

    it("caps cashback at maxAmount", () => {
      const earned = useCashbackStore.getState().earnCashback("order2", 20000);
      // 5% of 20000 = 1000, but cap is 500
      expect(earned).toBe(500);
    });

    it("adds a pending transaction", () => {
      useCashbackStore.getState().earnCashback("order3", 2000);
      const txs = useCashbackStore.getState().transactions;
      expect(txs.length).toBe(1);
      expect(txs[0].orderId).toBe("order3");
      expect(txs[0].status).toBe("pending");
    });

    it("returns 0 when order below minOrderValue for category offer", () => {
      // Electronics offer (cb2): min 2000, categories: ["1"]
      const earned = useCashbackStore.getState().earnCashback("order4", 500, ["1"]);
      // Falls back to global 5% offer (min 0, no category)
      expect(earned).toBe(25); // 5% of 500
    });

    it("picks best (highest) applicable cashback offer", () => {
      // For an electronics order of 3000, both cb1 (5%, cap 500) and cb2 (10%, cap 1000) apply
      // cb1: 5% of 3000 = 150, cb2: 10% of 3000 = 300. Best = cb2 = 300
      const earned = useCashbackStore.getState().earnCashback("order5", 3000, ["1"]);
      expect(earned).toBe(300);
    });
  });

  describe("creditForOrder", () => {
    it("marks pending transactions as credited", () => {
      useCashbackStore.getState().earnCashback("order6", 1000);
      useCashbackStore.getState().creditForOrder("order6");
      const tx = useCashbackStore.getState().transactions.find((t) => t.orderId === "order6");
      expect(tx?.status).toBe("credited");
      expect(tx?.creditedAt).toBeDefined();
    });
  });

  describe("expireForOrder", () => {
    it("marks pending transactions as expired on cancellation", () => {
      useCashbackStore.getState().earnCashback("order7", 1000);
      useCashbackStore.getState().expireForOrder("order7");
      const tx = useCashbackStore.getState().transactions.find((t) => t.orderId === "order7");
      expect(tx?.status).toBe("expired");
    });
  });

  describe("pendingTotal", () => {
    it("sums all pending cashback amounts", () => {
      useCashbackStore.getState().earnCashback("orderA", 1000); // 50
      useCashbackStore.getState().earnCashback("orderB", 2000); // 100
      expect(useCashbackStore.getState().pendingTotal()).toBe(150);
    });

    it("excludes credited and expired transactions", () => {
      useCashbackStore.getState().earnCashback("orderC", 1000); // 50
      useCashbackStore.getState().creditForOrder("orderC");
      expect(useCashbackStore.getState().pendingTotal()).toBe(0);
    });
  });
});
