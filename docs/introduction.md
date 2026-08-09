# Introduction

Archguard is automated infrastructure for time-to-live (TTL) monitoring and extension on the Stellar Soroban network.

## The State Archival Problem

In Soroban, every contract instance, Wasm code entry, and storage entry (temporary or persistent) has a time-to-live (TTL) counter measured in ledgers.

To renew an entry's TTL, network participants submit an `ExtendFootprintTTLOp` transaction footprint. This operation is a ledger-level transaction with no contract-side permission gate; any valid Stellar account can pay network fees to extend any storage entry on the network.

If an entry's TTL reaches zero, it becomes archived. Archived entries cannot be read or modified by contract invocations until a restoration operation is processed.

Protocol 23 introduces automatic entry restoration when an archived entry is directly touched during a normal contract invocation. However, state archival remains a risk for specific categories of entries:

- **Dormant State Entries**: Persistent contract storage keys that are accessed infrequently or only under specific, periodic conditions (e.g. emergency admin keys, seasonal reward tables, or historic records).
- **Contract Instances and Wasm Entries**: Contract executable code and instance data where reliance on incidental user traffic is unreliable for maintaining continuous availability.

Archguard addresses this gap by monitoring targeted contract entries off-chain and renewing their TTL footprint before expiry thresholds are reached.

## How Archguard Works

Archguard operates through four sequential steps:

1. **Register Organization**: An organization registers its Stellar account address and notification webhook hash on the `archguard-registry` contract.
2. **Add Watched Entries**: The organization adds contract addresses, storage keys, durability levels, threshold ledgers, and extension target lengths to its watch-list.
3. **Fund Prepaid Balance**: The organization deposits native XLM into the `archguard-extender` contract.
4. **Automated Monitoring and Extension**: The off-chain keeper polls watched entry TTLs via Stellar RPC. When an entry's remaining TTL drops below its configured threshold, the keeper submits an `ExtendFootprintTTLOp` transaction on-chain, debits the transaction cost from the organization's prepaid XLM balance via `record_extension_cost`, and triggers webhook alerts if thresholds are breached or balances run low.
