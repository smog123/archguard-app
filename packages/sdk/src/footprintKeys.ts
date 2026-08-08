import * as StellarSdk from "@stellar/stellar-sdk";

export type KeyType = "symbol" | "string" | "u64" | "address";

export interface TypedKey {
  type: KeyType;
  value: string;
}

/**
 * Encodes a user-friendly TypedKey into an ScVal.
 */
export function encodeKey(typedKey: TypedKey): StellarSdk.xdr.ScVal {
  switch (typedKey.type) {
    case "symbol":
      return StellarSdk.xdr.ScVal.scvSymbol(typedKey.value);
    case "string":
      return StellarSdk.xdr.ScVal.scvString(typedKey.value);
    case "u64": {
      const val = BigInt(typedKey.value);
      return StellarSdk.xdr.ScVal.scvU64(
        new StellarSdk.xdr.Uint64(val)
      );
    }
    case "address":
      return StellarSdk.Address.fromString(typedKey.value).toScVal();
    default:
      throw new Error(`Unsupported key type: ${(typedKey as any).type}`);
  }
}

/**
 * Decodes an ScVal into a user-friendly TypedKey.
 */
export function decodeKey(scVal: StellarSdk.xdr.ScVal): TypedKey {
  const arm = scVal.switch().name;
  switch (arm) {
    case "scvSymbol":
      return { type: "symbol", value: scVal.sym().toString() };
    case "scvString":
      return { type: "string", value: scVal.str().toString() };
    case "scvU64": {
      const u64Val = scVal.u64();
      const bigVal = (BigInt(u64Val.high) << 32n) | BigInt(u64Val.low);
      return { type: "u64", value: bigVal.toString() };
    }
    case "scvAddress":
      return {
        type: "address",
        value: StellarSdk.Address.fromScVal(scVal).toString(),
      };
    default:
      throw new Error(`Unsupported ScVal type for decoding: ${arm}`);
  }
}

/**
 * Serializes an ScVal into an XDR Buffer.
 */
export function scValToBytes(scVal: StellarSdk.xdr.ScVal): Buffer {
  return scVal.toXDR();
}

/**
 * Deserializes an XDR Buffer/Uint8Array into an ScVal.
 */
export function bytesToScVal(bytes: Buffer | Uint8Array): StellarSdk.xdr.ScVal {
  return StellarSdk.xdr.ScVal.fromXDR(Buffer.from(bytes));
}
