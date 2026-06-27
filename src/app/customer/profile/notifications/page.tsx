"use client";

import Link from "next/link";
import { Bell, Package, Tag, RotateCcw, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotificationStore } from "@/lib/store";

const typeConfig = {
  order: { icon: <Package className="w-4 h-4" />, color: "bg-blue-100 text-blue-600" },
  promotion: { icon: <Tag className="w-4 h-4" />, color: "bg-orange-100 text-orange-600" },
  refund: { icon: <RotateCcw className="w-4 h-4" />, color: "bg-green-100 text-green-600" },
  system: { icon: <Settings className="w-4 h-4" />, color: "bg-gray-100 text-gray-600" },
  seller: { icon: <Bell className="w-4 h-4" />, color: "bg-purple-100 text-purple-600" },
};

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead, unreadCount } = useNotificationStore();
  const unread = unreadCount();

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 md:py-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#0d9488]" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Notifications</h1>
          {unread > 0 && <Badge className="bg-red-500 text-white">{unread} new</Badge>}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2 text-xs h-9">
            <Check className="w-3.5 h-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No notifications</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || typeConfig.system;
            return (
              <div
                key={n.id}
                className={`bg-white rounded-xl border p-4 flex gap-3 transition-all ${
                  !n.read ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
                }`}
              >
                <div className={`rounded-lg p-2 flex-shrink-0 h-fit ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.read ? "text-gray-900" : "text-gray-700"}`}>
                      {n.title}
                      {!n.read && <span className="inline-block w-2 h-2 rounded-full bg-blue-600 ml-1.5 mb-0.5" />}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{n.createdAt}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {n.link && (
                      <Link href={n.link} onClick={() => markRead(n.id)} className="text-xs text-[#0d9488] hover:underline font-medium">
                        View details →
                      </Link>
                    )}
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="text-xs text-gray-400 hover:text-gray-600">
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
