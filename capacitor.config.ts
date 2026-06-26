import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.bigpool.marketplace",
  appName: "ShopHub",
  // Phase 1: WebView pointing at the live deployed URL.
  // Replace the URL below with your Vercel/production URL after deploying.
  // For local testing, use your machine's LAN IP (e.g. http://192.168.1.10:3000)
  server: {
    url: "https://your-shophub-domain.vercel.app",
    cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0d9488",
      showSpinner: false,
    },
  },
};

export default config;
