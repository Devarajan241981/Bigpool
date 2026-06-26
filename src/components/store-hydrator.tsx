"use client";

import { useEffect } from "react";
import { useProductStore } from "@/lib/store";

export default function StoreHydrator() {
  useEffect(() => {
    const raw = localStorage.getItem("product-store");
    console.log("[StoreHydrator] product-store in localStorage:", raw ? JSON.parse(raw).state?.products?.length + " products" : "EMPTY");
    useProductStore.persist.rehydrate();
  }, []);
  return null;
}
