# Hand-off: recommended dashboard redesign ("VPG Sales Floor")

Written by the Claude session that maintains the live dashboard
(vpg-realty/dashboard) for the lab session. Luke asked for these
recommendations in that chat; this folder carries them over so the lab can
build them. Everything here was a **mockup with sample numbers** — none of it
is on the live site.

- `screenshots/` — what each screen looked like (1920×1080).
- `concept-code/` — the throwaway mockup components (React + Tailwind,
  Recharts), written against this codebase's data layer
  (`PAIRS`, `REPS`, `MARKETS`, `KPI_TARGETS`, `TEAM_TARGETS`, `tierTotals`,
  `utils/pace.js`, `utils/historyRange.js`). Several values in them are
  hard-coded sample data (marked "sample"/"MOCKUP"); the lab version must
  compute them from real data as described below.

## The idea in one line

Split the board in two: **the TV is for motivation and urgency** (few big
numbers, who's winning, are we on pace, what needs doing today, wins), and
**manager pages are for diagnosis** (why someone is behind). Best-practice
sales-floor boards (Spinify / Hoopla style) work this way.

## Tabs

TV rotation (4 screens, ~20 s each) — `ConceptShell.jsx`, `TvViews.jsx`:

1. **Today** (`sales-floor-today.png`) — 5 big tiles: conversations today,
   opps opened (wk), offers (wk), contracts (mo), revenue (mo). Each graded
   against **pace** (target × share of week/month gone, `utils/pace.js`) with
   ON PACE / NEAR PACE / BEHIND, a pace tick on the bar, and **"▲ N (+x%) vs
   last wk"** = this week so far vs last week at the same point (from
   `history.json`). Below: "Needs attention today" list (IP ends today, DISPO
   deals with IP ending ≤2 days, closings today/tomorrow, IP ends tomorrow,
   reps with 0 conversations) and a "Latest wins" feed (closed / to DISPO /
   under contract, from `pair.deals` `stageSince`).
2. **Leaderboard** — reps ranked by a weekly score using the **Friday
   scorecard's weights**: contracts 35, projected $ 15 (MTD revenue +
   Assigned-stage deal value, vs $25k/4 × week-of-month), offers 15, opps 10;
   CRM (25) is manual so it's excluded and the rest scaled to 100; zero
   contracts caps at 89 (same as the sheet). Medals for top 3, ▲/▼ movement
   vs last week (needs last week's score from history). Right side: **Pod
   battle** — Pod A (lead Anthony: Spencer, Axel, Cayden) vs Pod B (lead Sam:
   Danni, Daniel, Rory), pod score = average of its reps. Patrick isn't in a
   pod. Thresholds: ≥90 STRONG, ≥75 WATCH, else RED.
3. **Activity** — conversations today by rep (bars, week total under each),
   team conversations this week vs last week by day (the live site already
   has this: `teamConvosByDay` in `utils/historyRange.js`), active agent
   count (T1+T2+T3) with added-this-week and tier bars, and a one-row strip of
   states sorted by today's conversations. Replaces the separate
   Conversations + Agents tabs.
4. **Pipeline** — stage tiles (Under Contract, DISPO Active, Assigned,
   Closed this month: count + $ value; "avg days in stage" was sample text —
   compute it or drop it) and a **7-day deadline calendar**: one column per
   day (today highlighted), chips for IP ends (purple) and COE/closings
   (green) with address, rep, value.

Manager pages (click-only, never on the TV) — `ManagerViews.jsx`:

5. **Revenue & Forecast** — closed so far / forecast / gap to goal; forecast
   bar = closed + each open stage's value × its usual close rate (sample
   rates: Assigned 90%, DISPO 55%, Under Contract 30% — real rates should be
   learned from deal history, or set by Luke until there's enough), goal
   line, a table showing the working, and per-rep closed + expected bars.
6. **Coaching** — per rep: conversion at each step (convo→opp, opp→offer,
   offer→contract, contract→close) vs the team rate (cells blue = better,
   orange = worse, grey ±15%), "biggest leak" column, and an 8-week weekly
   score sparkline. Caveat to show on the page: rates are this month's counts
   divided stage to stage, not cohorts. Kept off the TV deliberately.
7. **Advanced** — the existing drill-down for now; see below.

## Advanced rework (Luke liked it, said "not yet")

`AdvancedMock.jsx`, `advanced-by-rep.png`, `advanced-by-market.png`: one
table, every rep's KPIs side by side (Activity: convos, agents added ·
Pipeline: opps, offers, contracts vs per-rep target with small bars ·
Results: closed, revenue · Fallout: aban, lost), a black Team total row, rows
expand into the rep's states. "By market" toggle flips it: states as rows
(no targets — targets are per rep), expanding into the reps working them.
Keep the existing period picker (any week / month / custom range) — the
history engine (`computeRange` in `utils/historyRange.js`) already works per
rep × market, so the whole table can switch periods.

## Already on the live dashboard (don't rebuild, just reuse)

Celebration banners (DISPO / Closed), the needs-attention strip, pace grading
(`utils/pace.js`, `KpiCard pace`), Opportunities leaderboards with week +
month bars, Master funnel + revenue goal bar with pace marker, and the
Conversations this-week-vs-last-week chart (`teamConvosByDay`).

## Suggested order for the lab

1. Leaderboard (with pod battle) — easiest, biggest morale impact.
2. Pipeline deadline calendar.
3. Today screen (needs week-over-week deltas from history).
4. Revenue & Forecast, then Coaching.
5. Advanced table rework.
