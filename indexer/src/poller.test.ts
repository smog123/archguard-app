import { test } from "node:test";
import assert from "node:assert";
import * as StellarSdk from "@stellar/stellar-sdk";
import { calculateRemainingTTL, shouldExtend, checkEntryTTL } from "./poller";
import { WatchedEntry } from "@archguard/sdk";

test("poller threshold logic", async (t) => {
  await t.test("calculateRemainingTTL should compute correct difference", () => {
    const liveUntil = 1000;
    const latest = 800;
    assert.strictEqual(calculateRemainingTTL(liveUntil, latest), 200);
  });

  await t.test("calculateRemainingTTL should return 0 if expired", () => {
    const liveUntil = 500;
    const latest = 800;
    assert.strictEqual(calculateRemainingTTL(liveUntil, latest), 0);
  });

  await t.test("shouldExtend should return true when TTL <= threshold", () => {
    assert.strictEqual(shouldExtend(100, 200), true);
    assert.strictEqual(shouldExtend(200, 200), true);
  });

  await t.test("shouldExtend should return false when TTL > threshold", () => {
    assert.strictEqual(shouldExtend(300, 200), false);
  });

  await t.test("checkEntryTTL with mocked server getLedgerEntries", async () => {
    const mockServer = {
      getLedgerEntries: async () => ({
        latestLedger: 1000,
        entries: [
          {
            liveUntilLedgerSeq: 1200,
            val: {
              contractData: () => ({
                val: () => ({
                  instance: () => ({
                    executable: () => ({
                      switch: () => ({ name: "contractExecutableWasm" }),
                      wasmHash: () => Buffer.alloc(32, 5),
                    }),
                  }),
                }),
              }),
            },
          },
        ],
      }),
    } as any;

    const entry: WatchedEntry = {
      id: 1n,
      org: StellarSdk.Keypair.random().publicKey(),
      contractId: StellarSdk.StrKey.encodeContract(Buffer.alloc(32)),
      durability: "Instance",
      key: null,
      extendThresholdLedgers: 300,
      extendToLedgers: 1000,
      autoExtend: true,
      createdAt: 100n,
    };

    const res = await checkEntryTTL(mockServer, entry);
    assert.ok(res);
    assert.strictEqual(res?.remainingTTL, 200);
    assert.strictEqual(res?.wasmHash, Buffer.alloc(32, 5).toString("hex"));
  });
});
