# VPG Dashboard LAB — Claude briefing

This repo is a **test copy** of the live VPG KPI dashboard
(github.com/vpg-realty/dashboard → https://vpg-realty.github.io/dashboard/).
It publishes to https://vpg-realty.github.io/dashboard-lab/. Try UI changes
here; port the ones Luke likes to the live repo by PR.

**Rule #1: the lab must never affect the live dashboard.**

## How it works

- Same React + Vite code as live, copied from live `main`.
- **No GHL access, no secrets.** The browser reads the live site's
  `/dashboard/data.json` and `/dashboard/history.json` via `VITE_DATA_BASE`
  (`src/data/liveStore.js`). Read-only.
- `.github/workflows/deploy.yml` runs on push to `main`, `workflow_dispatch`
  and once a day. It downloads the live `subaccounts.json` from
  raw.githubusercontent.com, builds with
  `VITE_BASE=/dashboard-lab/ VITE_USE_LIVE=1 VITE_DATA_BASE=/dashboard/ VITE_LAB=1`,
  and publishes to Pages. No snapshot, history or sticky-count steps.
- `VITE_LAB=1` (`IS_LAB` in `src/data/config.js`) hides the Refresh and
  Sub-Accounts buttons and shows a yellow **LAB** badge in the header.
- `REPO_NAME` is `dashboard-lab`, so any GitHub API call the code could
  make targets this repo, never the live one.

## Rules

- Never add GHL tokens, `PIT_*` secrets, `GHL_TOKENS`, or a snapshot /
  append-history step. The live site is the only thing that talks to GHL.
- Never re-add `pinger.yml` or `scorecard.yml` (the scorecard writes to
  Luke's real Google Sheet).
- Never point `REPO_NAME`, `VITE_BASE` or any write at `dashboard`.
- Keep the deploy cadence low (push + daily). The lab shares the
  vpg-realty.github.io Pages host with live.
- The lab and live share an origin (vpg-realty.github.io), so they share
  localStorage. The lab only uses `vpg-lab.*` keys (`STORAGE_PREFIX` in
  `config.js`) and never caches the snapshot/history there, so it can't
  touch live's `vpg.*` keys (cached snapshot, celebrated deals, cycle speed,
  PAT) or eat into the shared quota. Every new localStorage key must use
  `STORAGE_PREFIX`.
- `server/`, `scripts/` and `subaccounts.json` are copies kept so the code
  matches live; the lab workflow doesn't run them (except that
  `subaccounts.json` is overwritten with the live one at build time).
- The live repo's CLAUDE.md (in `vpg-realty/dashboard`) documents the views,
  KPIs and data model. Read it for anything about what the dashboard shows.

## Syncing from live

Lab `main` has live `main` in its history, so a sync is a merge:

```
git fetch https://github.com/vpg-realty/dashboard.git main:live-main
git merge live-main
```

Keep the lab side of any conflict in the lab-only edits: `VITE_DATA_BASE`
in `liveStore.js`, `IS_LAB` / `STORAGE_PREFIX` / `REPO_NAME` in
`config.js` and the files that use them, the `IS_LAB` checks in
`Header.jsx`, this CLAUDE.md, `README.md`, the lab `deploy.yml`, and no
`pinger.yml` / `scorecard.yml`. Then `npm run lint && npm run build` before
pushing. Data is always live regardless; syncing only matters before
building or porting an experiment.
