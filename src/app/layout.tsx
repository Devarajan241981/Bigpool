import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ChatSupport from "@/components/chat-support";
import StoreHydrator from "@/components/store-hydrator";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/error-boundary";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bigpool - India's Favourite Marketplace",
  description: "Shop millions of products from trusted sellers across India.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-100 min-h-screen flex flex-col`}>
        <StoreHydrator />
        <Navbar />
        <main className="flex-1">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <Footer />
        <ChatSupport />
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
