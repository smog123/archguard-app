# Extender Contract Reference

```
Registry: CDAONHGO63LZKXO42LJTZWGFP5VZRZJXREMU7VCAWDILXKHSPBZXZ6RA
Extender: CBCK4CYVWNPVC3SJAQXUYYZUOWEKX7DQQJNNU25KZWHD43TICNIORWRF
Network: Testnet
```

The `archguard-extender` contract manages fund custody and extension fee accounting for Archguard.

## Data Structures

### `Operator`
```rust
pub struct Operator {
    pub operator: Address,
    pub native_asset: Address,
}
```

---

## Public Functions

### `init`

Initializes the extender contract with the operator (keeper) address and the native XLM Stellar Asset Contract (SAC) address.

```rust
pub fn init(env: Env, operator: Address, native_asset: Address)
```

- **Parameters**:
  - `env`: `Env`
  - `operator`: `Address` (keeper account authorized to record costs)
  - `native_asset`: `Address` (network native XLM SAC address)
- **Return Type**: `()`
- **Auth Requirement**: None (anyone can initialize; panics if called more than once).
- **Practical Trigger**: Invoked once during contract deployment.

---

### `deposit`

Deposits native XLM from an organization into custody and credits its prepaid balance in stroops.

```rust
pub fn deposit(env: Env, org: Address, amount: i128) -> Result<(), Error>
```

- **Parameters**:
  - `env`: `Env`
  - `org`: `Address` (depositor organization)
  - `amount`: `i128` (deposit amount in stroops; must be `> 0`)
- **Return Type**: `Result<(), Error>`
- **Auth Requirement**: `org.require_auth()`
- **Practical Trigger**: Called by an organization administrator via the web dashboard to prepay XLM for contract maintenance.

---

### `withdraw`

Withdraws native XLM from custody back to the organization and debits its prepaid balance in stroops.

```rust
pub fn withdraw(env: Env, org: Address, amount: i128) -> Result<(), Error>
```

- **Parameters**:
  - `env`: `Env`
  - `org`: `Address`
  - `amount`: `i128` (withdrawal amount in stroops; must be `> 0`)
- **Return Type**: `Result<(), Error>`
- **Auth Requirement**: `org.require_auth()`
- **Practical Trigger**: Called by an organization admin to reclaim unspent prepaid XLM.

---

### `record_extension_cost`

Debits a keeper-charged extension cost from an organization's prepaid balance in stroops.

```rust
pub fn record_extension_cost(env: Env, org: Address, cost: i128) -> Result<(), Error>
```

- **Parameters**:
  - `env`: `Env`
  - `org`: `Address`
  - `cost`: `i128` (extension transaction fee cost in stroops; must be `>= 0`)
- **Return Type**: `Result<(), Error>`
- **Auth Requirement**: Operator authority (`op.operator.require_auth()`).
- **Practical Trigger**: Called by the off-chain keeper after executing an `ExtendFootprintTTLOp` transaction on-chain.

> [!NOTE]
> If `balance < cost`, the function emits an `insufficient_balance` event and returns `Ok(())` without modifying the balance or reverting, ensuring keeper processing remains unblocked while emitting diagnostic events.

---

### `get_balance`

Returns an organization's prepaid balance in stroops (`0` if unfunded).

```rust
pub fn get_balance(env: Env, org: Address) -> i128
```

- **Parameters**:
  - `env`: `Env`
  - `org`: `Address`
- **Return Type**: `i128`
- **Auth Requirement**: None (read-only query).
- **Practical Trigger**: Called by the dashboard and keeper indexer to verify organization balances.

---

### `set_operator`

Updates the designated keeper operator address.

```rust
pub fn set_operator(env: Env, new_operator: Address) -> Result<(), Error>
```

- **Parameters**:
  - `env`: `Env`
  - `new_operator`: `Address`
- **Return Type**: `Result<(), Error>`
- **Auth Requirement**: Current operator authority (`op.operator.require_auth()`).
- **Practical Trigger**: Invoked during keeper address rotations or infrastructure migrations.
