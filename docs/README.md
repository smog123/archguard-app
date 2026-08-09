# Archguard Documentation

Welcome to the documentation for **Archguard** — automated time-to-live (TTL) monitoring and extension infrastructure for Soroban smart contracts on the Stellar network.

Archguard protects deployed Soroban smart contracts and storage entries from unexpected state archival. It allows teams to register contract entries for automated monitoring, fund a native XLM balance, and rely on off-chain keeper services to renew TTL footprints before expiry thresholds are reached.

## Documentation Overview

- **[Introduction](introduction.md)**: The underlying Stellar state archival problem, how Archguard works step-by-step, and its core operational architecture.
- **[Protocol Mechanics](protocol-mechanics.md)**: Detailed lifecycle of watched entries, the native XLM fee debit model, and a worked execution example with real ledger metrics.
- **[Registry Contract Reference](contract-reference/registry.md)**: Specification and function interface for `archguard-registry`.
- **[Extender Contract Reference](contract-reference/extender.md)**: Specification and function interface for `archguard-extender`.
- **[For Teams Guide](guides/for-teams.md)**: Step-by-step instructions for organization administrators using the web dashboard.
- **[For Keeper Operators Guide](guides/for-keeper-operators.md)**: Operations guide for running and monitoring the off-chain keeper service.
- **[Local Setup](developers/local-setup.md)**: Environment setup for developing and running contract, SDK, indexer, and web applications locally.
- **[SDK Reference](developers/sdk-reference.md)**: TypeScript SDK usage guide for `RegistryClient` and `ExtenderClient`.
- **[API Reference](developers/api-reference.md)**: HTTP interface specification for the keeper service.
- **[Contributing](contributing.md)**: Guidelines for contributing code and documentation to the Archguard project.
