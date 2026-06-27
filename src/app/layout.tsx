import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ChatSupport from "@/components/chat-support";
import StoreHydrator from "@/components/store-hydrator";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import InstallPrompt from "@/components/install-prompt";
import PwaRegister from "@/components/pwa-register";
import PushPermission from "@/components/push-permission";
import SplashScreen from "@/components/splash-screen";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/error-boundary";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bigpool - India's Favourite Marketplace",
  description: "Shop millions of products from trusted sellers across India.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bigpool",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ backgroundColor: "#1e293b" }}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body className={`${geist.className} bg-gray-100 min-h-screen flex flex-col`}>
        <SplashScreen />
        <PwaRegister />
        <PushPermission />
        <StoreHydrator />
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
        <MobileBottomNav />
        <InstallPrompt />
        <ChatSupport />
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
