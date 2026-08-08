import { Server, rpc } from "@stellar/stellar-sdk";
import * as StellarSdk from "@stellar/stellar-sdk";

/**
 * Shared helper to invoke a contract method via simulation (read-only) and return the ScVal result.
 */
export async function readContractValue(
  rpcUrl: string,
  networkPassphrase: string,
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[] = []
): Promise<StellarSdk.xdr.ScVal> {
  const server = new Server(rpcUrl);

  // Use a dummy account for read-only simulation (no signature required)
  const dummyKeypair = StellarSdk.Keypair.random();
  const account = new StellarSdk.Account(dummyKeypair.publicKey(), "0");

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: "100",
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.invokeContractFunction({
        contract: contractId,
        function: method,
        args,
      })
    )
    .setTimeout(30)
    .build();

  const simResponse = await server.simulateTransaction(transaction);

  if (rpc.isSimulationError(simResponse)) {
    throw new Error(`Soroban simulation error invoking ${method}: ${simResponse.error}`);
  }

  if (!simResponse.result || !simResponse.result.retval) {
    throw new Error(`Soroban simulation of ${method} did not return a value`);
  }

  return simResponse.result.retval;
}
