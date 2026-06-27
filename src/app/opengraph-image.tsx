import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Bigpool — India's Online Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0d3d38 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(13,148,136,0.08)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(13,148,136,0.06)",
            display: "flex",
          }}
        />

        {/* Logo area */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "rgba(255,255,255,0.06)",
            border: "2px solid rgba(13,148,136,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
            fontSize: 64,
          }}
        >
          🛍️
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: -3,
            marginBottom: 16,
            display: "flex",
          }}
        >
          Bigpool
        </div>

        {/* Teal accent line */}
        <div
          style={{
            width: 80,
            height: 5,
            borderRadius: 99,
            background: "#0d9488",
            marginBottom: 28,
            display: "flex",
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "#94a3b8",
            fontWeight: 500,
            letterSpacing: 1,
            display: "flex",
          }}
        >
          India&apos;s Online Marketplace
        </div>

        {/* Categories row */}
        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          {["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports"].map((cat) => (
            <div
              key={cat}
              style={{
                background: "rgba(13,148,136,0.15)",
                border: "1px solid rgba(13,148,136,0.3)",
                borderRadius: 100,
                padding: "8px 20px",
                color: "#5eead4",
                fontSize: 18,
                fontWeight: 500,
                display: "flex",
              }}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
