import { RegistryClient, ExtenderClient } from "@archguard/sdk";

export const rpcUrl =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";

export const networkPassphrase =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
  "Test SDF Network ; September 2015";

export const registryContractId =
  process.env.NEXT_PUBLIC_ARCHGUARD_REGISTRY_CONTRACT_ID || "PENDING_DEPLOYMENT";

export const extenderContractId =
  process.env.NEXT_PUBLIC_ARCHGUARD_EXTENDER_CONTRACT_ID || "PENDING_DEPLOYMENT";

export const registryClient = new RegistryClient(
  registryContractId,
  rpcUrl,
  networkPassphrase
);

export const extenderClient = new ExtenderClient(
  extenderContractId,
  rpcUrl,
  networkPassphrase
);
