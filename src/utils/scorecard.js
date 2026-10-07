// Weekly rep score for the Leaderboard tab, using the Friday scorecard
// sheet's weights (scripts/scorecard-lib.mjs fills the same four numbers):
// contracts 35, projected $ 15, offers 15, opps opened 10. The sheet's CRM
// checklist (25) is filled in by hand, so it's left out and the rest is
// scaled to 100. No contract this week caps the score at 89, like the sheet.
import { KPI_TARGETS } from '../data/config.js';
import { addDays, laToday, weekStart } from './historyRange.js';

// Pods from the scorecard sheet. Pod leads (Anthony, Sam) and Patrick are on
// the leaderboard but not in a pod score.
export const PODS = [
  { name: 'Pod A', lead: 'anthony', reps: ['spencer_brown', 'axel', 'cayden_sicz'] },
  { name: 'Pod B', lead: 'sam_mackenzie', reps: ['danni_brown', 'daniel', 'prince_pharrams'] },
];

const WEIGHTS = { contracts: 35, projected: 15, offers: 15, opps: 10 };
const WEIGHT_TOTAL = WEIGHTS.contracts + WEIGHTS.projected + WEIGHTS.offers + WEIGHTS.opps;

// Week # of month the sheet uses: which week the week's Friday falls in.
export function weekOfMonth(dateStr) {
  const friday = addDays(weekStart(dateStr), 4);
  return Math.ceil(Number(friday.slice(8, 10)) / 7);
}

// Raw numbers for one rep from a list of pairs (data.json or a history
// entry). Projected $ = revenue closed this month + Assigned deal value;
// history entries carry no deals, so there it's revenue only.
export function repNumbers(pairs, repId) {
  const mine = pairs.filter((p) => p.repId === repId);
  const sum = (k) => mine.reduce((a, p) => a + (Number(p[k]) || 0), 0);
  const assigned = mine
    .flatMap((p) => p.deals || [])
    .filter((d) => d.stage === 'assigned')
    .reduce((a, d) => a + (Number(d.value) || 0), 0);
  return {
    contracts: sum('contractsWeek'),
    offers: sum('offersWeek'),
    opps: sum('oppsOpenedWeek'),
    projected: sum('revenueMonth') + assigned,
  };
}

export function score(n, wom) {
  const part = (v, target, w) => (target > 0 ? Math.min(1, v / target) * w : 0);
  const raw =
    part(n.contracts, KPI_TARGETS.contractsPerWeek, WEIGHTS.contracts) +
    part(n.projected, (KPI_TARGETS.revenuePerRepMonth / 4) * wom, WEIGHTS.projected) +
    part(n.offers, KPI_TARGETS.offersPerWeek, WEIGHTS.offers) +
    part(n.opps, KPI_TARGETS.oppsOpenedPerWeek, WEIGHTS.opps);
  const s = Math.round((raw / WEIGHT_TOTAL) * 100);
  return n.contracts === 0 ? Math.min(89, s) : s;
}

// Reps ranked by score (ties: more contracts, then name).
export function rankReps(reps, pairs, wom) {
  return reps
    .map((rep) => {
      const n = repNumbers(pairs, rep.id);
      return { rep, ...n, score: score(n, wom) };
    })
    .sort((a, b) => b.score - a.score || b.contracts - a.contracts || a.rep.name.localeCompare(b.rep.name));
}

// Last week's final ranking from history.json: the newest snapshot dated in
// the previous Mon–Sun week. Returns { repId: rank } or null if none on file.
export function lastWeekRanks(reps, entries, today = laToday()) {
  const thisMon = weekStart(today);
  const lastMon = addDays(thisMon, -7);
  const entry = [...entries].reverse().find((e) => e.date >= lastMon && e.date < thisMon);
  if (!entry) return null;
  const ranked = rankReps(reps, entry.pairs || [], weekOfMonth(lastMon));
  return Object.fromEntries(ranked.map((r, i) => [r.rep.id, i + 1]));
}

export const scoreTone = (s) =>
  s >= 90 ? { color: '#059669', label: 'STRONG' }
  : s >= 75 ? { color: '#d97706', label: 'WATCH' }
  : { color: '#dc2626', label: 'RED' };
