# SDK Reference

The `@archguard/sdk` package provides TypeScript client wrappers for interacting with `archguard-registry` and `archguard-extender` via Soroban RPC.

## Installation

```bash
npm install @archguard/sdk @stellar/stellar-sdk
```

---

## `RegistryClient`

`RegistryClient` wraps calls to the `archguard-registry` contract.

```typescript
export class RegistryClient {
  constructor(
    public contractId: string,
    public rpcUrl: string,
    public networkPassphrase: string
  ) {}

  registerOrg(org: StellarSdk.Keypair, webhookHash: Uint8Array): Promise<void>;
  addWatchedEntry(
    org: StellarSdk.Keypair,
    entry: Omit<WatchedEntry, "id" | "createdAt" | "org">
  ): Promise<bigint>;
  removeWatchedEntry(org: StellarSdk.Keypair, entryId: bigint): Promise<void>;
  updateEntryPolicy(
    org: StellarSdk.Keypair,
    entryId: bigint,
    thresholdLedgers: number,
    extendToLedgers: number,
    autoExtend: boolean
  ): Promise<void>;
  getOrgEntries(org: string): Promise<WatchedEntry[]>;
  getEntry(entryId: bigint): Promise<WatchedEntry>;
  deactivateOrg(org: StellarSdk.Keypair): Promise<void>;
}
```

---

## `ExtenderClient`

`ExtenderClient` wraps calls to the `archguard-extender` contract.

```typescript
export class ExtenderClient {
  constructor(
    public contractId: string,
    public rpcUrl: string,
    public networkPassphrase: string
  ) {}

  deposit(org: StellarSdk.Keypair, amountStroops: bigint): Promise<void>;
  withdraw(org: StellarSdk.Keypair, amountStroops: bigint): Promise<void>;
  recordExtensionCost(
    operator: StellarSdk.Keypair,
    org: string,
    costStroops: bigint
  ): Promise<void>;
  getBalance(org: string): Promise<bigint>;
}
```

---

## End-to-End Usage Snippet

The following TypeScript example demonstrates registering an organization, depositing XLM custody funds, and adding a watched contract entry end-to-end:

```typescript
import * as StellarSdk from "@stellar/stellar-sdk";
import { RegistryClient, ExtenderClient } from "@archguard/sdk";

async function main() {
  const rpcUrl = "https://soroban-testnet.stellar.org";
  const networkPassphrase = "Test SDF Network ; July 2015";
  const registryContractId = "CDAONHGO63LZKXO42LJTZWGFP5VZRZJXREMU7VCAWDILXKHSPBZXZ6RA";
  const extenderContractId = "CBCK4CYVWNPVC3SJAQXUYYZUOWEKX7DQQJNNU25KZWHD43TICNIORWRF";

  const orgKeypair = StellarSdk.Keypair.fromSecret("SDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

  const registry = new RegistryClient(registryContractId, rpcUrl, networkPassphrase);
  const extender = new ExtenderClient(extenderContractId, rpcUrl, networkPassphrase);

  // 1. Register Organization with SHA-256 webhook hash
  const webhookUrl = "https://api.myorg.com/webhooks/archguard";
  const webhookHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(webhookUrl))
  );
  await registry.registerOrg(orgKeypair, webhookHash);
  console.log("Organization registered successfully.");

  // 2. Deposit 50 XLM (500,000,000 stroops) into custody
  const depositAmount = 500_000_000n;
  await extender.deposit(orgKeypair, depositAmount);
  const balance = await extender.getBalance(orgKeypair.publicKey());
  console.log(`Prepaid balance: ${balance} stroops`);

  // 3. Add Watched Persistent Storage Entry
  const entryId = await registry.addWatchedEntry(orgKeypair, {
    contractId: "CCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    durability: "Persistent",
    key: null, // Watch whole contract instance
    extendThresholdLedgers: 17280, // ~1 day at 5s/ledger
    extendToLedgers: 518400,       // ~30 days at 5s/ledger
    autoExtend: true,
  });

  console.log(`Watched entry added with ID: ${entryId}`);
}

main().catch(console.error);
```
