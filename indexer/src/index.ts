import http from "http";
import cron from "node-cron";
import * as StellarSdk from "@stellar/stellar-sdk";
import { RegistryClient, ExtenderClient } from "@archguard/sdk";
import { config } from "./config";
import { checkEntryTTL, shouldExtend } from "./poller";
import { processExtension } from "./extender";
import { notifyThresholdBreach, notifyInsufficientBalance } from "./webhook";

console.log("==================================================");
console.log("Starting Archguard Indexer Service (Keeper)");
console.log(`Network: ${config.stellarNetwork}`);
console.log(`RPC URL: ${config.stellarRpcUrl}`);
console.log(`Registry Contract: ${config.registryContractId}`);
console.log(`Extender Contract: ${config.extenderContractId}`);
console.log(`Poll Interval: ${config.indexerPollIntervalSeconds}s`);
console.log("==================================================");

// HTTP Health Check Endpoint for Render / Web Service monitoring
const port = process.env.PORT || 10000;
const healthServer = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "ok",
      service: "archguard-indexer",
      network: config.stellarNetwork,
      timestamp: new Date().toISOString(),
    })
  );
});

healthServer.listen(Number(port), "0.0.0.0", () => {
  console.log(`HTTP Health Check server listening on 0.0.0.0:${port}`);
});

const server = new StellarSdk.rpc.Server(config.stellarRpcUrl);
const registryClient = new RegistryClient(
  config.registryContractId,
  config.stellarRpcUrl,
  config.stellarNetworkPassphrase
);
const extenderClient = new ExtenderClient(
  config.extenderContractId,
  config.stellarRpcUrl,
  config.stellarNetworkPassphrase
);

let operatorKeypair: StellarSdk.Keypair;
try {
  operatorKeypair = StellarSdk.Keypair.fromSecret(config.keeperOperatorSecret);
  console.log(`Keeper Operator Public Key: ${operatorKeypair.publicKey()}`);
} catch (err) {
  console.error("Invalid KEEPER_OPERATOR_SECRET provided in configuration:", err);
  operatorKeypair = StellarSdk.Keypair.random();
}

/**
 * Runs a single poll iteration across all watched entries.
 */
export async function runPollIteration(): Promise<void> {
  console.log(`[Keeper Run] Starting poll iteration at ${new Date().toISOString()}`);

  if (
    config.registryContractId === "PENDING_DEPLOYMENT" ||
    config.extenderContractId === "PENDING_DEPLOYMENT"
  ) {
    console.log(
      "[Keeper Run] Contract IDs set to PENDING_DEPLOYMENT. Skipping RPC calls until Phase 8."
    );
    return;
  }

  // Implementation will iterate entries when contracts are live
}

const minutes = Math.max(1, Math.floor(config.indexerPollIntervalSeconds / 60));
const cronSchedule = config.indexerPollIntervalSeconds >= 60 ? `*/${minutes} * * * *` : "* * * * *";

console.log(`Scheduling keeper poll loop with cron expression: '${cronSchedule}'`);

// Trigger an initial run immediately
runPollIteration().catch((err) =>
  console.error("[Keeper Run Error] Unhandled exception in initial iteration:", err)
);

cron.schedule(cronSchedule, () => {
  runPollIteration().catch((err) =>
    console.error("[Keeper Run Error] Unhandled exception in scheduled iteration:", err)
  );
});
