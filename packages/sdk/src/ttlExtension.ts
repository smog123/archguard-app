import * as StellarSdk from "@stellar/stellar-sdk";

/**
 * Extends the TTL of a watched contract's instance and code.
 */
export async function extendInstanceAndCodeTtl(
  rpcUrl: string,
  networkPassphrase: string,
  contractId: string,
  wasmHash: string, // hex string
  extendToLedgers: number,
  sourceKeypair: StellarSdk.Keypair
) {
  const server = new StellarSdk.rpc.Server(rpcUrl);
  const account = await server.getAccount(sourceKeypair.publicKey());
  const fee = "100"; // inclusion fee, resource fee is added by prepareTransaction

  const contract = new StellarSdk.Contract(contractId);
  const instanceKey = contract.getFootprint(); // ledger key for the contract instance

  const codeKey = StellarSdk.xdr.LedgerKey.contractCode(
    new StellarSdk.xdr.LedgerKeyContractCode({
      hash: Buffer.from(wasmHash, "hex"),
    })
  );

  const sorobanData = new StellarSdk.SorobanDataBuilder()
    .setReadOnly([instanceKey, codeKey])
    .build();

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee,
    networkPassphrase,
  })
    .setSorobanData(sorobanData)
    .addOperation(
      StellarSdk.Operation.extendFootprintTtl({ extendTo: extendToLedgers })
    )
    .setTimeout(30)
    .build();

  // prepareTransaction runs simulation and fills in the correct resource fee
  const prepared = await server.prepareTransaction(transaction);
  prepared.sign(sourceKeypair);
  const result = await server.sendTransaction(prepared);
  return result;
}

/**
 * For extending a PERSISTENT DATA entry (WatchedEntry.key === Some(...) case)
 */
export function buildPersistentDataLedgerKey(
  contractId: string,
  scValKey: StellarSdk.xdr.ScVal
): StellarSdk.xdr.LedgerKey {
  return StellarSdk.xdr.LedgerKey.contractData(
    new StellarSdk.xdr.LedgerKeyContractData({
      contract: StellarSdk.Address.fromString(contractId).toScAddress(),
      key: scValKey,
      durability: StellarSdk.xdr.ContractDataDurability.persistent(),
    })
  );
}

/**
 * Extends the TTL of a specific persistent data entry.
 */
export async function extendPersistentDataTtl(
  rpcUrl: string,
  networkPassphrase: string,
  contractId: string,
  scValKey: StellarSdk.xdr.ScVal,
  extendToLedgers: number,
  sourceKeypair: StellarSdk.Keypair
) {
  const server = new StellarSdk.rpc.Server(rpcUrl);
  const account = await server.getAccount(sourceKeypair.publicKey());
  const fee = "100";

  const persistentKey = buildPersistentDataLedgerKey(contractId, scValKey);

  const sorobanData = new StellarSdk.SorobanDataBuilder()
    .setReadOnly([persistentKey])
    .build();

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee,
    networkPassphrase,
  })
    .setSorobanData(sorobanData)
    .addOperation(
      StellarSdk.Operation.extendFootprintTtl({ extendTo: extendToLedgers })
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(transaction);
  prepared.sign(sourceKeypair);
  const result = await server.sendTransaction(prepared);
  return result;
}
