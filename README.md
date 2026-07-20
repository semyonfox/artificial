# Artificial

A browser-based civilization incremental game built with JavaScript, Svelte and Vite. Guide a civilization through resource loops, worker automation, upgrades and progression across multiple historical and speculative eras.

## Highlights

- Resource production and consumption chains.
- Worker automation, offline progress and local save persistence.
- Upgrades, achievements, prestige, specializations, trade routes and wonders.
- Modular JavaScript game systems coordinated by a `GameManager` and surfaced through a reactive Svelte UI.
- Validated save import/export with migration and defensive handling of malformed data.
- Node-based tests for progression rules, offline production, formatting and save-import edge cases.
- Docker and Jenkins configuration for reproducible build/deployment artifacts.

## Technology

JavaScript · Svelte 5 · Vite · Tailwind CSS · Node test runner · Docker · Jenkins

## Run locally

```bash
pnpm install
pnpm dev
```

## Validate

```bash
pnpm test
pnpm build
```

## Repository map

| Path | Purpose |
| --- | --- |
| `src/` | Svelte UI, components and reactive store |
| `js/` | game state, resources, workers, progression and feature systems |
| `tests/` | Node-based tests |
| `scripts/` | balance simulation tooling |

This is a game project, deliberately kept separate from the backend/platform work elsewhere on this profile.
