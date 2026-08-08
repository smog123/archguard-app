<!-- BANNER — manual follow-up: replace with a real banner image (e.g. repo
     social preview) before Wave review. Do not ship the placeholder. -->
![Archguard App](https://placehold.co/1200x300/090d16/06b6d4/png?text=Archguard+App)

# Archguard App

Off-chain half of **Archguard** — the keeper and dashboard that keep your
Stellar Soroban contracts alive.

## Table of Contents

- [What it does](#what-it-does)
- [Maintainers](#maintainers)
- [Quick start](#quick-start)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [Contributors](#contributors)
- [About](#about)

## What it does

Archguard watches deployed Soroban contracts and auto-extends their storage
TTL before entries get archived. This monorepo contains the off-chain pieces:
a TypeScript SDK wrapping the contract RPC calls, a keeper indexer that polls
due entries and submits extensions, and a Next.js dashboard for orgs to prepay
custody balances and manage watched entries.

## Maintainers

| Photo | Name | Role | GitHub | Telegram |
| --- | --- | --- | --- | --- |
| ![avatar](https://github.com/smog123.png?size=64) | **[Your Name]** | Maintainer | [@smog123](https://github.com/smog123) | **[Your Telegram]** |

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (contract IDs default to PENDING_DEPLOYMENT = simulated mode)
cp .env.example .env
#   then set KEEPER_OPERATOR_SECRET and your contract IDs

# 3. Build + test the SDK
npm run build -w packages/sdk
npm test -w packages/sdk

# 4. Test + run the keeper indexer
npm test -w indexer
npm run build -w indexer
npm start -w indexer

# 5. Run the web dashboard
npm run dev -w apps/web    # http://localhost:3000
```

## Architecture

Three workspaces: `packages/sdk` wraps Soroban RPC (registry/extender
clients, TTL extension builder, ledger-key encoders); `indexer` is the keeper
daemon that polls TTLs on a cron schedule, submits
`ExtendFootprintTTLOp` extensions, records costs on-chain, and fires alert
webhooks; `apps/web` is a Next.js 15 dashboard for orgs to register, prepay
XLM, and track watched entries. The on-chain contracts live in the
[archguard-contract](https://github.com/smog123/archguard-contract) repo.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please report security issues
privately — see [SECURITY.md](SECURITY.md).

## Contributors

[![Contributors](https://contrib.rocks/image?repo=smog123/archguard-app)](https://github.com/smog123/archguard-app/graphs/contributors)

## About

Live dashboard: [archguard-app on Vercel](https://archguard-app-e67xx0s07-smog3.vercel.app)
(testnet).
