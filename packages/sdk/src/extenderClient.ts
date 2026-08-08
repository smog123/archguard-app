import * as StellarSdk from "@stellar/stellar-sdk";
import { readContractValue } from "./readContractValue";
import { submitTransaction } from "./submitTransaction";

export class ExtenderClient {
  constructor(
    public contractId: string,
    public rpcUrl: string,
    public networkPassphrase: string
  ) {}

  /**
   * Deposits native XLM from org into the extender's custody and credits its balance (in stroops).
   */
  async deposit(org: StellarSdk.Keypair, amountStroops: bigint): Promise<void> {
    const scValOrg = StellarSdk.Address.fromString(org.publicKey()).toScVal();
    const scValAmount = StellarSdk.nativeToScVal(amountStroops, { type: "i128" });

    await submitTransaction(
      this.rpcUrl,
      this.networkPassphrase,
      this.contractId,
      "deposit",
      [scValOrg, scValAmount],
      org
    );
  }

  /**
   * Withdraws native XLM from the extender back to org (in stroops).
   */
  async withdraw(org: StellarSdk.Keypair, amountStroops: bigint): Promise<void> {
    const scValOrg = StellarSdk.Address.fromString(org.publicKey()).toScVal();
    const scValAmount = StellarSdk.nativeToScVal(amountStroops, { type: "i128" });

    await submitTransaction(
      this.rpcUrl,
      this.networkPassphrase,
      this.contractId,
      "withdraw",
      [scValOrg, scValAmount],
      org
    );
  }

  /**
   * Records a keeper-charged extension cost against the org's prepaid balance (in stroops).
   */
  async recordExtensionCost(
    operator: StellarSdk.Keypair,
    org: string,
    costStroops: bigint
  ): Promise<void> {
    const scValOrg = StellarSdk.Address.fromString(org).toScVal();
    const scValCost = StellarSdk.nativeToScVal(costStroops, { type: "i128" });

    await submitTransaction(
      this.rpcUrl,
      this.networkPassphrase,
      this.contractId,
      "record_extension_cost",
      [scValOrg, scValCost],
      operator
    );
  }

  /**
   * Returns the organization's prepaid balance in stroops. Read-only.
   */
  async getBalance(org: string): Promise<bigint> {
    const scValOrg = StellarSdk.Address.fromString(org).toScVal();
    const result = await readContractValue(
      this.rpcUrl,
      this.networkPassphrase,
      this.contractId,
      "get_balance",
      [scValOrg]
    );

    return StellarSdk.scValToNative(result) as bigint;
  }
}
