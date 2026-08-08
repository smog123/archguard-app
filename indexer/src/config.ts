import dotenv from "dotenv";
import path from "path";
import * as StellarSdk from "@stellar/stellar-sdk";

// Load environment variables from the workspace root or local path
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config();

export interface Config {
  stellarNetwork: string;
  stellarRpcUrl: string;
  stellarNetworkPassphrase: string;
  registryContractId: string;
  extenderContractId: string;
  keeperOperatorSecret: string;
  indexerPollIntervalSeconds: number;
  webhookDbUrl: string;
}

function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${name} is missing`);
  }
  return value;
}

let keeperSecret = process.env.KEEPER_OPERATOR_SECRET;
if (!keeperSecret) {
  // Fallback to random keypair secret for testing/development to prevent boot crashes
  const fallbackKeypair = StellarSdk.Keypair.random();
  console.warn(
    `[Config WARNING] KEEPER_OPERATOR_SECRET not set. Falling back to dynamic keypair for testing: ${fallbackKeypair.publicKey()}`
  );
  keeperSecret = fallbackKeypair.secret();
}

export const config: Config = {
  stellarNetwork: getEnv("STELLAR_NETWORK", "testnet"),
  stellarRpcUrl: getEnv("STELLAR_RPC_URL", "https://soroban-testnet.stellar.org"),
  stellarNetworkPassphrase: getEnv(
    "STELLAR_NETWORK_PASSPHRASE",
    "Test SDF Network ; September 2015"
  ),
  registryContractId: getEnv("ARCHGUARD_REGISTRY_CONTRACT_ID", "PENDING_DEPLOYMENT"),
  extenderContractId: getEnv("ARCHGUARD_EXTENDER_CONTRACT_ID", "PENDING_DEPLOYMENT"),
  keeperOperatorSecret: keeperSecret,
  indexerPollIntervalSeconds: parseInt(getEnv("INDEXER_POLL_INTERVAL_SECONDS", "300"), 10),
  webhookDbUrl: getEnv("WEBHOOK_DB_URL", "webhooks.db"),
};
