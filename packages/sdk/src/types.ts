import * as StellarSdk from "@stellar/stellar-sdk";

export type Durability = "Instance" | "Persistent";

export interface OrgConfig {
  admin: string;             // Stellar address
  notifyWebhookHash: Uint8Array; // 32 bytes hash of the webhook URL
  active: boolean;
}

export interface WatchedEntry {
  id: bigint;
  org: string;               // Stellar address
  contractId: string;        // Stellar address
  durability: Durability;
  key: StellarSdk.xdr.ScVal | null; // null = watch instance/code; Some = specific persistent key
  extendThresholdLedgers: number;
  extendToLedgers: number;
  autoExtend: boolean;
  createdAt: bigint;
}
