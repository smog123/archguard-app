# Registry Contract Reference

```
Registry: CDAONHGO63LZKXO42LJTZWGFP5VZRZJXREMU7VCAWDILXKHSPBZXZ6RA
Extender: CBCK4CYVWNPVC3SJAQXUYYZUOWEKX7DQQJNNU25KZWHD43TICNIORWRF
Network: Testnet
```

The `archguard-registry` contract maintains the on-chain watch-list of entries monitored by Archguard.

## Data Structures

### `Durability`
```rust
pub enum Durability {
    Instance,
    Persistent,
}
```

### `OrgConfig`
```rust
pub struct OrgConfig {
    pub admin: Address,
    pub notify_webhook: BytesN<32>,
    pub active: bool,
}
```

### `WatchedEntry`
```rust
pub struct WatchedEntry {
    pub id: u64,
    pub org: Address,
    pub contract_id: Address,
    pub durability: Durability,
    pub key: Option<Bytes>,
    pub extend_threshold_ledgers: u32,
    pub extend_to_ledgers: u32,
    pub auto_extend: bool,
    pub created_at: u64,
}
```

---

## Public Functions

### `init`

Initializes the registry contract and seeds the watched entry ID counter.

```rust
pub fn init(env: Env)
```

- **Parameters**: `env: Env`
- **Return Type**: `()`
- **Auth Requirement**: None (anyone can initialize; panics if called more than once).
- **Practical Trigger**: Invoked once during contract deployment and deployment verification.

---

### `register_org`

Registers a new organization and stores its configuration.

```rust
pub fn register_org(env: Env, org: Address, admin: Address, notify_webhook: BytesN<32>)
```

- **Parameters**:
  - `env`: `Env`
  - `org`: `Address`
  - `admin`: `Address`
  - `notify_webhook`: `BytesN<32>` (SHA-256 hash of notification webhook URL)
- **Return Type**: `()`
- **Auth Requirement**: `org.require_auth()`
- **Practical Trigger**: Called by an organization administrator when onboarding to Archguard.

---

### `add_watched_entry`

Adds a new watched contract entry for an organization and assigns a unique entry ID.

```rust
pub fn add_watched_entry(
    env: Env,
    org: Address,
    contract_id: Address,
    durability: Durability,
    key: Option<Bytes>,
    extend_threshold_ledgers: u32,
    extend_to_ledgers: u32,
    auto_extend: bool,
) -> Result<u64, Error>
```

- **Parameters**:
  - `env`: `Env`
  - `org`: `Address`
  - `contract_id`: `Address`
  - `durability`: `Durability`
  - `key`: `Option<Bytes>` (`None` when watching the contract instance)
  - `extend_threshold_ledgers`: `u32`
  - `extend_to_ledgers`: `u32`
  - `auto_extend`: `bool`
- **Return Type**: `Result<u64, Error>`
- **Auth Requirement**: `org.require_auth()`
- **Practical Trigger**: Called by an organization admin from the dashboard to add a contract instance or storage key to the watch-list.

---

### `remove_watched_entry`

Removes a watched entry from the registry.

```rust
pub fn remove_watched_entry(env: Env, org: Address, entry_id: u64) -> Result<(), Error>
```

- **Parameters**:
  - `env`: `Env`
  - `org`: `Address`
  - `entry_id`: `u64`
- **Return Type**: `Result<(), Error>`
- **Auth Requirement**: `org.require_auth()`
- **Practical Trigger**: Called by an organization admin to stop tracking a contract entry.

---

### `update_entry_policy`

Updates extension policy parameters for an existing watched entry.

```rust
pub fn update_entry_policy(
    env: Env,
    org: Address,
    entry_id: u64,
    extend_threshold_ledgers: u32,
    extend_to_ledgers: u32,
    auto_extend: bool,
) -> Result<(), Error>
```

- **Parameters**:
  - `env`: `Env`
  - `org`: `Address`
  - `entry_id`: `u64`
  - `extend_threshold_ledgers`: `u32`
  - `extend_to_ledgers`: `u32`
  - `auto_extend`: `bool`
- **Return Type**: `Result<(), Error>`
- **Auth Requirement**: `org.require_auth()`
- **Practical Trigger**: Called by an organization admin to adjust TTL thresholds or toggle automatic extension.

---

### `get_org_entries`

Retrieves all watched entries owned by an organization in insertion order.

```rust
pub fn get_org_entries(env: Env, org: Address) -> Result<Vec<WatchedEntry>, Error>
```

- **Parameters**:
  - `env`: `Env`
  - `org`: `Address`
- **Return Type**: `Result<Vec<WatchedEntry>, Error>`
- **Auth Requirement**: None (read-only query).
- **Practical Trigger**: Called by the off-chain keeper service and web dashboard to list monitored entries.

---

### `get_entry`

Retrieves a single watched entry by its unique entry ID.

```rust
pub fn get_entry(env: Env, entry_id: u64) -> Result<WatchedEntry, Error>
```

- **Parameters**:
  - `env`: `Env`
  - `entry_id`: `u64`
- **Return Type**: `Result<WatchedEntry, Error>`
- **Auth Requirement**: None (read-only query).
- **Practical Trigger**: Called by keeper workers or UI detail components to inspect an individual entry.

---

### `deactivate_org`

Deactivates an organization, preventing it from adding new watched entries.

```rust
pub fn deactivate_org(env: Env, org: Address) -> Result<(), Error>
```

- **Parameters**:
  - `env`: `Env`
  - `org`: `Address`
- **Return Type**: `Result<(), Error>`
- **Auth Requirement**: `org.require_auth()`
- **Practical Trigger**: Called by an organization admin to pause management operations.
