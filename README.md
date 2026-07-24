# Lastlight

Lastlight is a free 1–4 player browser bullet-heaven prototype with original characters, artwork, maps, enemies, upgrades, and events.

The production game is published from this repository at
[bensonperry.com/lastlight](https://bensonperry.com/lastlight/). A push to
`master` runs the complete test suite and deploys only after every check passes.

## Local use

Serve the repository root over HTTP, then open `/`. Solo requires no backend.

Multiplayer uses a small Cloudflare-hosted server in `worker/` to connect
players in the same room. Single-player and ordinary website changes do not
need it. Benson owns its production deployment.

For local multiplayer testing, run that server and open the frontend with the
local server override:

```text
http://localhost:4173/?relay=ws://localhost:8787/room/
```

## Balance contract

Simulation tuning lives in `balance-config.js`. Every contract revision must:

1. change `BALANCE_VERSION`;
2. update the canonical `BALANCE_HASH` assertion in `tests/balance-config.test.js`;
3. keep the catalog and runtime equivalence tests green; and
4. record both values in replay or fixture headers.

The contract is recursively immutable and `getBalanceConfig(version)` rejects
unknown versions rather than silently running them with current values.

## Runtime rollback controls

The browser loads a strict, identity-free runtime config from the multiplayer server before
deployment. Operator controls, emergency procedures, and the complete allowlist
are documented in `worker/FEATURE-FLAGS.md`.

## Motion assets

Directional atlas metadata, safe fallbacks, and the exact outstanding authored
art matrix are documented in `MOTION-ASSETS.md`.

## Multiplayer protocol

Sequenced input, snapshot acknowledgements, rolling compatibility, and replay
boundaries are documented in `MULTIPLAYER-PROTOCOL.md`.

Squad synergy state uses the same deterministic contract: the runtime flag and
registry version are pinned in replay headers, interrupted-run recovery, and
host-migration compatibility. Only allowlisted team-level synergy aggregates
are accepted by run telemetry; see `worker/TELEMETRY.md` for the schema and
privacy limits.

Shared participation credit is pinned by anonymous replay slot across replay,
interrupted-run recovery, reconnect, and host migration. Only effective support,
actual prevention, qualified assists, completed revive work, objective work,
and elite/apex participation count. Telemetry receives aggregate totals only.

## Checks

- `npm run check`
- `npm test`
- `npm test --prefix worker`

The GitHub Actions workflow also verifies deterministic sprite and motion
atlases, fixture reports, the multiplayer soak, and the multiplayer server before production
deployment.
