"use client";

import { useState, useEffect, useCallback } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import type { WatchedEntry } from "@archguard/sdk";
import { registryClient, registryContractId } from "@/lib/sdkClient";
import { BalanceCard } from "@/components/BalanceCard";
import { AddEntryForm } from "@/components/AddEntryForm";
import { WatchedEntryList } from "@/components/WatchedEntryList";

export default function DashboardPage() {
  const [secretKey, setSecretKey] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [entries, setEntries] = useState<WatchedEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");

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
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>Active Org Address: {orgAddress || "None (Enter Secret Key)"}</span>
              {orgAddress && (
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${orgAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#818cf8", textDecoration: "none", fontSize: "0.8rem" }}
                >
                  ↗ Explorer
                </a>
              )}
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

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "16px", marginTop: "20px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              background: "none",
              border: "none",
              color: activeTab === "overview" ? "#818cf8" : "var(--text-muted)",
              fontWeight: activeTab === "overview" ? "700" : "500",
              borderBottom: activeTab === "overview" ? "2px solid #818cf8" : "none",
              paddingBottom: "8px",
              cursor: "pointer",
            }}
          >
            Overview & Management
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            style={{
              background: "none",
              border: "none",
              color: activeTab === "activity" ? "#818cf8" : "var(--text-muted)",
              fontWeight: activeTab === "activity" ? "700" : "500",
              borderBottom: activeTab === "activity" ? "2px solid #818cf8" : "none",
              paddingBottom: "8px",
              cursor: "pointer",
            }}
          >
            Keeper Activity Log
          </button>
        </div>
      </div>

      {activeTab === "overview" ? (
        <>
          {/* Main Grid: Balance & Add Form */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "24px",
            }}
          >
            <BalanceCard orgAddress={orgAddress} orgSecretKey={secretKey} entryCount={entries.length} />
            <AddEntryForm orgSecretKey={secretKey} onEntryAdded={loadEntries} />
          </div>

          {/* Watched Entry List */}
          <div>
            <WatchedEntryList entries={entries} orgSecretKey={secretKey} onRefresh={loadEntries} />
          </div>
        </>
      ) : (
        /* Keeper Activity Stream */
        <div className="glass-card">
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "16px" }}>
            Live Keeper Activity Stream
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>OrgRegistered</span>
                <span>Just now</span>
              </div>
              <div style={{ marginTop: "4px", fontWeight: "500" }}>
                Organization registered on-chain under address <code style={{ color: "#818cf8" }}>{orgAddress}</code>.
              </div>
            </div>

            <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>EntryAdded</span>
                <span>Just now</span>
              </div>
              <div style={{ marginTop: "4px", fontWeight: "500" }}>
                Watched entry #1 added for contract instance <code style={{ color: "#818cf8" }}>CBAA...GFRP</code>. Policy threshold set to &lt; 17,280 ledgers.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
