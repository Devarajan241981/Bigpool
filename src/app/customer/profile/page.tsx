"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, Package, Heart, RotateCcw, Bell, Settings,
  LogOut, ChevronRight, Edit3, MapPin, Phone, Mail, Camera, Smartphone, Wallet,
  HelpCircle, Store, Clock, CheckCircle, XCircle, Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, useOrderStore, getAuthHeaders } from "@/lib/store";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const navItems = [
  { href: "/customer/profile", label: "My Profile", icon: User },
  { href: "/customer/profile/orders", label: "My Orders", icon: Package },
  { href: "/customer/profile/wishlist", label: "Wishlist", icon: Heart },
  { href: "/customer/profile/refer", label: "Refer & Earn ₹100", icon: Gift },
  { href: "/customer/profile/refunds", label: "Refunds", icon: RotateCcw },
  { href: "/customer/profile/notifications", label: "Notifications", icon: Bell },
  { href: "/customer/profile/settings", label: "Settings", icon: Settings },
];

export default function ProfilePage() {
  const { user, isAuthenticated, logout, updateUser } = useAuthStore();
  const { orders, fetchOrders } = useOrderStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [myApps, setMyApps] = useState<Record<string, unknown>[]>([]);
  const [withdrawConfirm, setWithdrawConfirm] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.id) fetchOrders({ customerId: user.id });
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user?.email) return;
    fetch("/api/vendor-applications", { headers: getAuthHeaders() })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setMyApps(data);
      })
      .catch(() => {});
  }, [user?.email]);

  const handleWithdraw = async (id: string) => {
    setWithdrawing(true);
    try {
      const res = await fetch("/api/vendor-applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMyApps((prev) => prev.filter((a) => a.id !== id));
        toast.success("Application withdrawn successfully.");
      } else {
        toast.error("Failed to withdraw. Try again.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setWithdrawing(false);
      setWithdrawConfirm(null);
    }
  };
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

      {/* Mobile quick nav — clean list rows */}
      <div className="mb-4 md:hidden bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {[
          { href: "/customer/profile/orders", icon: Package, label: "My Orders", sub: "Track & manage orders", color: "bg-blue-500" },
          { href: "/customer/profile/wishlist", icon: Heart, label: "Wishlist", sub: "Saved products", color: "bg-red-500" },
          { href: "/customer/profile/wallet", icon: Wallet, label: "Wallet", sub: "Balance & top-up", color: "bg-emerald-500" },
          { href: "/customer/profile/refer", icon: Gift, label: "Refer & Earn ₹100", sub: "Invite friends, earn rewards", color: "bg-green-500" },
          { href: "/customer/profile/refunds", icon: RotateCcw, label: "Refunds", sub: "Returns & refund status", color: "bg-purple-500" },
          { href: "/customer/profile/notifications", icon: Bell, label: "Notifications", sub: "Alerts & updates", color: "bg-teal-500" },
          { href: "/customer/profile/settings", icon: Settings, label: "Settings", sub: "Account preferences", color: "bg-gray-500" },
          { href: "/customer/help", icon: HelpCircle, label: "Help & Support", sub: "FAQs & contact us", color: "bg-orange-500" },
        ].map((item, i, arr) => (
          <Link key={item.href} href={item.href}>
            <div className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
              <div className={`${item.color} rounded-xl w-9 h-9 flex items-center justify-center flex-shrink-0`}>
                <item.icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </div>
          </Link>
        ))}
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 active:bg-red-100 transition-colors border-t border-gray-100">
          <div className="bg-red-500 rounded-xl w-9 h-9 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-red-600">Sign Out</p>
            <p className="text-xs text-gray-400">Log out of your account</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
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

          {/* ── Vendor section ─────────────────────────────── */}
          {myApps.length > 0 ? (
            /* My Applications card */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#0d9488]" />
                  <span className="text-sm font-bold text-gray-900">Vendor Applications</span>
                  <span className="text-xs text-gray-400">({myApps.length})</span>
                </div>
                <Link href="/vendor/application/signup" className="text-xs text-[#0d9488] font-semibold hover:underline">
                  + New
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {myApps.map((app) => (
                  <div key={app.id as string} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      app.status === "approved" ? "bg-green-100" : app.status === "rejected" ? "bg-red-100" : "bg-amber-100"
                    }`}>
                      {app.status === "approved" ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                       app.status === "rejected" ? <XCircle className="w-5 h-5 text-red-600" /> :
                       <Clock className="w-5 h-5 text-amber-600 animate-pulse" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{app.businessName as string}</p>
                      <p className="text-xs text-gray-400">{app.category as string}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        app.status === "approved" ? "bg-green-100 text-green-700" :
                        app.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {app.status === "pending" ? "Under Review" : app.status === "approved" ? "Approved" : "Rejected"}
                      </span>
                      {app.status === "approved" && (
                        <Link href="/vendor/dashboard" className="text-xs text-[#0d9488] font-semibold border border-teal-200 rounded-lg px-2.5 py-1 hover:bg-teal-50 transition-colors">
                          Dashboard
                        </Link>
                      )}
                      {app.status === "pending" && (
                        <button
                          onClick={() => setWithdrawConfirm(app.id as string)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 hover:border-red-400 hover:bg-red-50 rounded-lg px-2.5 py-1 transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Sell on Bigpool CTA — no applications yet */
            <Link href="/vendor/application/signup">
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:border-[#0d9488] hover:shadow-sm transition-all group">
                <div className="bg-teal-50 rounded-xl p-2.5 flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                  <Store className="w-5 h-5 text-[#0d9488]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">Start Selling on Bigpool</p>
                  <p className="text-xs text-gray-500 mt-0.5">0% commission · 3 months free · Apply in 5 min</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0d9488] flex-shrink-0 transition-colors" />
              </div>
            </Link>
          )}

          {/* ── Withdraw Confirmation Dialog ────────────────── */}
          {withdrawConfirm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Withdraw Application?</h3>
                  <p className="text-sm text-gray-500 mt-1">This will cancel your vendor application. You can reapply anytime.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setWithdrawConfirm(null)} disabled={withdrawing}>Keep It</Button>
                  <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => handleWithdraw(withdrawConfirm)} disabled={withdrawing}>
                    {withdrawing ? "Withdrawing..." : "Yes, Withdraw"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Download App card ───────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="bg-slate-100 rounded-xl p-2.5 flex-shrink-0">
              <Smartphone className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">Install the Bigpool App</p>
              <p className="text-xs text-gray-500 mt-0.5">Faster checkout · Offline access · App-only deals</p>
            </div>
            <button
              onClick={() => {
                if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
                  alert("In Safari: tap Share → Add to Home Screen");
                } else {
                  window.dispatchEvent(new CustomEvent("triggerInstall"));
                }
              }}
              className="flex-shrink-0 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
