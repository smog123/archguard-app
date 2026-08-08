# Archguard App Monorepo (`archguard-app`)

`archguard-app` is the off-chain component of **Archguard**, an automated smart contract TTL extension and custody funding system built for Stellar Soroban.

## Structure

```
archguard-app/
├── package.json                 # root workspace config (npm workspaces)
├── tsconfig.base.json
├── .gitignore
├── .env.example
├── packages/
│   └── sdk/                     # Client SDK wrapping Soroban contract RPC calls
│       ├── src/
│       │   ├── registryClient.ts
│       │   ├── extenderClient.ts
│       │   ├── ttlExtension.ts  # ExtendFootprintTTLOp builder
│       │   ├── footprintKeys.ts # Ledger key encoders/decoders
│       │   ├── types.ts
│       │   └── readContractValue.ts
├── indexer/                     # Keeper daemon polling TTLs and submitting extensions
│   └── src/
│       ├── index.ts             # Entrypoint with node-cron schedule
│       ├── poller.ts            # TTL evaluation logic
│       ├── extender.ts          # Extension transaction execution & cost recording
│       ├── webhook.ts           # Alert webhook dispatcher
│       └── db.ts                # SQLite org -> webhook URL store
└── apps/
    └── web/                     # Next.js 15 App Router web dashboard
        └── src/
            ├── app/
            │   ├── page.tsx
            │   └── dashboard/page.tsx
            ├── components/
            │   ├── OrgOnboarding.tsx
            │   ├── AddEntryForm.tsx
            │   ├── WatchedEntryList.tsx
            │   └── BalanceCard.tsx
            └── lib/
                └── sdkClient.ts
```

## Contract ID Placeholders (`PENDING_DEPLOYMENT`)

Contract deployment addresses for `ARCHGUARD_REGISTRY_CONTRACT_ID` and `ARCHGUARD_EXTENDER_CONTRACT_ID` default to `PENDING_DEPLOYMENT`.
When Phase 8 deployment finishes, set the contract IDs in `.env` or your runtime environment.

## Development & Testing

### Installation
```bash
npm install
```

### Run SDK & Indexer Tests
```bash
# Run SDK unit & integration tests
npm test -w packages/sdk

# Run Indexer unit tests
npm test -w indexer
```

### Run Next.js Web Dashboard
```bash
npm run dev -w apps/web
```

### Build Everything
```bash
npm run build -w packages/sdk
npm run build -w indexer
npm run build -w apps/web
```
