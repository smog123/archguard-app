"use client";

import { useState } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { registryClient, registryContractId } from "@/lib/sdkClient";

export function OrgOnboarding({
  onRegistered,
}: {
  onRegistered?: (orgPublicKey: string) => void;
}) {
  const [secretKey, setSecretKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const generateNewKeypair = () => {
    const kp = StellarSdk.Keypair.random();
    setSecretKey(kp.secret());
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!secretKey.trim()) {
      setError("Please provide an Organization Secret Key.");
      return;
    }

    try {
      const orgKeypair = StellarSdk.Keypair.fromSecret(secretKey.trim());
      const rawUrl = webhookUrl.trim() || "https://example.com/webhook";

      // Compute SHA-256 hash of the webhook URL (Web Crypto API — browser-safe)
      const webhookHash = new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawUrl))
      );

      setLoading(true);

      if (registryContractId === "PENDING_DEPLOYMENT") {
        setSuccessMsg(
          `Registered org ${orgKeypair.publicKey().substring(0, 8)}... (Simulated — contract is PENDING_DEPLOYMENT)`
        );
        if (onRegistered) onRegistered(orgKeypair.publicKey());
        return;
      }

      await registryClient.registerOrg(orgKeypair, webhookHash);
      setSuccessMsg(
        `Org ${orgKeypair.publicKey().substring(0, 8)}... registered successfully!`
      );
      if (onRegistered) onRegistered(orgKeypair.publicKey());
    } catch (err: any) {
      console.error("Org registration error:", err);
      setError(err.message || "Failed to register organization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: "550px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "8px" }}>
        Register Organization
      </h2>
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "20px" }}>
        Register your team's admin wallet and notification webhook with Archguard.
      </p>

      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label className="label">Org Admin Secret Key</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="password"
              className="input-field"
              placeholder="S..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flexShrink: 0 }}
              onClick={generateNewKeypair}
            >
              Generate
            </button>
          </div>
        </div>

        <div>
          <label className="label">Notification Webhook URL</label>
          <input
            type="url"
            className="input-field"
            placeholder="https://your-domain.com/api/archguard-webhook"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "var(--status-danger-bg)",
              color: "var(--status-danger-text)",
              fontSize: "0.85rem",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "var(--status-active-bg)",
              color: "var(--status-active-text)",
              fontSize: "0.85rem",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ marginTop: "8px" }}
        >
          {loading ? "Registering On-Chain..." : "Register Organization"}
        </button>
      </form>
    </div>
  );
}
