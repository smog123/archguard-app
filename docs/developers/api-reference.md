# API Reference

The Archguard keeper service (`indexer`) runs as an automated background polling daemon.

## HTTP Health Endpoint

The indexer exposes a single HTTP health check server used for web service process monitoring (e.g. on Render or Docker deployments).

### `GET /`

Returns the operational status, service identifier, configured network, and current ISO timestamp.

- **Request**: `GET /`
- **Response Headers**: `Content-Type: application/json`
- **Status Code**: `200 OK`
- **Response Body**:
  ```json
  {
    "status": "ok",
    "service": "archguard-indexer",
    "network": "testnet",
    "timestamp": "2026-08-08T21:30:00.000Z"
  }
  ```

---

## Documented API Surface Gap

The keeper service does not currently expose external REST or RPC HTTP endpoints for querying watched entries, triggering manual poll runs, or modifying organization settings.

All state reads and transaction submissions occur directly between the indexer daemon and the Stellar RPC network via `@archguard/sdk` and `@stellar/stellar-sdk`.
