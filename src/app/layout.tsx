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
import AuthProvider from "@/components/auth-provider";
import MusicPlayer from "@/components/music-player";

const geist = Geist({ subsets: ["latin"] });

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bigpool.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "Bigpool — India's Online Marketplace | Shop Electronics, Fashion & More",
    template: "%s | Bigpool",
  },
  description:
    "Bigpool is India's growing online marketplace. Shop electronics, fashion, home & kitchen, beauty, sports and more from trusted Indian sellers. Free delivery, easy returns, secure payments.",
  keywords: [
    "Bigpool", "bigpool marketplace", "online shopping India", "buy online India",
    "Indian marketplace", "electronics online", "fashion online India",
    "home kitchen online", "trusted sellers India", "bigpool.in",
  ],
  authors: [{ name: "Bigpool", url: BASE }],
  creator: "Bigpool",
  publisher: "Bigpool",
  category: "shopping",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE,
    siteName: "Bigpool",
    title: "Bigpool — India's Online Marketplace",
    description:
      "Shop electronics, fashion, home & kitchen and more from trusted Indian sellers. Free delivery, easy returns, 100% authentic products.",
    images: [
      {
        url: `${BASE}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Bigpool — India's Online Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bigpool — India's Online Marketplace",
    description: "Shop millions of products from trusted Indian sellers.",
    images: [`${BASE}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Bigpool",
  alternateName: "Bigpool Marketplace",
  url: BASE,
  logo: `${BASE}/logo.png`,
  description:
    "Bigpool is India's online marketplace connecting buyers with trusted sellers across electronics, fashion, home, beauty and more.",
  foundingDate: "2024",
  areaServed: "IN",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: ["English", "Hindi"],
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Bigpool",
  url: BASE,
  description: "India's online marketplace — shop electronics, fashion, home & kitchen and more.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE}/customer/products?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ backgroundColor: "#1e293b" }}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="canonical" href={BASE} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${geist.className} bg-gray-100 min-h-screen flex flex-col`}>
        <SplashScreen />
        <PwaRegister />
        <PushPermission />
        <StoreHydrator />
        <AuthProvider>
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
        <MobileBottomNav />
        <InstallPrompt />
        <MusicPlayer />
        <ChatSupport />
        <Toaster richColors position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
