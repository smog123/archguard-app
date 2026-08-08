import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Archguard Dashboard — Soroban Contract TTL Management",
  description:
    "Prepaid custody, automated footprint TTL extension, and monitoring for Soroban smart contracts on Stellar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            borderBottom: "1px solid var(--border-color)",
            padding: "16px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(9, 13, 22, 0.8)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                color: "#fff",
                fontSize: "1.1rem",
              }}
            >
              A
            </div>
            <span
              style={{
                fontWeight: "700",
                fontSize: "1.2rem",
                letterSpacing: "-0.02em",
                background: "linear-gradient(to right, #ffffff, #9ca3af)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Archguard
            </span>
            <span className="badge badge-active" style={{ fontSize: "0.65rem" }}>
              Soroban Keeper
            </span>
          </div>
          <div style={{ display: "flex", gap: "20px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            <a href="/" style={{ hover: "color: white" }}>
              Onboarding
            </a>
            <a href="/dashboard">Dashboard</a>
          </div>
        </nav>
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
