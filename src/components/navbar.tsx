"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Heart, Search, User, Bell, Menu, X,
  ChevronDown, LogOut, Package, RotateCcw, Settings,
  Store, Shield, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore, useAuthStore, useNotificationStore, useWishlistStore, useWalletStore, useProductStore, useRecentlyViewedStore, useHasHydrated } from "@/lib/store";
import { categories } from "@/lib/mock-data";
import ThemeToggle from "@/components/theme-toggle";

export default function Navbar() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { products } = useProductStore();
  const { items: recentlyViewed } = useRecentlyViewedStore();

  const suggestions = search.trim().length >= 2
    ? products
        .filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase()) ||
          p.sellerName?.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const hasHydrated = useHasHydrated();
  const { items } = useCartStore();
  const { items: wishlist } = useWishlistStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { balance } = useWalletStore();
  const { notifications, markAllRead, unreadCount } = useNotificationStore();

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const myNotifications = notifications.filter((n) => !n.userId || n.userId === user?.id);
  const unread = myNotifications.filter((n) => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/customer/products?q=${encodeURIComponent(search)}`);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar */}
      <div className="bg-[#1e293b] text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          {/* Logo — image only, no text */}
          <Link href="/" className="flex-shrink-0">
            <img
              src="/logo.png"
              alt="Bigpool"
              width={40}
              height={40}
              style={{ mixBlendMode: "screen", display: "block" }}
            />
          </Link>

          {/* Search */}
          <div ref={searchRef} className="flex-1 mx-2 md:mx-4 relative">
            <form onSubmit={handleSearch}>
              <div className="flex w-full rounded-md overflow-hidden">
                <select className="bg-[#f3f3f3] text-black text-sm px-3 border-r border-gray-300 outline-none hidden md:block">
                  <option>All</option>
                  {categories.map((c) => (
                    <option key={c.id}>{c.name}</option>
                  ))}
                </select>
                <Input
                  className="flex-1 rounded-none border-0 h-10 text-sm focus-visible:ring-0"
                  style={{ backgroundColor: "white", color: "black" }}
                  placeholder="Search products, brands and more..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  autoComplete="off"
                />
                <button type="submit" className="bg-[#0d9488] hover:bg-[#0f766e] px-4 flex items-center">
                  <Search className="w-5 h-5 text-white" />
                </button>
              </div>
            </form>

            {/* Autocomplete dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-xl z-50 overflow-hidden">
                {search.trim().length < 2 && recentlyViewed.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-3 pt-2 pb-1">Recently Viewed</p>
                    {recentlyViewed.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
                        onClick={() => { setShowSuggestions(false); setSearch(""); router.push(`/customer/products/${p.id}`); }}
                      >
                        <img src={p.images[0]} alt="" className="w-8 h-8 object-cover rounded" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">₹{p.price.toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
                {suggestions.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-3 pt-2 pb-1">Products</p>
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
                        onClick={() => { setShowSuggestions(false); setSearch(p.name); router.push(`/customer/products/${p.id}`); }}
                      >
                        <img src={p.images[0]} alt="" className="w-8 h-8 object-cover rounded" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.category} · ₹{p.price.toLocaleString()}</p>
                        </div>
                        {p.discount > 0 && <span className="text-xs text-green-600 font-semibold flex-shrink-0">{p.discount}% off</span>}
                      </button>
                    ))}
                    <button
                      className="w-full px-3 py-2 text-sm text-[#0d9488] font-medium hover:bg-teal-50 text-left border-t border-gray-100"
                      onClick={() => { setShowSuggestions(false); router.push(`/customer/products?q=${encodeURIComponent(search)}`); }}
                    >
                      See all results for &quot;{search}&quot; →
                    </button>
                  </>
                )}
                {search.trim().length >= 2 && suggestions.length === 0 && (
                  <p className="px-3 py-3 text-sm text-gray-400">No results for &quot;{search}&quot;</p>
                )}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
            {/* User Menu — hidden on mobile (handled by bottom nav profile tab) */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="text-white hover:bg-white/10 flex items-center gap-1 h-auto py-1 px-2 rounded transition-colors hidden md:flex">
                    <User className="w-5 h-5" />
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] text-gray-300">
                        {isAuthenticated ? `Hello, ${user?.name?.split(" ")[0]}` : "Hello, Sign in"}
                      </span>
                      <span className="text-sm font-bold flex items-center gap-1">
                        Account <ChevronDown className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                }
              />
              <DropdownMenuContent className="w-56">
                {isAuthenticated ? (
                  <>
                    <div className="px-2 py-1.5 text-sm font-medium">{user?.name}</div>
                    <div className="px-2 pb-1.5 text-xs text-gray-500">{user?.email}</div>
                    <DropdownMenuSeparator />
                    {user?.role === "customer" && (
                      <>
                        <DropdownMenuItem render={<Link href="/customer/profile" className="flex items-center gap-2 w-full"><User className="w-4 h-4" /> My Profile</Link>} />
                        <DropdownMenuItem render={<Link href="/customer/profile/orders" className="flex items-center gap-2 w-full"><Package className="w-4 h-4" /> My Orders</Link>} />
                        <DropdownMenuItem render={<Link href="/customer/profile/wallet" className="flex items-center justify-between gap-2 w-full"><span className="flex items-center gap-2"><Wallet className="w-4 h-4" /> Wallet</span><span className="text-xs font-bold text-[#0d9488]">₹{balance.toLocaleString()}</span></Link>} />
                        <DropdownMenuItem render={<Link href="/customer/profile/refunds" className="flex items-center gap-2 w-full"><RotateCcw className="w-4 h-4" /> Refunds</Link>} />
                        <DropdownMenuItem render={<Link href="/customer/profile/settings" className="flex items-center gap-2 w-full"><Settings className="w-4 h-4" /> Settings</Link>} />
                      </>
                    )}
                    {user?.role === "seller" && (
                      <>
                        <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Seller</div>
                        <DropdownMenuItem render={<Link href="/vendor/dashboard" className="flex items-center gap-2 w-full"><Store className="w-4 h-4" /> Vendor Dashboard</Link>} />
                        <DropdownMenuItem render={<Link href="/vendor/products" className="flex items-center gap-2 w-full"><Package className="w-4 h-4" /> My Products</Link>} />
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Buyer</div>
                        <DropdownMenuItem render={<Link href="/customer/profile" className="flex items-center gap-2 w-full"><User className="w-4 h-4" /> My Profile</Link>} />
                        <DropdownMenuItem render={<Link href="/customer/profile/orders" className="flex items-center gap-2 w-full"><Package className="w-4 h-4" /> My Orders</Link>} />
                        <DropdownMenuItem render={<Link href="/customer/profile/wallet" className="flex items-center justify-between gap-2 w-full"><span className="flex items-center gap-2"><Wallet className="w-4 h-4" /> Wallet</span><span className="text-xs font-bold text-[#0d9488]">₹{balance.toLocaleString()}</span></Link>} />
                        <DropdownMenuItem render={<Link href="/customer/profile/wishlist" className="flex items-center gap-2 w-full"><Heart className="w-4 h-4" /> Wishlist</Link>} />
                      </>
                    )}
                    {user?.role === "admin" && (
                      <DropdownMenuItem render={<Link href="/superadmin/dashboard" className="flex items-center gap-2 w-full"><Shield className="w-4 h-4" /> Admin Panel</Link>} />
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      render={
                        <div className="flex items-center gap-2 w-full text-red-600 cursor-pointer">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </div>
                      }
                    />
                  </>
                ) : (
                  <>
                    <DropdownMenuItem render={<Link href="/customer/login" className="font-medium w-full block">Sign In</Link>} />
                    <DropdownMenuItem render={<Link href="/customer/signup" className="w-full block">Create Account</Link>} />
                    <DropdownMenuSeparator />
                    <DropdownMenuItem render={<Link href="/vendor/application/signup" className="w-full block">Sell on Bigpool</Link>} />
                    <DropdownMenuItem render={<Link href="/vendor/login" className="w-full block">Vendor Login</Link>} />
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications — bell visible on all sizes; mobile links to page, desktop opens dropdown */}
            <Link href="/customer/profile/notifications" className="md:hidden relative p-2 flex text-white hover:bg-white/10 rounded transition-colors" onClick={markAllRead}>
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] bg-[#0d9488] text-white flex items-center justify-center">
                  {unread}
                </Badge>
              )}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="text-white hover:bg-white/10 relative p-2 rounded transition-colors hidden md:flex">
                    <Bell className="w-5 h-5" />
                    {unread > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] bg-[#0d9488] text-white flex items-center justify-center">
                        {unread}
                      </Badge>
                    )}
                  </button>
                }
              />
              <DropdownMenuContent className="w-80">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="font-semibold text-sm">Notifications</span>
                  <DropdownMenuItem onClick={markAllRead} className="text-xs text-blue-600 hover:underline p-0 h-auto bg-transparent cursor-pointer rounded-none">Mark all read</DropdownMenuItem>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {myNotifications.length === 0 && (
                    <p className="px-3 py-4 text-sm text-gray-400 text-center">No notifications yet</p>
                  )}
                  {myNotifications.slice(0, 5).map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      render={
                        <Link href={n.link || "#"} className={`flex flex-col gap-0.5 px-3 py-2 w-full ${!n.read ? "bg-blue-50" : ""}`}>
                          <div className="flex items-center gap-2">
                            {!n.read && <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />}
                            <span className="font-medium text-xs">{n.title}</span>
                          </div>
                          <span className="text-xs text-gray-500 ml-4 line-clamp-1">{n.message}</span>
                          <span className="text-[10px] text-gray-400 ml-4">{n.createdAt}</span>
                        </Link>
                      }
                    />
                  ))}
                </div>
                <div className="border-t px-3 py-2">
                  <Link href="/customer/profile/notifications" className="text-xs text-blue-600 hover:underline">View all notifications</Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Wallet — desktop only */}
            {hasHydrated && isAuthenticated && (
              <Link
                href="/customer/profile/wallet"
                className="text-white hover:bg-white/10 flex-col items-center px-2 py-1 rounded transition-colors hidden md:flex"
              >
                <Wallet className="w-5 h-5" />
                <span className="text-[10px] font-bold text-[#5eead4] leading-none mt-0.5">
                  ₹{balance.toLocaleString()}
                </span>
              </Link>
            )}

            {/* Wishlist — desktop only */}
            <Link href="/customer/profile/wishlist" className="hidden md:block">
              <button className="text-white hover:bg-white/10 relative p-2 rounded transition-colors">
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] bg-[#0d9488] text-white flex items-center justify-center">
                    {wishlist.length}
                  </Badge>
                )}
              </button>
            </Link>

            {/* Cart */}
            <Link href="/customer/cart">
              <button className="text-white hover:bg-white/10 relative flex items-center gap-1 px-2 py-1.5 rounded transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] bg-[#0d9488] text-white flex items-center justify-center">
                    {cartCount}
                  </Badge>
                )}
                <span className="hidden sm:block text-sm font-bold">Cart</span>
              </button>
            </Link>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Mobile menu toggle */}
            <button
              className="text-white hover:bg-white/10 p-2 rounded md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Category bar */}
      <div className="bg-[#334155] text-white px-4 py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center gap-6 overflow-x-auto text-sm">
          <Link href="/customer/products" className="hover:text-[#0d9488] whitespace-nowrap font-medium flex items-center gap-1">
            <Menu className="w-4 h-4" /> All Categories
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/customer/products?category=${cat.slug}`} className="hover:text-[#0d9488] whitespace-nowrap transition-colors">
              {cat.name}
            </Link>
          ))}
          <span className="text-gray-500">|</span>
          <Link href="/customer/vouchers" className="hover:text-yellow-400 whitespace-nowrap transition-colors flex items-center gap-1 text-yellow-300 font-medium">
            🏷️ Vouchers & Offers
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="bg-[#334155] text-white md:hidden">
          <form onSubmit={handleSearch} className="flex p-3 gap-2">
            <Input className="flex-1 bg-white text-black h-9" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button type="submit" className="bg-[#0d9488] hover:bg-[#0f766e] text-white h-9 px-3">
              <Search className="w-4 h-4" />
            </Button>
          </form>
          <div className="grid grid-cols-2 gap-0.5 px-3 pb-3">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/customer/products?category=${cat.slug}`} className="text-sm py-2 px-2 hover:text-[#0d9488]" onClick={() => setMobileOpen(false)}>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
