"use client";

import { useState } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { WatchedEntry, decodeKey } from "@archguard/sdk";
import { registryClient, registryContractId } from "@/lib/sdkClient";

export function WatchedEntryList({
  entries,
  orgSecretKey,
  onRefresh,
}: {
  entries: WatchedEntry[];
  orgSecretKey: string;
  onRefresh: () => void;
}) {
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const handleRemove = async (entryId: bigint) => {
    if (!confirm(`Are you sure you want to remove watched entry #${entryId}?`)) return;

    try {
      setDeletingId(entryId);
      if (registryContractId !== "PENDING_DEPLOYMENT") {
        const orgKeypair = StellarSdk.Keypair.fromSecret(orgSecretKey);
        await registryClient.removeWatchedEntry(orgKeypair, entryId);
      }
      onRefresh();
    } catch (err) {
      console.error("Failed to remove entry:", err);
      alert("Failed to remove entry");
    } finally {
      setDeletingId(null);
    }
  };

  if (entries.length === 0) {
    return (
      <div
        className="glass-card"
        style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}
      >
        <p>No watched entries registered yet for this organization.</p>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>
          Watched Entries ({entries.length})
        </h3>
        <button className="btn btn-secondary" onClick={onRefresh} style={{ padding: "6px 12px" }}>
          Refresh
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border-color)",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                textTransform: "uppercase",
              }}
            >
              <th style={{ padding: "12px 8px" }}>ID</th>
              <th style={{ padding: "12px 8px" }}>Contract</th>
              <th style={{ padding: "12px 8px" }}>Type / Key</th>
              <th style={{ padding: "12px 8px" }}>Policy</th>
              <th style={{ padding: "12px 8px" }}>Auto Extend</th>
              <th style={{ padding: "12px 8px" }}>Status</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              let keyString = "Instance / Code";
              if (entry.key) {
                try {
                  const decoded = decodeKey(entry.key);
                  keyString = `${decoded.type}: ${decoded.value}`;
                } catch {
                  keyString = "Persistent Key";
                }
              }

              return (
                <tr
                  key={entry.id.toString()}
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    fontSize: "0.9rem",
                  }}
                >
                  <td style={{ padding: "14px 8px", fontWeight: "600" }}>
                    #{entry.id.toString()}
                  </td>
                  <td style={{ padding: "14px 8px", fontFamily: "var(--font-mono)" }}>
                    {entry.contractId.substring(0, 8)}...
                    {entry.contractId.substring(entry.contractId.length - 6)}
                  </td>
                  <td style={{ padding: "14px 8px" }}>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        background: "rgba(255, 255, 255, 0.05)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {entry.durability}
                    </span>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {keyString}
                    </div>
                  </td>
                  <td style={{ padding: "14px 8px", fontSize: "0.85rem" }}>
                    &lt; {entry.extendThresholdLedgers} &rarr; {entry.extendToLedgers} ledgers
                  </td>
                  <td style={{ padding: "14px 8px" }}>
                    {entry.autoExtend ? (
                      <span className="badge badge-active">Auto</span>
                    ) : (
                      <span className="badge badge-warning">Alert Only</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 8px" }}>
                    <span className="badge badge-active">Healthy</span>
                  </td>
                  <td style={{ padding: "14px 8px", textAlign: "right" }}>
                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        color: "var(--status-danger-text)",
                      }}
                      onClick={() => handleRemove(entry.id)}
                      disabled={deletingId === entry.id}
                    >
                      {deletingId === entry.id ? "Removing..." : "Remove"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
