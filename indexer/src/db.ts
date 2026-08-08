import Database from "better-sqlite3";
import crypto from "crypto";
import { config } from "./config";

export function computeWebhookHash(url: string): Buffer {
  return crypto.createHash("sha256").update(url).digest();
}

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(config.webhookDbUrl);
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS org_webhooks (
        org_address TEXT PRIMARY KEY,
        webhook_url TEXT NOT NULL,
        url_hash BLOB NOT NULL
      );
    `);
  }
  return dbInstance;
}

export function saveWebhook(orgAddress: string, webhookUrl: string): void {
  const db = getDb();
  const hash = computeWebhookHash(webhookUrl);
  const stmt = db.prepare(`
    INSERT INTO org_webhooks (org_address, webhook_url, url_hash)
    VALUES (?, ?, ?)
    ON CONFLICT(org_address) DO UPDATE SET
      webhook_url = excluded.webhook_url,
      url_hash = excluded.url_hash;
  `);
  stmt.run(orgAddress, webhookUrl, hash);
}

export function getWebhookUrl(orgAddress: string, expectedHash: Buffer): string | null {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT webhook_url, url_hash FROM org_webhooks WHERE org_address = ?
  `);
  const row = stmt.get(orgAddress) as { webhook_url: string; url_hash: Buffer } | undefined;

  if (!row) {
    return null;
  }

  const computedHash = computeWebhookHash(row.webhook_url);
  if (Buffer.compare(computedHash, expectedHash) !== 0) {
    console.warn(
      `[Webhook DB Warning] Mismatched webhook hash for org ${orgAddress}. On-chain hash does not match stored URL hash.`
    );
    return null;
  }

  return row.webhook_url;
}
