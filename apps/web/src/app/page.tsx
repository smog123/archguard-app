import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ textAlign: "center", paddingTop: "60px" }}>
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: "800",
          letterSpacing: "-0.03em",
          marginBottom: "16px",
          background: "linear-gradient(135deg, #ffffff 0%, #6366f1 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Automated Soroban TTL Extension
      </h1>
      <p
        style={{
          fontSize: "1.15rem",
          color: "var(--text-muted)",
          maxWidth: "600px",
          margin: "0 auto 32px auto",
          lineHeight: "1.6",
        }}
      >
        Keep your Stellar smart contract instances and persistent data entries alive automatically.
        Prepay balance in custody and configure re-extension policies.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
        <Link href="/dashboard" className="btn btn-primary" style={{ padding: "12px 28px", fontSize: "1rem" }}>
          Go to Dashboard &rarr;
        </Link>
      </div>
    </div>
  );
}
