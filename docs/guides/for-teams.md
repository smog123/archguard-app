# For Teams Guide

This guide walks through using the Archguard web dashboard to protect your Soroban contract entries.

## 1. Connect Wallet

1. Navigate to the Archguard Web Dashboard.
2. Click **Connect Wallet** in the top right header.
3. Select your Stellar wallet (such as Freighter) and approve the connection request.

## 2. Register Your Organization

1. Open the **Organization Registration** tab or click **Register Org**.
2. Enter your Organization Address (defaults to your connected wallet public key) and an Admin Address.
3. Provide your notification webhook URL (e.g. `https://api.yourorg.com/webhooks/archguard`). The dashboard computes the SHA-256 hash of the URL off-chain and stores only the hash on-chain to save storage fees.
4. Confirm and sign the `register_org` transaction in your wallet.

## 3. Prepay Maintenance Balance

1. Navigate to the **Custody & Balance** panel.
2. Enter the amount of native XLM you want to deposit into the `archguard-extender` contract.
3. Click **Deposit Funds** and sign the transaction.
4. Your current prepaid balance (measured in stroops) will update in the dashboard header.

## 4. Add Watched Entries

To monitor a contract or storage entry:

1. Click **Add Watched Entry**.
2. Fill in the entry parameters:
   - **Contract ID**: The C-address of the deployed Soroban contract.
   - **Durability**: Select `Instance` (for the contract executable/instance data) or `Persistent` (for persistent storage entries).
   - **Storage Key (Optional)**: For persistent entries, specify the key as hexadecimal bytes or raw string bytes. Leave blank if watching the entire contract instance.
   - **Threshold Ledgers**: How long before expiry Archguard should act. For example, setting `17280` ledgers (~1 day at 5 seconds per ledger) tells Archguard to trigger extension whenever less than 1 day remains.
   - **Target Extension Ledgers**: The ledger count to extend out to when triggered. For example, `518400` ledgers (~30 days).
   - **Auto Extend**: Enable automatic extension by the keeper network.
3. Click **Add Entry** and sign the `add_watched_entry` transaction.

## 5. Read Dashboard TTL Status

The dashboard main view displays a live table of all watched entries registered under your organization:

- **Entry ID**: Unique identifier assigned by the registry.
- **Contract & Key**: Target contract address and optional storage key snippet.
- **Durability & Policy**: `Instance` / `Persistent` status and ledger thresholds (`17280` -> `518400`).
- **Live TTL Status**: The current remaining ledger count fetched directly from Stellar RPC. Color badges indicate state:
  - **Green (Healthy)**: Remaining TTL is well above the threshold.
  - **Yellow (Due Soon)**: Remaining TTL is approaching or below the threshold.
  - **Red (Critical/Archived)**: TTL is near zero or archived.

## 6. Setting Up Webhook Alerts

When registering or updating your organization, your webhook hash is stored on-chain. When configuring your off-chain webhook receiver endpoint:

- **Threshold Breach Alerts**: Triggered when a watched entry's TTL drops below `extend_threshold_ledgers`.
- **Insufficient Balance Alerts**: Triggered if your prepaid XLM balance is insufficient to cover an automated extension transaction fee.
