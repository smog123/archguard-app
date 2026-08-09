# For Keeper Operators Guide

This guide covers operational setup and maintenance for running the Archguard keeper service (`indexer`).

## Prerequisites & Requirements

To run a keeper instance, operators require:

- Node.js (v18+ or v20+ recommended).
- Access to a Stellar RPC node endpoint (e.g. `https://soroban-testnet.stellar.org`).
- `KEEPER_OPERATOR_SECRET`: A secret key for a funded Stellar account matching the operator address configured on the `archguard-extender` contract.

## Environment Configuration

Configure the indexer environment via `.env` or system environment variables:

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

## Poll Cycle Execution Logic

On every scheduled poll cycle (default every 300 seconds), the keeper executes the following workflow:

1. **Fetch Active Entries**: Calls `get_org_entries` across active organizations registered in `archguard-registry`.
2. **Query Live TTL**: Queries live entry TTL values from the Stellar RPC server via `getLedgerEntries`.
3. **Threshold Evaluation**: Compares remaining TTL ledgers against each entry's `extend_threshold_ledgers`.
4. **Submit Extensions**: For entries where `remaining_ttl <= extend_threshold_ledgers` and `auto_extend == true`:
   - Builds and submits an `ExtendFootprintTTLOp` transaction extending the TTL to `extend_to_ledgers`.
   - Records the transaction fee (in stroops).
5. **Debit Organization Balance**: Calls `record_extension_cost(org, fee)` on `archguard-extender`.
6. **Dispatch Webhooks**: If an entry threshold is breached or an organization balance is insufficient, dispatches a notification payload to the registered webhook URL.

## Operational Monitoring & Health Checks

The keeper service exposes an HTTP server on the configured `PORT` (default `10000`) for infrastructure health checks:

- **Health Endpoint**: `GET /`
- **Expected Response**:
  ```json
  {
    "status": "ok",
    "service": "archguard-indexer",
    "network": "testnet",
    "timestamp": "2026-08-08T21:30:00.000Z"
  }
  ```

## Handling Insufficient Balance Events

If an organization's prepaid balance is less than the transaction extension fee:

- The `record_extension_cost` call emits an `insufficient_balance` event and returns `Ok(())` on-chain.
- The keeper logs an `[Insufficient Balance]` event and dispatches an HTTP POST webhook alert to the organization's webhook URL.
- **Operator Action**: Notify the organization administrator to deposit additional XLM funds into `archguard-extender`. The keeper will automatically retry extensions on subsequent poll cycles once funds are replenished.
