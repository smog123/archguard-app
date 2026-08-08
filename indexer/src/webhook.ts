import { getWebhookUrl } from "./db";
import { WatchedEntry } from "@archguard/sdk";

export type AlertType = "THRESHOLD_BREACH" | "INSUFFICIENT_BALANCE";

export interface AlertPayload {
  event: AlertType;
  orgAddress: string;
  timestamp: string;
  data: {
    entryId?: string;
    contractId?: string;
    remainingTTL?: number;
    thresholdLedgers?: number;
    costStroops?: string;
    currentBalanceStroops?: string;
    message: string;
  };
}

export async function sendWebhookAlert(
  orgAddress: string,
  notifyWebhookHash: Buffer,
  payload: AlertPayload
): Promise<boolean> {
  const webhookUrl = getWebhookUrl(orgAddress, notifyWebhookHash);
  if (!webhookUrl) {
    console.warn(
      `[Webhook Warning] No verified webhook URL found for org ${orgAddress}. Alert suppressed.`
    );
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Archguard-Keeper-Indexer/1.0",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `[Webhook Error] Failed to deliver alert to ${webhookUrl}: Status ${response.status}`
      );
      return false;
    }

    console.log(
      `[Webhook Sent] Successfully dispatched ${payload.event} alert to ${webhookUrl}`
    );
    return true;
  } catch (err) {
    console.error(`[Webhook Exception] Error dispatching alert to ${webhookUrl}:`, err);
    return false;
  }
}

export async function notifyThresholdBreach(
  orgAddress: string,
  notifyWebhookHash: Buffer,
  entry: WatchedEntry,
  remainingTTL: number
): Promise<boolean> {
  return sendWebhookAlert(orgAddress, notifyWebhookHash, {
    event: "THRESHOLD_BREACH",
    orgAddress,
    timestamp: new Date().toISOString(),
    data: {
      entryId: entry.id.toString(),
      contractId: entry.contractId,
      remainingTTL,
      thresholdLedgers: entry.extendThresholdLedgers,
      message: `TTL for entry ${entry.id} (${entry.contractId}) dropped to ${remainingTTL} ledgers, breaching threshold ${entry.extendThresholdLedgers}.`,
    },
  });
}

export async function notifyInsufficientBalance(
  orgAddress: string,
  notifyWebhookHash: Buffer,
  costStroops: bigint,
  currentBalanceStroops: bigint
): Promise<boolean> {
  return sendWebhookAlert(orgAddress, notifyWebhookHash, {
    event: "INSUFFICIENT_BALANCE",
    orgAddress,
    timestamp: new Date().toISOString(),
    data: {
      costStroops: costStroops.toString(),
      currentBalanceStroops: currentBalanceStroops.toString(),
      message: `Org ${orgAddress} has insufficient balance (${currentBalanceStroops} stroops) to cover extension cost (${costStroops} stroops).`,
    },
  });
}
