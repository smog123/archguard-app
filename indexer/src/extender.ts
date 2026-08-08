import * as StellarSdk from "@stellar/stellar-sdk";
import {
  ExtenderClient,
  extendInstanceAndCodeTtl,
  extendPersistentDataTtl,
} from "@archguard/sdk";
import { PendingExtension } from "./poller";
import { config } from "./config";

export async function processExtension(
  extenderClient: ExtenderClient,
  operatorKeypair: StellarSdk.Keypair,
  pending: PendingExtension
): Promise<{ success: boolean; costStroops: bigint }> {
  const { entry, wasmHash } = pending;
  const { contractId, durability, key, extendToLedgers, org } = entry;

  try {
    let result: StellarSdk.rpc.Api.SendTransactionResponse;

    if (durability === "Instance" || !key) {
      if (!wasmHash) {
        throw new Error(`Wasm hash unavailable for contract instance ${contractId}`);
      }
      result = await extendInstanceAndCodeTtl(
        config.stellarRpcUrl,
        config.stellarNetworkPassphrase,
        contractId,
        wasmHash,
        extendToLedgers,
        operatorKeypair
      );
    } else {
      result = await extendPersistentDataTtl(
        config.stellarRpcUrl,
        config.stellarNetworkPassphrase,
        contractId,
        key,
        extendToLedgers,
        operatorKeypair
      );
    }

    if (result.status === "ERROR") {
      console.error(
        `[Extender Error] TTL extension submission error for entry ${entry.id}`
      );
      return { success: false, costStroops: 0n };
    }

    // Standard inclusion/resource fee cost in stroops
    const costStroops = 100n;

    // Record extension cost on-chain in extender contract
    await extenderClient.recordExtensionCost(operatorKeypair, org, costStroops);

    console.log(
      `[Extender Success] Re-extended entry ${entry.id} (contract: ${contractId}) to ${extendToLedgers} ledgers.`
    );
    return { success: true, costStroops };
  } catch (err) {
    console.error(`[Extender Failure] Failed processing extension for entry ${entry.id}:`, err);
    return { success: false, costStroops: 0n };
  }
}
