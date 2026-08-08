import { Server } from "@stellar/stellar-sdk";
import * as StellarSdk from "@stellar/stellar-sdk";

/**
 * Shared helper to submit a state-changing contract transaction, sign it, poll for its completion,
 * and return the ScVal result value if any.
 */
export async function submitTransaction(
  rpcUrl: string,
  networkPassphrase: string,
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  signer: StellarSdk.Keypair
): Promise<StellarSdk.xdr.ScVal | undefined> {
  const server = new Server(rpcUrl);

  const account = await server.getAccount(signer.publicKey());

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "100", // base inclusion fee
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

  // prepareTransaction simulates execution and adds the necessary resource fee and footprint
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(signer);

  const sendResult = await server.sendTransaction(prepared);
  if (sendResult.status === "ERROR") {
    throw new Error(
      `Transaction submission failed: ${sendResult.errorResultXdr || "unknown error"}`
    );
  }

  const pollResult = await server.pollTransaction(sendResult.hash, {
    attempts: 30, // up to 30 seconds
  });

  if (pollResult.status === "SUCCESS") {
    return pollResult.returnValue;
  } else if (pollResult.status === "FAILED") {
    throw new Error(
      `Transaction failed: ${pollResult.resultXdr?.toXDR("base64") || "no result XDR"}`
    );
  } else {
    throw new Error(`Transaction execution failed with status: ${pollResult.status}`);
  }
}
