import { test } from "node:test";
import assert from "node:assert";
import * as StellarSdk from "@stellar/stellar-sdk";
import { RegistryClient } from "./registryClient";
import { ExtenderClient } from "./extenderClient";

test("RegistryClient and ExtenderClient integration with mocked RPC", async (t) => {
  const contractId = StellarSdk.StrKey.encodeContract(Buffer.alloc(32));
  const rpcUrl = "https://mocked-rpc.stellar.org";
  const networkPassphrase = "Test SDF Network ; September 2015";

  // Save the original Server methods
  const originalSimulate = StellarSdk.rpc.Server.prototype.simulateTransaction;
  const originalGetAccount = StellarSdk.rpc.Server.prototype.getAccount;
  const originalPrepare = StellarSdk.rpc.Server.prototype.prepareTransaction;
  const originalSend = StellarSdk.rpc.Server.prototype.sendTransaction;
  const originalPoll = StellarSdk.rpc.Server.prototype.pollTransaction;

  t.after(() => {
    // Restore original methods
    StellarSdk.rpc.Server.prototype.simulateTransaction = originalSimulate;
    StellarSdk.rpc.Server.prototype.getAccount = originalGetAccount;
    StellarSdk.rpc.Server.prototype.prepareTransaction = originalPrepare;
    StellarSdk.rpc.Server.prototype.sendTransaction = originalSend;
    StellarSdk.rpc.Server.prototype.pollTransaction = originalPoll;
  });

  // Mock getAccount to return a dummy account
  StellarSdk.rpc.Server.prototype.getAccount = async function (pubkey: string) {
    return new StellarSdk.Account(pubkey, "100");
  };

  // Mock prepareTransaction to return the transaction as-is
  StellarSdk.rpc.Server.prototype.prepareTransaction = async function (tx: any) {
    return tx;
  };

  // Mock sendTransaction to return PENDING status
  StellarSdk.rpc.Server.prototype.sendTransaction = async function () {
    return {
      status: "PENDING",
      hash: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      latestLedger: 100,
      latestLedgerCloseTime: 12345,
    } as any;
  };

  // Mock pollTransaction
  let mockPollResult: any = {
    status: "SUCCESS",
    returnValue: StellarSdk.xdr.ScVal.scvVoid(),
  };
  StellarSdk.rpc.Server.prototype.pollTransaction = async function () {
    return mockPollResult;
  };

  // Mock simulateTransaction
  let mockSimResult: any = {
    _parsed: true,
    latestLedger: 100,
    events: [],
    minResourceFee: "100",
    transactionData: new StellarSdk.SorobanDataBuilder().build(),
    result: {
      auth: [],
      retval: StellarSdk.xdr.ScVal.scvVoid(),
    },
  };
  StellarSdk.rpc.Server.prototype.simulateTransaction = async function () {
    return mockSimResult;
  };

  const orgKeypair = StellarSdk.Keypair.random();
  const registry = new RegistryClient(contractId, rpcUrl, networkPassphrase);
  const extender = new ExtenderClient(contractId, rpcUrl, networkPassphrase);

  await t.test("registerOrg should invoke register_org contract method", async () => {
    mockPollResult = {
      status: "SUCCESS",
      returnValue: StellarSdk.xdr.ScVal.scvVoid(),
    };
    await registry.registerOrg(orgKeypair, Buffer.alloc(32));
    // If it reaches here without throwing, the mocked transaction flow succeeded!
  });

  await t.test("addWatchedEntry should return the entry ID from mock result", async () => {
    mockPollResult = {
      status: "SUCCESS",
      returnValue: StellarSdk.xdr.ScVal.scvU64(new StellarSdk.xdr.Uint64(42n)),
    };

    const watchContractId = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 1));
    const entryId = await registry.addWatchedEntry(orgKeypair, {
      contractId: watchContractId,
      durability: "Instance",
      key: null,
      extendThresholdLedgers: 100,
      extendToLedgers: 500,
      autoExtend: true,
    });

    assert.strictEqual(entryId, 42n);
  });

  await t.test("getBalance should return balance from mock result", async () => {
    mockSimResult = {
      _parsed: true,
      latestLedger: 100,
      events: [],
      minResourceFee: "100",
      transactionData: new StellarSdk.SorobanDataBuilder().build(),
      result: {
        auth: [],
        retval: StellarSdk.nativeToScVal(5000000n, { type: "i128" }),
      },
    };

    const balance = await extender.getBalance(orgKeypair.publicKey());
    assert.strictEqual(balance, 5000000n);
  });
});
