import * as StellarSdk from "@stellar/stellar-sdk";
import { WatchedEntry, OrgConfig } from "./types";
import { bytesToScVal, scValToBytes } from "./footprintKeys";
import { readContractValue } from "./readContractValue";
import { submitTransaction } from "./submitTransaction";

export function bigintToScValU64(val: bigint): StellarSdk.xdr.ScVal {
  return StellarSdk.xdr.ScVal.scvU64(
    new StellarSdk.xdr.Uint64({
      low: Number(val & 0xffffffffn),
      high: Number(val >> 32n),
    })
  );
}

export function parseU64(scVal: StellarSdk.xdr.ScVal): bigint {
  const u64Val = scVal.u64();
  return (BigInt(u64Val.high) << 32n) | BigInt(u64Val.low);
}

export function parseWatchedEntry(scVal: StellarSdk.xdr.ScVal): WatchedEntry {
  const map = scVal.map();
  if (!map) throw new Error("Expected ScVal of type map for WatchedEntry");

  let id: bigint = 0n;
  let org: string = "";
  let contractId: string = "";
  let durability: "Instance" | "Persistent" = "Instance";
  let key: StellarSdk.xdr.ScVal | null = null;
  let extendThresholdLedgers: number = 0;
  let extendToLedgers: number = 0;
  let autoExtend: boolean = false;
  let createdAt: bigint = 0n;

  for (const entry of map) {
    const fieldName = entry.key().sym().toString();
    const val = entry.val();
    switch (fieldName) {
      case "id":
        id = parseU64(val);
        break;
      case "org":
        org = StellarSdk.Address.fromScVal(val).toString();
        break;
      case "contract_id":
        contractId = StellarSdk.Address.fromScVal(val).toString();
        break;
      case "durability": {
        const durSym = val.sym().toString();
        if (durSym === "Instance" || durSym === "Persistent") {
          durability = durSym;
        } else {
          throw new Error(`Invalid Durability variant: ${durSym}`);
        }
        break;
      }
      case "key": {
        if (val.arm() === "void") {
          key = null;
        } else {
          const bytes = val.bytes();
          key = bytesToScVal(bytes);
        }
        break;
      }
      case "extend_threshold_ledgers":
        extendThresholdLedgers = val.u32();
        break;
      case "extend_to_ledgers":
        extendToLedgers = val.u32();
        break;
      case "auto_extend":
        autoExtend = val.b();
        break;
      case "created_at":
        createdAt = parseU64(val);
        break;
    }
  }

  return {
    id,
    org,
    contractId,
    durability,
    key,
    extendThresholdLedgers,
    extendToLedgers,
    autoExtend,
    createdAt,
  };
}

export class RegistryClient {
  constructor(
    public contractId: string,
    public rpcUrl: string,
    public networkPassphrase: string
  ) {}

  /**
   * Registers a new organization with the registry.
   */
  async registerOrg(org: StellarSdk.Keypair, webhookHash: Buffer): Promise<void> {
    const scValOrg = StellarSdk.Address.fromString(org.publicKey()).toScVal();
    const scValAdmin = StellarSdk.Address.fromString(org.publicKey()).toScVal();
    const scValWebhook = StellarSdk.xdr.ScVal.scvBytes(webhookHash);

    await submitTransaction(
      this.rpcUrl,
      this.networkPassphrase,
      this.contractId,
      "register_org",
      [scValOrg, scValAdmin, scValWebhook],
      org
    );
  }

  /**
   * Adds a new watched entry for an organization and returns its generated entry ID.
   */
  async addWatchedEntry(
    org: StellarSdk.Keypair,
    entry: Omit<WatchedEntry, "id" | "createdAt" | "org">
  ): Promise<bigint> {
    const scValOrg = StellarSdk.Address.fromString(org.publicKey()).toScVal();
    const scValContract = StellarSdk.Address.fromString(entry.contractId).toScVal();
    const scValDurability = StellarSdk.xdr.ScVal.scvSymbol(entry.durability);

    const scValKey = entry.key
      ? StellarSdk.xdr.ScVal.scvBytes(scValToBytes(entry.key))
      : StellarSdk.xdr.ScVal.scvVoid();

    const scValThreshold = StellarSdk.xdr.ScVal.scvU32(entry.extendThresholdLedgers);
    const scValExtendTo = StellarSdk.xdr.ScVal.scvU32(entry.extendToLedgers);
    const scValAutoExtend = StellarSdk.xdr.ScVal.scvBool(entry.autoExtend);

    const result = await submitTransaction(
      this.rpcUrl,
      this.networkPassphrase,
      this.contractId,
      "add_watched_entry",
      [
        scValOrg,
        scValContract,
        scValDurability,
        scValKey,
        scValThreshold,
        scValExtendTo,
        scValAutoExtend,
      ],
      org
    );

    if (!result) {
      throw new Error("Failed to retrieve entry ID from add_watched_entry result");
    }

    return parseU64(result);
  }

  /**
   * Removes a watched entry.
   */
  async removeWatchedEntry(org: StellarSdk.Keypair, entryId: bigint): Promise<void> {
    const scValOrg = StellarSdk.Address.fromString(org.publicKey()).toScVal();
    const scValEntryId = bigintToScValU64(entryId);

    await submitTransaction(
      this.rpcUrl,
      this.networkPassphrase,
      this.contractId,
      "remove_watched_entry",
      [scValOrg, scValEntryId],
      org
    );
  }

  /**
   * Updates the extension policy parameters for an existing watched entry.
   */
  async updateEntryPolicy(
    org: StellarSdk.Keypair,
    entryId: bigint,
    thresholdLedgers: number,
    extendToLedgers: number,
    autoExtend: boolean
  ): Promise<void> {
    const scValOrg = StellarSdk.Address.fromString(org.publicKey()).toScVal();
    const scValEntryId = bigintToScValU64(entryId);
    const scValThreshold = StellarSdk.xdr.ScVal.scvU32(thresholdLedgers);
    const scValExtendTo = StellarSdk.xdr.ScVal.scvU32(extendToLedgers);
    const scValAutoExtend = StellarSdk.xdr.ScVal.scvBool(autoExtend);

    await submitTransaction(
      this.rpcUrl,
      this.networkPassphrase,
      this.contractId,
      "update_entry_policy",
      [scValOrg, scValEntryId, scValThreshold, scValExtendTo, scValAutoExtend],
      org
    );
  }

  /**
   * Reads all watched entries owned by an organization. Read-only.
   */
  async getOrgEntries(org: string): Promise<WatchedEntry[]> {
    const scValOrg = StellarSdk.Address.fromString(org).toScVal();
    const result = await readContractValue(
      this.rpcUrl,
      this.networkPassphrase,
      this.contractId,
      "get_org_entries",
      [scValOrg]
    );

    const vec = result.vec();
    if (!vec) return [];

    return vec.map((item) => parseWatchedEntry(item));
  }

  /**
   * Reads a single watched entry by its ID. Read-only.
   */
  async getEntry(entryId: bigint): Promise<WatchedEntry> {
    const scValEntryId = bigintToScValU64(entryId);
    const result = await readContractValue(
      this.rpcUrl,
      this.networkPassphrase,
      this.contractId,
      "get_entry",
      [scValEntryId]
    );

    return parseWatchedEntry(result);
  }

  /**
   * Deactivates an organization.
   */
  async deactivateOrg(org: StellarSdk.Keypair): Promise<void> {
    const scValOrg = StellarSdk.Address.fromString(org.publicKey()).toScVal();

    await submitTransaction(
      this.rpcUrl,
      this.networkPassphrase,
      this.contractId,
      "deactivate_org",
      [scValOrg],
      org
    );
  }
}
