"use client";

import { useState, useEffect, useCallback } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { WatchedEntry } from "@archguard/sdk";
import { registryClient, registryContractId } from "@/lib/sdkClient";
import { BalanceCard } from "@/components/BalanceCard";
import { AddEntryForm } from "@/components/AddEntryForm";
import { WatchedEntryList } from "@/components/WatchedEntryList";

export default function DashboardPage() {
  const [secretKey, setSecretKey] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [entries, setEntries] = useState<WatchedEntry[]>([]);

  // Generate a default demo keypair on first load so user can immediately test UI
  useEffect(() => {
    const demoKp = StellarSdk.Keypair.random();
    setSecretKey(demoKp.secret());
    setOrgAddress(demoKp.publicKey());
  }, []);

  const handleSecretKeyChange = (val: string) => {
    setSecretKey(val);
    try {
      if (val.trim()) {
        const kp = StellarSdk.Keypair.fromSecret(val.trim());
        setOrgAddress(kp.publicKey());
      } else {
        setOrgAddress("");
      }
    } catch {
      setOrgAddress("");
    }
  };

  const loadEntries = useCallback(async () => {
    if (!orgAddress) return;
    try {
      if (registryContractId === "PENDING_DEPLOYMENT") {
        setEntries([
          {
            id: 1n,
            org: orgAddress,
            contractId: "CBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGFRP",
            durability: "Instance",
            key: null,
            extendThresholdLedgers: 17280,
            extendToLedgers: 518400,
            autoExtend: true,
            createdAt: BigInt(Math.floor(Date.now() / 1000)),
          },
        ]);
        return;
      }

      const fetched = await registryClient.getOrgEntries(orgAddress);
      setEntries(fetched);
    } catch (err) {
      console.error("Failed to load watched entries:", err);
    }
  }, [orgAddress]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Session Header */}
      <div className="glass-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: "800", marginBottom: "4px" }}>
              Organization Dashboard
            </h1>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Active Org Address: {orgAddress || "None (Enter Secret Key)"}
            </div>
          </div>
          <div style={{ minWidth: "300px" }}>
            <label className="label">Org Admin Secret Key</label>
            <input
              type="password"
              className="input-field"
              placeholder="S..."
              value={secretKey}
              onChange={(e) => handleSecretKeyChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Balance & Add Form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "24px",
        }}
      >
        <BalanceCard orgAddress={orgAddress} orgSecretKey={secretKey} />
        <AddEntryForm orgSecretKey={secretKey} onEntryAdded={loadEntries} />
      </div>

      {/* Watched Entry List */}
      <div>
        <WatchedEntryList entries={entries} orgSecretKey={secretKey} onRefresh={loadEntries} />
      </div>
    </div>
  );
}
