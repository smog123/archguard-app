import * as StellarSdk from "@stellar/stellar-sdk";
import { RegistryClient, WatchedEntry, buildPersistentDataLedgerKey } from "@archguard/sdk";

export interface PendingExtension {
  entry: WatchedEntry;
  remainingTTL: number;
  wasmHash?: string; // hex string if instance entry
}

export function calculateRemainingTTL(
  liveUntilLedgerSeq: number,
  latestLedgerSeq: number
): number {
  return Math.max(0, liveUntilLedgerSeq - latestLedgerSeq);
}

export function shouldExtend(remainingTTL: number, threshold: number): boolean {
  return remainingTTL <= threshold;
}

export async function checkEntryTTL(
  server: StellarSdk.rpc.Server,
  entry: WatchedEntry
): Promise<{ remainingTTL: number; wasmHash?: string } | null> {
  try {
    let ledgerKey: StellarSdk.xdr.LedgerKey;

    if (entry.durability === "Instance" || !entry.key) {
      const contract = new StellarSdk.Contract(entry.contractId);
      ledgerKey = contract.getFootprint();
    } else {
      ledgerKey = buildPersistentDataLedgerKey(entry.contractId, entry.key);
    }

    const response = await server.getLedgerEntries(ledgerKey);
    if (!response.entries || response.entries.length === 0) {
      console.warn(`[Poller] Ledger entry not found for entry ID ${entry.id}`);
      return null;
    }

    const ledgerEntry = response.entries[0];
    const liveUntil = ledgerEntry.liveUntilLedgerSeq;
    if (liveUntil === undefined) {
      console.warn(`[Poller] liveUntilLedgerSeq missing for entry ID ${entry.id}`);
      return null;
    }

    const latestLedger = response.latestLedger;
    const remainingTTL = calculateRemainingTTL(liveUntil, latestLedger);

    let wasmHash: string | undefined;
    if (entry.durability === "Instance" || !entry.key) {
      try {
        const instanceData = ledgerEntry.val.contractData().val().instance();
        const executable = instanceData.executable();
        if (executable.switch().name === "contractExecutableWasm") {
          wasmHash = executable.wasmHash().toString("hex");
        }
      } catch {
        // Fallback if structure varies
      }
    }

    return { remainingTTL, wasmHash };
  } catch (err) {
    console.error(`[Poller Error] Failed to check TTL for entry ${entry.id}:`, err);
    return null;
  }
}

export async function pollOrgEntries(
  registryClient: RegistryClient,
  server: StellarSdk.rpc.Server,
  orgAddress: string
): Promise<PendingExtension[]> {
  const entries = await registryClient.getOrgEntries(orgAddress);
  const pending: PendingExtension[] = [];

  for (const entry of entries) {
    const result = await checkEntryTTL(server, entry);
    if (result && shouldExtend(result.remainingTTL, entry.extendThresholdLedgers)) {
      pending.push({
        entry,
        remainingTTL: result.remainingTTL,
        wasmHash: result.wasmHash,
      });
    }
  }

  return pending;
}
