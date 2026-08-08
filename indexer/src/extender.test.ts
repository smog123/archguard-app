import { test } from "node:test";
import assert from "node:assert";
import * as StellarSdk from "@stellar/stellar-sdk";
import { processExtension } from "./extender";
import { WatchedEntry, ExtenderClient } from "@archguard/sdk";

test("extender happy path", async (t) => {
  await t.test(
    "processExtension should call extendInstanceAndCodeTtl and recordExtensionCost",
    async () => {
      let recordCostCalled = false;

      // Mock RPC Server methods
      const origGetAccount = StellarSdk.rpc.Server.prototype.getAccount;
      const origPrepare = StellarSdk.rpc.Server.prototype.prepareTransaction;
      const origSend = StellarSdk.rpc.Server.prototype.sendTransaction;

      StellarSdk.rpc.Server.prototype.getAccount = async function (pubkey: string) {
        return new StellarSdk.Account(pubkey, "100");
      };
      StellarSdk.rpc.Server.prototype.prepareTransaction = async function (tx: any) {
        return tx;
      };
      StellarSdk.rpc.Server.prototype.sendTransaction = async function () {
        return {
          status: "PENDING",
          hash: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          latestLedger: 100,
          latestLedgerCloseTime: 12345,
        } as any;
      };

      t.after(() => {
        StellarSdk.rpc.Server.prototype.getAccount = origGetAccount;
        StellarSdk.rpc.Server.prototype.prepareTransaction = origPrepare;
        StellarSdk.rpc.Server.prototype.sendTransaction = origSend;
      });

      const mockExtenderClient = {
        recordExtensionCost: async (_operator: any, _org: string, cost: bigint) => {
          recordCostCalled = true;
          assert.strictEqual(cost, 100n);
        },
      } as unknown as ExtenderClient;

      const operatorKeypair = StellarSdk.Keypair.random();
      const entry: WatchedEntry = {
        id: 1n,
        org: StellarSdk.Keypair.random().publicKey(),
        contractId: StellarSdk.StrKey.encodeContract(Buffer.alloc(32)),
        durability: "Instance",
        key: null,
        extendThresholdLedgers: 200,
        extendToLedgers: 1000,
        autoExtend: true,
        createdAt: 100n,
      };

      const pending = {
        entry,
        remainingTTL: 150,
        wasmHash: Buffer.alloc(32, 1).toString("hex"),
      };

      const result = await processExtension(mockExtenderClient, operatorKeypair, pending);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.costStroops, 100n);
      assert.strictEqual(recordCostCalled, true);
    }
  );
});
