import { test } from "node:test";
import assert from "node:assert";
import * as StellarSdk from "@stellar/stellar-sdk";
import { encodeKey, decodeKey, scValToBytes, bytesToScVal } from "./footprintKeys";

test("footprintKeys encoding and decoding", async (t) => {
  await t.test("should encode and decode symbol key", () => {
    const key = { type: "symbol" as const, value: "admin" };
    const scVal = encodeKey(key);
    assert.strictEqual(scVal.switch().name, "scvSymbol");
    assert.strictEqual(scVal.sym().toString(), "admin");

    const decoded = decodeKey(scVal);
    assert.deepStrictEqual(decoded, key);
  });

  await t.test("should encode and decode string key", () => {
    const key = { type: "string" as const, value: "hello" };
    const scVal = encodeKey(key);
    assert.strictEqual(scVal.switch().name, "scvString");
    assert.strictEqual(scVal.str().toString(), "hello");

    const decoded = decodeKey(scVal);
    assert.deepStrictEqual(decoded, key);
  });

  await t.test("should encode and decode u64 key", () => {
    const key = { type: "u64" as const, value: "1234567890" };
    const scVal = encodeKey(key);
    assert.strictEqual(scVal.switch().name, "scvU64");

    const decoded = decodeKey(scVal);
    assert.deepStrictEqual(decoded, key);
  });

  await t.test("should encode and decode address key", () => {
    const keypair = StellarSdk.Keypair.random();
    const key = {
      type: "address" as const,
      value: keypair.publicKey(),
    };
    const scVal = encodeKey(key);
    assert.strictEqual(scVal.switch().name, "scvAddress");

    const decoded = decodeKey(scVal);
    assert.deepStrictEqual(decoded, key);
  });

  await t.test("should serialize and deserialize ScVal to bytes", () => {
    const scVal = StellarSdk.xdr.ScVal.scvSymbol("hello");
    const bytes = scValToBytes(scVal);
    assert(bytes instanceof Buffer);

    const deserialized = bytesToScVal(bytes);
    assert.strictEqual(deserialized.switch().name, "scvSymbol");
    assert.strictEqual(deserialized.sym().toString(), "hello");
  });
});
