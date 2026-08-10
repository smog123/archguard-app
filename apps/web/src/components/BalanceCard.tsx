"use client";

import { useState, useEffect } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { extenderClient, extenderContractId } from "@/lib/sdkClient";

export function BalanceCard({
  orgAddress,
  orgSecretKey,
  entryCount = 0,
}: {
  orgAddress: string;
  orgSecretKey: string;
  entryCount?: number;
}) {
  const [balanceStroops, setBalanceStroops] = useState<bigint>(0n);
  const [amountXlm, setAmountXlm] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<"deposit" | "withdraw">("deposit");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!orgAddress || extenderContractId === "PENDING_DEPLOYMENT") return;
    try {
      const bal = await extenderClient.getBalance(orgAddress);
      setBalanceStroops(bal);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [orgAddress]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const val = parseFloat(amountXlm);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid positive XLM amount.");
      return;
    }

    // Convert XLM to stroops (1 XLM = 10,000,000 stroops)
    const stroops = BigInt(Math.round(val * 10000000));

    try {
      setLoading(true);

      if (extenderContractId === "PENDING_DEPLOYMENT") {
        if (actionType === "deposit") {
          setBalanceStroops((prev) => prev + stroops);
        } else {
          setBalanceStroops((prev) => (prev >= stroops ? prev - stroops : 0n));
        }
        setSuccessMsg(
          `Simulated ${actionType} of ${amountXlm} XLM (Contract is PENDING_DEPLOYMENT)`
        );
        setAmountXlm("");
        return;
      }

      const orgKeypair = StellarSdk.Keypair.fromSecret(orgSecretKey);

      if (actionType === "deposit") {
        await extenderClient.deposit(orgKeypair, stroops);
        setSuccessMsg(`Deposited ${amountXlm} XLM successfully!`);
      } else {
        await extenderClient.withdraw(orgKeypair, stroops);
        setSuccessMsg(`Withdrew ${amountXlm} XLM successfully!`);
      }

      setAmountXlm("");
      await fetchBalance();
    } catch (err: any) {
      console.error("Balance action error:", err);
      setError(err.message || `Failed to ${actionType}.`);
    } finally {
      setLoading(false);
    }
  };

  const balanceXlmNum = Number(balanceStroops) / 10000000;
  const balanceXlmStr = balanceXlmNum.toFixed(4);
  const isLowBalance = balanceXlmNum < 5.0;

  // Runway estimation (assuming ~1,000 stroops fee per extension)
  const estimatedExtensionsLeft = Math.floor(Number(balanceStroops) / 1000);
  const estimatedMonths = entryCount > 0 ? (estimatedExtensionsLeft / (entryCount * 12)).toFixed(1) : "N/A";

  return (
    <div className="glass-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Prepaid Balance</h3>
        <span className={`badge ${isLowBalance ? "badge-warning" : "badge-active"}`}>
          {isLowBalance ? "Low Balance Warning" : "Custody Balance"}
        </span>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "2.2rem", fontWeight: "800", letterSpacing: "-0.02em", color: isLowBalance ? "#f59e0b" : "#ffffff" }}>
          {balanceXlmStr}{" "}
          <span style={{ fontSize: "1.2rem", color: "var(--text-muted)", fontWeight: "500" }}>
            XLM
          </span>
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
          {balanceStroops.toString()} Stroops available for keeper extensions
        </div>

        {/* Runway & Low Balance Indicator */}
        <div
          style={{
            marginTop: "12px",
            padding: "10px 14px",
            borderRadius: "8px",
            background: isLowBalance ? "rgba(245, 158, 11, 0.1)" : "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${isLowBalance ? "rgba(245, 158, 11, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
            fontSize: "0.82rem",
          }}
        >
          <div style={{ color: isLowBalance ? "#fbbf24" : "var(--text-muted)", fontWeight: "500" }}>
            Estimated Maintenance Runway:
          </div>
          <div style={{ marginTop: "2px", fontWeight: "600" }}>
            ~{estimatedExtensionsLeft.toLocaleString()} extensions left
            {entryCount > 0 && ` (~${estimatedMonths} months for ${entryCount} watched entries)`}
          </div>
        </div>
      </div>

      <form onSubmit={handleAction} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={`btn ${actionType === "deposit" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1 }}
            onClick={() => setActionType("deposit")}
          >
            Deposit
          </button>
          <button
            type="button"
            className={`btn ${actionType === "withdraw" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1 }}
            onClick={() => setActionType("withdraw")}
          >
            Withdraw
          </button>
        </div>

        <div>
          <label className="label">Amount (XLM)</label>
          <input
            type="number"
            step="0.0001"
            className="input-field"
            placeholder="100.00"
            value={amountXlm}
            onChange={(e) => setAmountXlm(e.target.value)}
          />
        </div>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              background: "var(--status-danger-bg)",
              color: "var(--status-danger-text)",
              fontSize: "0.8rem",
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              background: "var(--status-active-bg)",
              color: "var(--status-active-text)",
              fontSize: "0.8rem",
            }}
          >
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ marginTop: "4px" }}
        >
          {loading
            ? "Processing..."
            : `${actionType === "deposit" ? "Deposit XLM" : "Withdraw XLM"}`}
        </button>
      </form>
    </div>
  );
}
