"use client";

import { useState } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { registryClient, registryContractId } from "@/lib/sdkClient";
import { encodeKey, KeyType } from "@archguard/sdk";

export function AddEntryForm({
  orgSecretKey,
  onEntryAdded,
}: {
  orgSecretKey: string;
  onEntryAdded?: () => void;
}) {
  const [contractId, setContractId] = useState("");
  const [durability, setDurability] = useState<"Instance" | "Persistent">("Instance");

  // Storage key fields (when durability === "Persistent")
  const [keyType, setKeyType] = useState<KeyType>("symbol");
  const [keyValue, setKeyValue] = useState("");

  const [thresholdLedgers, setThresholdLedgers] = useState("17280");
  const [extendToLedgers, setExtendToLedgers] = useState("518400");
  const [autoExtend, setAutoExtend] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!contractId.trim()) {
      setError("Please provide a target Contract ID.");
      return;
    }

    try {
      const orgKeypair = StellarSdk.Keypair.fromSecret(orgSecretKey.trim());

      let scValKey: StellarSdk.xdr.ScVal | null = null;
      if (durability === "Persistent") {
        if (!keyValue.trim()) {
          setError("Storage key value is required for Persistent durability.");
          return;
        }
        scValKey = encodeKey({ type: keyType, value: keyValue.trim() });
      }

      const threshold = parseInt(thresholdLedgers, 10);
      const extendTo = parseInt(extendToLedgers, 10);

      if (threshold >= extendTo) {
        setError("Extend threshold ledgers must be strictly less than extend-to ledgers.");
        return;
      }

      setLoading(true);

      if (registryContractId === "PENDING_DEPLOYMENT") {
        setSuccessMsg("Watched entry added! (Simulated — contract is PENDING_DEPLOYMENT)");
        if (onEntryAdded) onEntryAdded();
        return;
      }

      const id = await registryClient.addWatchedEntry(orgKeypair, {
        contractId: contractId.trim(),
        durability,
        key: scValKey,
        extendThresholdLedgers: threshold,
        extendToLedgers: extendTo,
        autoExtend,
      });

      setSuccessMsg(`Watched entry #${id} created successfully!`);
      setContractId("");
      setKeyValue("");
      if (onEntryAdded) onEntryAdded();
    } catch (err: any) {
      console.error("Add entry error:", err);
      setError(err.message || "Failed to add watched entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "16px" }}>
        Add Watched Entry
      </h3>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label className="label">Contract ID to Watch</label>
          <input
            type="text"
            className="input-field"
            placeholder="C..."
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label className="label">Durability</label>
            <select
              className="input-field"
              value={durability}
              onChange={(e) => setDurability(e.target.value as "Instance" | "Persistent")}
            >
              <option value="Instance">Instance / Code</option>
              <option value="Persistent">Persistent Data Key</option>
            </select>
          </div>

          <div>
            <label className="label">Auto Extension</label>
            <select
              className="input-field"
              value={autoExtend ? "true" : "false"}
              onChange={(e) => setAutoExtend(e.target.value === "true")}
            >
              <option value="true">Enabled (Auto-extend)</option>
              <option value="false">Disabled (Alert only)</option>
            </select>
          </div>
        </div>

        {durability === "Persistent" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
            <div>
              <label className="label">Key Type</label>
              <select
                className="input-field"
                value={keyType}
                onChange={(e) => setKeyType(e.target.value as KeyType)}
              >
                <option value="symbol">Symbol</option>
                <option value="string">String</option>
                <option value="u64">u64 Number</option>
                <option value="address">Address</option>
              </select>
            </div>
            <div>
              <label className="label">Key Value</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Admin / 1001"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
              />
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label className="label">Threshold (Ledgers)</label>
            <input
              type="number"
              className="input-field"
              value={thresholdLedgers}
              onChange={(e) => setThresholdLedgers(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Extend To (Ledgers)</label>
            <input
              type="number"
              className="input-field"
              value={extendToLedgers}
              onChange={(e) => setExtendToLedgers(e.target.value)}
            />
          </div>
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

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Submitting..." : "+ Add Watched Entry"}
        </button>
      </form>
    </div>
  );
}
