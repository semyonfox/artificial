# Artificial

A browser-based civilization incremental game built with JavaScript, Svelte and Vite. Guide a civilization through resource loops, worker automation, upgrades and progression across multiple historical and speculative eras.

## Highlights

- Resource production and consumption chains.
- Worker automation, offline progress and local save persistence.
- Upgrades, achievements, prestige, specializations, trade routes and wonders.
- Modular JavaScript game systems coordinated by a `GameManager` and surfaced through a reactive Svelte UI.
- Validated save import/export with migration and defensive handling of malformed data.
- Node-based tests for progression rules, offline production, formatting and save-import edge cases.
- Docker and Jenkins configuration for verification and a commit-pinned rebuild.

## Technology

JavaScript · Svelte 5 · Vite · Tailwind CSS · Node test runner · Docker · Jenkins

## Run locally

CI and Docker use Node.js 26; the package manifest pins pnpm 11.18.0.

```bash
pnpm install
pnpm dev
```

## Validate

```bash
pnpm check
```

Run `pnpm test` or `pnpm build` individually when iterating on a focused change.

`pnpm check` runs the Node test suite and Vite build. The GitHub Actions
workflow runs that command for pull requests and pushes to `main`, then checks
the Docker build inputs. Jenkins checks out `main`, runs the same command,
and rebuilds the Docker image from the verified commit in its separate deploy
checkout. The build made by `pnpm check` is a verification artifact; Jenkins
does not deploy that exact `dist/` directory.

## Repository map

| Path | Purpose |
| --- | --- |
| `src/` | Svelte UI, components and reactive store |
| `js/` | game state, resources, workers, progression and feature systems |
| `tests/` | Node-based tests |

This is a game project, deliberately kept separate from the backend/platform work elsewhere on this profile.


### Anonymous reporting

Reporting is off by default. No service endpoint is included. To make the optional privacy switch available, an owner build must explicitly set `VITE_ANONYMOUS_TELEMETRY_ENABLED=true` and `VITE_ANONYMOUS_TELEMETRY_ENDPOINT` to an HTTPS endpoint ending in `/v1/events`, or an equivalent relative same-origin proxy. The player must then enable the switch in Privacy; Do Not Track and Global Privacy Control still prevent sending.

Only fixed screen counts and error categories are sent. Save contents, resource totals, input text, URLs and visitor identifiers are excluded. Requests omit credentials and referrers, time out after two seconds, and have no retries. Collection requires a separately configured self-hosted service; this application does not deploy or enable one.
