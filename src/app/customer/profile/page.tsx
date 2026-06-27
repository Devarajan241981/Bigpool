"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, Package, Heart, RotateCcw, Bell, Settings,
  LogOut, ChevronRight, Edit3, MapPin, Phone, Mail, Camera, Smartphone, Wallet,
  HelpCircle, Store, Clock, CheckCircle, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, useOrderStore, useSellerApplicationStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const navItems = [
  { href: "/customer/profile", label: "My Profile", icon: User },
  { href: "/customer/profile/orders", label: "My Orders", icon: Package },
  { href: "/customer/profile/wishlist", label: "Wishlist", icon: Heart },
  { href: "/customer/profile/refunds", label: "Refunds", icon: RotateCcw },
  { href: "/customer/profile/notifications", label: "Notifications", icon: Bell },
  { href: "/customer/profile/settings", label: "Settings", icon: Settings },
];

export default function ProfilePage() {
  const { user, isAuthenticated, logout, updateUser } = useAuthStore();
  const { orders, fetchOrders } = useOrderStore();
  const { applications } = useSellerApplicationStore();
  const myApps = applications.filter((a) => a.email === (user?.email ?? ""));
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.id) fetchOrders({ customerId: user.id });
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center pb-20 md:pb-16">
        <p className="text-5xl mb-4">👤</p>
        <h2 className="text-xl font-semibold mb-2">Please sign in to view your profile</h2>
        <Link href="/customer/login">
          <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold mt-4 h-11 px-8">Sign In</Button>
        </Link>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 3);

  const handleSave = () => {
    updateUser({
      name: form.name,
      phone: form.phone,
      address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode, country: "India" },
    });
    toast.success("Profile updated successfully!");
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
    toast.success("Logged out successfully");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 pb-20 md:pb-6">
      {/* Mobile hero card */}
      <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] rounded-2xl p-5 text-white mb-4 md:hidden">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-[#0d9488] flex items-center justify-center text-white font-bold text-2xl">
              {user?.name?.[0] || "U"}
            </div>
            <button className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow">
              <Camera className="w-3 h-3 text-gray-600" />
            </button>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-lg leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-300 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Mobile quick nav grid */}
      <div className="grid grid-cols-3 gap-2 mb-4 md:hidden">
        {[
          { href: "/customer/profile/orders", icon: Package, label: "Orders", color: "text-blue-600 bg-blue-50" },
          { href: "/customer/profile/wishlist", icon: Heart, label: "Wishlist", color: "text-red-600 bg-red-50" },
          { href: "/customer/profile/refunds", icon: RotateCcw, label: "Refunds", color: "text-purple-600 bg-purple-50" },
          { href: "/customer/profile/notifications", icon: Bell, label: "Alerts", color: "text-teal-600 bg-teal-50" },
          { href: "/customer/profile/settings", icon: Settings, label: "Settings", color: "text-gray-600 bg-gray-100" },
          { href: "/customer/help", icon: HelpCircle, label: "Help", color: "text-orange-600 bg-orange-50" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-sm transition-shadow active:scale-95">
              <div className={`rounded-lg p-2 inline-flex mb-1.5 ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-medium text-gray-700">{item.label}</p>
            </div>
          </Link>
        ))}
        <button onClick={handleLogout} className="bg-white border border-red-100 rounded-xl p-3 text-center hover:bg-red-50 active:scale-95 transition-all">
          <div className="rounded-lg p-2 inline-flex mb-1.5 text-red-600 bg-red-50">
            <LogOut className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-medium text-red-600">Sign Out</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar — desktop only */}
        <div className="hidden md:block md:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] p-6 text-white text-center">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-[#0d9488] flex items-center justify-center text-white font-bold text-2xl mx-auto">
                  {user?.name?.[0] || "U"}
                </div>
                <button className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow">
                  <Camera className="w-3 h-3 text-gray-600" />
                </button>
              </div>
              <p className="font-semibold mt-3">{user?.name}</p>
              <p className="text-xs text-gray-300 mt-0.5">{user?.email}</p>
            </div>

            <nav className="py-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                    item.href === "/customer/profile" ? "text-[#0d9488] font-medium bg-teal-50" : "text-gray-700"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-400" />
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors mt-1 border-t"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 space-y-4 md:space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <h2 className="text-base md:text-lg font-bold text-gray-900">Personal Information</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(!editing)}
                className="gap-2 h-9"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {editing ? "Cancel" : "Edit"}
              </Button>
            </div>

            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input className="mt-1.5 h-11" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-1.5 h-11" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Street Address</Label>
                  <Input className="mt-1.5 h-11" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input className="mt-1.5 h-11" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input className="mt-1.5 h-11" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input className="mt-1.5 h-11" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Button onClick={handleSave} className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold w-full sm:w-auto h-11">
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: <User className="w-4 h-4" />, label: "Name", value: user?.name },
                  { icon: <Mail className="w-4 h-4" />, label: "Email", value: user?.email },
                  { icon: <Phone className="w-4 h-4" />, label: "Phone", value: user?.phone || "Not added" },
                  { icon: <MapPin className="w-4 h-4" />, label: "Address", value: user?.address ? `${user.address.street}, ${user.address.city}` : "Not added" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 mt-0.5 flex-shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-sm font-medium text-gray-800 break-words">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-gray-900">Recent Orders</h2>
              <Link href="/customer/profile/orders" className="text-sm text-[#0d9488] hover:underline">View all</Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No orders yet. <Link href="/customer/products" className="text-[#0d9488] hover:underline">Start shopping</Link></p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link key={order.id} href={`/customer/profile/orders/${order.id}`}>
                    <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-gray-300 transition-colors">
                      <img
                        src={order.items[0]?.product.images[0]}
                        alt=""
                        className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">Order #{order.id}</p>
                        <p className="text-xs text-gray-500">{order.items.length} item(s) · ₹{order.total.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{order.createdAt}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge className={`text-xs capitalize ${
                          order.status === "delivered" ? "bg-green-100 text-green-700" :
                          order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                          "bg-orange-100 text-orange-700"
                        }`}>
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/customer/profile/orders", icon: Package, label: "My Orders", color: "text-blue-600 bg-blue-50" },
              { href: "/customer/profile/wishlist", icon: Heart, label: "Wishlist", color: "text-red-600 bg-red-50" },
              { href: "/customer/profile/wallet", icon: Wallet, label: "Wallet", color: "text-green-600 bg-green-50" },
              { href: "/customer/profile/refunds", icon: RotateCcw, label: "Refunds", color: "text-purple-600 bg-purple-50" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                  <div className={`rounded-lg p-2 inline-flex mb-2 ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* My Applications */}
          {myApps.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#0d9488]" />
                  <h3 className="font-semibold text-sm text-gray-900">My Vendor Applications</h3>
                </div>
                <Link href="/vendor/application/signup" className="text-xs text-[#0d9488] font-medium hover:underline">
                  + New
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {myApps.map((app) => (
                  <div key={app.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      app.status === "approved" ? "bg-green-100" : app.status === "rejected" ? "bg-red-100" : "bg-amber-100"
                    }`}>
                      {app.status === "approved" ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                       app.status === "rejected" ? <XCircle className="w-4 h-4 text-red-600" /> :
                       <Clock className="w-4 h-4 text-amber-600 animate-pulse" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{app.businessName}</p>
                      <p className="text-xs text-gray-400">{app.category} · Applied {app.submittedAt}</p>
                    </div>
                    <Badge className={`text-[10px] capitalize flex-shrink-0 ${
                      app.status === "approved" ? "bg-green-100 text-green-700" :
                      app.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {app.status === "pending" ? "Under Review" : app.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sell on Bigpool CTA — if no applications yet */}
          {myApps.length === 0 && (
            <Link href="/vendor/application/signup">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                <div className="bg-indigo-100 rounded-xl p-2.5 flex-shrink-0">
                  <Store className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">Start Selling on Bigpool</p>
                  <p className="text-xs text-gray-500 mt-0.5">0% commission for first 3 months · Apply in 5 minutes</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </Link>
          )}

          {/* Download App card */}
          <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] rounded-xl p-5 text-white flex items-center gap-4">
            <div className="bg-[#0d9488] rounded-xl p-3 flex-shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Install the Bigpool App</p>
              <p className="text-xs text-gray-300 mt-0.5">Faster access · App-only deals · Works offline</p>
            </div>
            <button
              onClick={() => {
                if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
                  alert("In Safari: tap Share → Add to Home Screen");
                } else {
                  window.dispatchEvent(new CustomEvent("triggerInstall"));
                }
              }}
              className="flex-shrink-0 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
