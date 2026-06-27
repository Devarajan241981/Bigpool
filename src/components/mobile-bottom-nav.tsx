"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingCart, User } from "lucide-react";
import { useCartStore, useHasHydrated } from "@/lib/store";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const hasHydrated = useHasHydrated();
  const { items } = useCartStore();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/customer/search", icon: Search, label: "Search" },
    { href: "/customer/cart", icon: ShoppingCart, label: "Cart", badge: hasHydrated ? cartCount : 0 },
    { href: "/customer/profile", icon: User, label: "Profile" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-4 h-16">
        {tabs.map(({ href, icon: Icon, label, badge }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                active ? "text-[#0d9488]" : "text-gray-500"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#0d9488] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-[#0d9488]" : "text-gray-500"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
