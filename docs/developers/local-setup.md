# Local Setup Guide

This guide provides instructions for cloning, configuring, and running the Archguard contract repository (`archguard-contract`) and application monorepo (`archguard-app`) locally.

## Repositories Overview

Archguard consists of two companion repositories:

- **Contracts Repository (`archguard-contract` / `ArchGuard`)**: Contains the Rust Soroban smart contracts (`archguard-registry` and `archguard-extender`).
- **Applications Repository (`archguard-app`)**: Contains the monorepo for `@archguard/sdk`, `indexer` (keeper service), and `apps/web` (Next.js dashboard).

---

## 1. Prerequisites

Ensure the following tools are installed:

- **Rust & WebAssembly Target**:
  ```bash
  rustup target add wasm32v1-none
  ```
- **Stellar CLI**:
  ```bash
  cargo install --locked stellar-cli
  ```
- **Node.js & npm**: Node.js v18+ or v20+.

---

## 2. Setting Up Contracts (`archguard-contract`)

For detailed build and test commands, refer to the [ArchGuard README](file:///home/smog/ArchGuard/README.md).

```bash
# Clone the repository
git clone https://github.com/smog123/archguard-contract.git
cd archguard-contract

# Run unit and integration tests
cargo test

# Build optimized WebAssembly contract targets
stellar contract build
```

---

## 3. Setting Up Applications (`archguard-app`)

For complete workspace documentation, refer to the [archguard-app README](file:///home/smog/archguard-app/README.md).

```bash
# Clone the repository
git clone https://github.com/smog123/archguard-app.git
cd archguard-app

# 1. Install dependencies across all workspaces
npm install

# 2. Configure environment variables
cp .env.example .env
```

Update your local `.env` file based on `.env.example`:

```env
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; July 2015"
REGISTRY_CONTRACT_ID=CDAONHGO63LZKXO42LJTZWGFP5VZRZJXREMU7VCAWDILXKHSPBZXZ6RA
EXTENDER_CONTRACT_ID=CBCK4CYVWNPVC3SJAQXUYYZUOWEKX7DQQJNNU25KZWHD43TICNIORWRF
KEEPER_OPERATOR_SECRET=SDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
INDEXER_POLL_INTERVAL_SECONDS=300
PORT=10000
```

---

## 4. Building & Running Monorepo Workspaces

### Build and Test SDK (`packages/sdk`)
```bash
npm run build -w packages/sdk
npm test -w packages/sdk
```

### Run Keeper Indexer (`indexer`)
```bash
npm test -w indexer
npm run build -w indexer
npm start -w indexer
```

### Run Web Dashboard (`apps/web`)
```bash
npm run dev -w apps/web
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
