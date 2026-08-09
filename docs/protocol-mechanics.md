# Protocol Mechanics

Archguard's operational architecture is focused on entry tracking and off-chain extension coordination.

## Watched Entry Lifecycle

A watched entry transitions through the following states during its lifetime:

1. **Registered**: The organization adds an entry (contract address, durability level, and storage key) to the `archguard-registry` contract, specifying `extend_threshold_ledgers`, `extend_to_ledgers`, and `auto_extend`.
2. **Active Monitoring**: The off-chain keeper service polls the entry's live TTL on Stellar RPC.
3. **Threshold Triggered**: The entry's remaining TTL drops below `extend_threshold_ledgers`.
4. **Extension Submitted**: The keeper submits an `ExtendFootprintTTLOp` transaction to the Stellar network, extending the entry's live TTL to `extend_to_ledgers`.
5. **Fee Debit**: The keeper calls `record_extension_cost` on `archguard-extender`, debiting the actual network transaction fee (in stroops) from the organization's prepaid XLM balance.
6. **Returned to Active**: The entry's TTL is reset, and the keeper resumes polling.

An entry can be updated or removed from the watch-list by its owning organization at any time.

```
[Registered] ──> [Active Monitoring] ──(TTL < Threshold)──> [Extension Submitted]
                        │                                          │
                        │                                          ▼
                  [Removed by Org]                        [Balance Debited]
                                                                   │
                                                                   ▼
                                                          [Active Monitoring]
```

## Economic & Payment Model

Archguard uses a direct prepayment mechanism rather than a protocol token or reward system:

- **Prepaid XLM Deposits**: Organizations deposit native XLM into custody at `archguard-extender`.
- **Direct Fee Accounting**: When the keeper executes an `ExtendFootprintTTLOp` transaction, it incurs network gas and transaction fees. It then calls `record_extension_cost(org, cost)` to deduct the exact cost from the organization's balance.
- **Underfunded Handling**: If an organization's balance is lower than the extension cost, `record_extension_cost` emits an `insufficient_balance` event and returns `Ok(())` without reverting, allowing the keeper to process the status and alert the organization without dropping state updates.

## Worked Execution Example

Consider a watched persistent entry configured with standard policy values:

- `extend_threshold_ledgers`: `17280` ledgers (~1 day assuming 5 seconds per ledger).
- `extend_to_ledgers`: `518400` ledgers (~30 days assuming 5 seconds per ledger).
- Poll Interval: `300` seconds (5 minutes).

### Step-by-Step Scenario

1. **State at Poll Cycle T**:
   - The entry's remaining TTL is measured at `17300` ledgers.
   - Because `17300 > 17280`, no extension is triggered.

2. **State at Poll Cycle T + 5 min**:
   - 60 ledgers pass during the 300-second interval. The remaining TTL drops to `17240` ledgers.
   - The keeper detects `17240 <= 17280` (`extend_threshold_ledgers`).

3. **Extension Execution**:
   - The keeper constructs and signs an `ExtendFootprintTTLOp` transaction footprint targeting the entry, setting `extendTo = 518400`.
   - The transaction submits successfully on-chain. The entry's live TTL is renewed to `518400` ledgers out from the current ledger.

4. **Fee Settlement**:
   - The keeper measures the total transaction fee spent (e.g. 1000 stroops).
   - The keeper invokes `record_extension_cost(org, 1000)` on `archguard-extender`.
   - The organization's balance is debited by 1000 stroops, emitting an `ExtensionCharged` event.
